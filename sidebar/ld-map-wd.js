import { sparqlQuery } from "../sqarql-query.js";
import { makeLanguageValid } from '../get-valid-string-languages.js';

function convertHTMLentities(string) {
	return string
		.replace(/&apos;/gm, "'")
		.replace(/&quot;/gm, '"')
		.replace(/&lt;/gm, '<')
		.replace(/&gt;/gm, '>')
		.replace(/&amp;/gm, '&')
}

function makeTypeAbsolute(data) {
	if (data.hasOwnProperty('@type')) {
		let type = data['@type'];
		if (data['@type'].match(/^https?:\/\/./)) {
			// seems to be a full url so its fine
			return data;
		} else {
			// data seems to be mission context
			if (data.hasOwnProperty('@context')) {
				// so lets apply context
				data['@type'] = `${data['@context']}/${data['@type']}`;
			} else {
				// there is no context and the type has a relative url.
				// lets assume schema.org is used.
				data['@type'] = `https://schema.org/${data['@type']}`;
			}
			return data;
		}
	}
}

function makeReferences(source) {
	let references = [];
	if (source?.url) {
		references.push(
			{
				"snaktype": "value",
				"property": "P854",
				"datavalue": {
					"value": source.url,
					"type": "string"
				},
				"datatype": "url"
			}
		)
		if (source?.title && source?.lang) {
			references.push(
				{
					"snaktype": "value",
					"property": "P1476",
					"datavalue": {
						"value": {
							text: source.title,
							language: source.lang,
						},
						"type": "monolingualtext"
					},
					"datatype": "string"
				}
			)
		}
	}
	let now = new Date();
	references.push({
		"snaktype": "value",
		"property": "P813",
		"datavalue": {
			"type": "time",
			"value": {
				"after": 0,
				"before": 0,
				"calendarmodel": "http://www.wikidata.org/entity/Q1985727",
				"precision": 11,
				"time": `+${ now.toISOString().substr(0,10) }T00:00:00Z`,
				"timezone": 0
			}
		}
	});
	return [references];
}

async function makeJobs (connections, source) {
	for (const i in connections) {
		if (connections[i].value.type === "Monolingualtext") {
			connections[i].jobs = [];
			for (const ii in connections[i].prop) {
				connections[i].jobs.push({
					label: connections[i].prop[ii],
					instructions: {
						type: 'set_claim',
						verb: connections[i].prop[ii],
						object: {
							'language': await makeLanguageValid(source.lang),
							'text': convertHTMLentities(connections[i].value.value),
						},
						references: makeReferences(source),
					}
			  });
			}
		}
		if (connections[i].value.type === "WikibaseItem") {
			connections[i].jobs = [];
			for (const ii in connections[i].prop) {
				connections[i].jobs.push({
					label: connections[i].prop[ii],
					instructions: {
						type: 'set_claim',
						verb: connections[i].prop[ii],
						object: {
							'entity-type': "item",
							'numeric-id': connections[i].value.value.replace(/^Q/, ''),
						},
						references: makeReferences(source),
					}
			  });
			}
		}
		if (connections[i].value.type === "Time") {
			connections[i].jobs = [];
			let dayPreciseDate = connections[i].value.value.substr(0, 10);
			let now = new Date();
			for (const ii in connections[i].prop) {
				connections[i].jobs.push({
					label: connections[i].prop[ii],
					instructions: {
						type: 'set_claim',
						verb: connections[i].prop[ii],
						object: {
							"after": 0,
							"before": 0,
							"calendarmodel": "http://www.wikidata.org/entity/Q1985727",
							"precision": 11,
							"time": `+${dayPreciseDate}T00:00:00Z`,
							"timezone": 0,
						},
						references: makeReferences(source),
					}
			  });
			}
		}
	}
	return connections
}

async function findMatchingClass(data) {
	if (!data.hasOwnProperty('@type')) {
		return false;
	} else {
		data = makeTypeAbsolute(data);
		let query = `
			SELECT ?item WHERE {
				{
					?item wdt:P1709 <${ data['@type'] }>;
				} UNION {
					?item wdt:P1709 <${ data['@type'].replace(/^http\:/, 'https:') }>;
				}
			}
		`;
		let entity = await sparqlQuery(query);
		if (entity[0]) {
			return entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1];
		} else {
			return false;
		}
	}
}

async function findMatchingProp(prop, type, namespace) {

	let query = `
		SELECT DISTINCT ?prop WHERE {
			{
				?item wdt:P1628 <${ namespace }/${ prop }>;
			} UNION {
				?item wdt:P1628 <${ namespace.replace(/^http\:/, 'https:') }/${ prop }>;
			}
			?item wikibase:propertyType wikibase:${type}.

			BIND (replace(str(?item), 'http://www.wikidata.org/entity/', '') AS ?prop)
		}
	`;
	let result = await sparqlQuery(query);
	if (result.length > 0) {
		return result.map((i) => { return i.prop.value })
	} else {
		return false;
	}
}

function isSameAsWdEntity(thing) {
	if (thing.hasOwnProperty('sameAs')) {
		let qid = thing.sameAs.match(/^https?:\/\/www\.wikidata\.org\/wiki\/(Q\d+)/);
		if (qid && qid.length > 0) {
			return qid[1];
		}
	} else {
		return false
	}
}

async function findConnections(thing, source) {
	if (!thing.hasOwnProperty('@context')) {
		return [];
	}
	let namespace = thing['@context'];
	let connections = [];
	let values = [];
	for (let prop in thing) {
		if (prop.startsWith('@')) {
			continue;
		}
		if (Array.isArray(thing[prop])) {
			for (let i in thing[prop]) {
				if (typeof thing[prop][i] === 'object' && thing[prop][i].hasOwnProperty('@type')) {
					let qid = isSameAsWdEntity(thing[prop][i]);
					if (qid) {
						values.push({
							type: 'WikibaseItem',
							value: qid,
							prop: prop,
						})
					}
				}
			}
		} else if (typeof thing[prop] === 'object' && thing[prop].hasOwnProperty('@type')) {
			let qid = isSameAsWdEntity(thing[prop]);
			if (qid) {
				values.push({
					type: 'WikibaseItem',
					value: qid,
					prop: prop,
				})
			}
		} else if (typeof thing[prop] === 'string') {
			if (thing[prop].match(/^https?:\/\/[^ ]$/)) {
				values.push({
					type: 'Url',
					value: thing[prop],
					prop: prop,
				})
			} else if (thing[prop].match(/^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+)|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d)|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d)|(\d{4}-[01]\d-[0-3]\d)$/)) {
				values.push({
					type: 'Time',
					value: thing[prop],
					prop: prop,
				})
			} else {
				values.push({
					type: 'Monolingualtext',
					value: convertHTMLentities(thing[prop]),
					prop: prop,
				})
			}
		}
	}
	if (values.length > 0) {
		for (let value of values) {
			let property = await findMatchingProp(value.prop, value.type, namespace);
			if (property) {
				connections.push({
					prop: property,
					value: value,
				});
			}
		}
	}

	return await makeJobs(connections, source);
}

export { findMatchingClass, findConnections, makeReferences }
