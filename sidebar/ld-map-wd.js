import { sparqlQuery } from "../sqarql-query.js";

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
			}
			return data;
		}
	}
}

async function findMatchingClass(data) {
	if (!data.hasOwnProperty('@type')) {
		return false;
	} else {
		data = makeTypeAbsolute(data);
		let query = `
			SELECT ?item WHERE {
				?item wdt:P1709 <${ data['@type'] }>;
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

async function findMatchingProp(prop, namespace) {

	let query = `
		SELECT ?item WHERE {
			?item wdt:P1628 <${ namespace }/${ prop }>;
		}
	`;
	let entity = await sparqlQuery(query);
	if (entity[0]) {
		return entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(P\d+)/)[1];
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

async function findConnections(thing) {
	if (!thing.hasOwnProperty('@context')) {
		return [];
	}
	let namespace = thing['@context'];
	let connections = [];
	for (let prop in thing) {
		let qids = [];
		if (Array.isArray(thing[prop])) {
			for (let i in thing[prop]) {
				if (typeof thing[prop][i] === 'object' && thing[prop][i].hasOwnProperty('@type')) {
					let qid = isSameAsWdEntity(thing[prop][i]);
					if (qid) {
						qids.push(qid)
					}
				}
			}
		} else if (typeof thing[prop] === 'object' && thing[prop].hasOwnProperty('@type')) {
			let qid = isSameAsWdEntity(thing[prop]);
			if (qid) {
				qids.push(qid)
			}
		}
		if (qids.length > 0) {
			let property = await findMatchingProp(prop, namespace);
			if (property) {
				for (let qid of qids) {
					connections.push({
						prop: property,
						value: qid,
					});
				}
			}
		}
	}
	return connections;
}

export { findMatchingClass, findConnections }
