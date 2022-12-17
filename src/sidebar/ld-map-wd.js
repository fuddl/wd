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

function makeRating(props) {
	const best = props?.bestRating ? parseFloat(props.bestRating) : 5;
	const worst = props?.worstRating ? parseFloat(props.worstRating) : 1;
	const value = props.ratingValue;
	return `${props.ratingValue}/${best}`;
}

function durationToQuantity(data) {
	let h, m, s;
	const hMatch = data.match(/(\d+)H/);
	if (hMatch) {
		h = parseInt(hMatch[1]);
	}
	const mMatch = data.match(/(\d+)M/);
	if (mMatch) {
		m = parseInt(mMatch[1]);
	}
	const sMatch = data.match(/(\d+)S/);
	if (sMatch) {
		s = parseInt(sMatch[1]);
	}
	if (s) {
		if (m) {
			s = s + m * 60;
		}
		if (h) {
			s = s + h * 3600;
		}
		return {
			amount: `+${s}`,
			unit: "http://www.wikidata.org/entity/Q11574",
		};
	} else if (m) {
		if (h) {
			m = m + h * 60;
		}
		return {
			amount: `+${m}`,
			unit: "http://www.wikidata.org/entity/Q7727",
		};
	} else if (h) {
		return {
			amount: `+${h}`,
			unit: "http://www.wikidata.org/entity/Q25235",
		}
	}
	return false;
}

function makeTypeAbsolute(data) {
	if (data.hasOwnProperty('@type')) {
		let type = data['@type'];
		if (typeof data['@type'] === 'string' ) {
			if (data['@type'].match(/^https?:\/\/./)) {
				// seems to be a full url so its fine
				return data;
			} else {
				// data seems to be mission context
				if (data.hasOwnProperty('@context')) {
					// so lets apply context
					data['@type'] = `${data['@context'].replace(/\/$/, '')}/${data['@type']}`;
				} else {
					// there is no context and the type has a relative url.
					// lets assume schema.org is used.
					data['@type'] = `https://schema.org/${data['@type']}`;
				}
				return data;
			}
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
		if (connections[i].value.type === "String" || connections[i].value.type === "Quantity") {
			connections[i].jobs = [];
			for (const ii in connections[i].prop) {
				connections[i].jobs.push({
					label: connections[i].prop[ii],
					instructions: {
						type: 'set_claim',
						verb: connections[i].prop[ii],
						object: connections[i].value.value,
						references: makeReferences(source),
						qualifiers: connections[i].value?.qualifiers ? connections[i].value.qualifiers : null,
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
		if (!data) {
			return false;
		}
		const http = data['@type'].replace(/^https?\:/, 'http:')
		const https = data['@type'].replace(/^https?\:/, 'https:')
		let query = `
			SELECT DISTINCT ?i WHERE {
				{
					{
						?item wdt:P1709 <${ http }>;
					} UNION {
						?item wdt:P1709 <${ https }>;
					}
				} UNION {
					{
						?parent wdt:P1709 <${ http }>;
					} UNION {
						?parent wdt:P1709 <${ https }>;
					}
					?item wdt:P279 ?parent.
				}
				BIND (REPLACE(STR(?item), 'http://www.wikidata.org/entity/', '') AS ?i)

			}
			LIMIT 20
		`;

		let result = await sparqlQuery(query);
		if (result[0]) {
			return result.map((i) => { return i.i.value });
		} else {
			return false;
		}
	}
}

async function findMatchingProp(prop, type, namespace) {

	let query = `
		SELECT DISTINCT ?prop ?parent {
			{
				?property p:P1628/ps:P1628 <${ namespace.replace(/^https?\:/, 'https:') }/${ prop }>.
			} UNION {
				?property p:P1628/ps:P1628 <${ namespace.replace(/^https?\:/, 'http:') }/${ prop }>.
			}
			?property wikibase:propertyType wikibase:${type}.
			?subproperty wdt:P1647 * ?property.

			?subproperty p:P2302 ?psc.
			?psc ps:P2302 wd:Q53869507.
			?psc pq:P5314 wd:Q54828448.

			OPTIONAL { ?subproperty p:P1628 [ wikibase:rank ?rank ] }
			BIND (REPLACE(STR(?subproperty), 'http://www.wikidata.org/entity/', '') AS ?prop)
			BIND (IF(?property = ?subproperty, "", REPLACE(STR(?property), 'http://www.wikidata.org/entity/', '')) AS ?parent)  
			BIND (IF(?rank = wikibase:PreferredRank, 1, IF(?rank = wikibase:NormalRank, 2, 3)) AS ?order) 
		}
		ORDER BY ?order
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
		if (typeof thing.sameAs === 'string') {
			thing.sameAs = [thing.sameAs]
		}
		for (const item of thing.sameAs) {
			let qid = item.match(/^https?:\/\/www\.wikidata\.org\/wiki\/(Q\d+)/);
			if (qid && qid.length > 0) {
				return qid[1];
			}
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
		} else if (thing?.[prop]?.['@type']) {
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
			} else if (thing[prop].match(/^PT(\d+H)?(\d+M)?(\d+S)?$/)) {
				values.push({
					type: 'Quantity',
					value: durationToQuantity(thing[prop]),
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
		if (prop === 'aggregateRating' && 'ratingValue' in thing[prop] && ( 'ratingCount' in thing[prop] || 'reviewCount' in thing[prop] ) ) {
			let now = new Date();
			const count = thing[prop]?.ratingCount || thing[prop]?.reviewCount
			values.push({
				type: 'String',
				value: makeRating(thing[prop]),
				prop: 'AggregateRating',
				qualifiers: [{
					property: 'P7887',
					value: {
						amount: `+${count}`,
						unit: "http://www.wikidata.org/entity/Q20058247",
					},
				},
				{
					property: "P585",
					value: {
						after: 0,
						before: 0,
						calendarmodel: "http://www.wikidata.org/entity/Q1985727",
						precision: 11,
						time: `+${ now.toISOString().substr(0,10) }T00:00:00Z`,
						timezone: 0,
					}
				}],
			})
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
