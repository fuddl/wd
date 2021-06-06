import { resolvers } from './resolver.js';

async function parse(thing, ids) {
	if (thing.hasOwnProperty('url') && !thing?.sameAs?.startsWith('https://www.wikidata.org/wiki/Q')) {
		let link = document.createElement('a');
		link.setAttribute('href', thing['url']);
		for (let id of Object.keys(resolvers)) {
			let isApplicable = await resolvers[id].applicable(link);
			if (isApplicable) {
				let entityId = await resolvers[id].getEntityId(link);
				if (entityId) {
					thing['sameAs'] = `https://www.wikidata.org/wiki/${entityId}`
				} else {
					if (JSON.stringify(isApplicable) === JSON.stringify(ids)) {
						thing.isNeedle = true;
					}
				}
			}
		}
	}
	for (let prop in thing) {
		if (Array.isArray(thing[prop])) {
			for (let i in thing[prop]) {
				if (typeof thing[prop][i] === 'object' && thing[prop][i].hasOwnProperty('@type')) {
					thing[prop][i] = await parse(thing[prop][i], ids)
				}
			}
		} else if (typeof thing[prop] === 'object' && thing[prop].hasOwnProperty('@type')) {
			thing[prop] = await parse(thing[prop], ids)
		}
	}
	return thing;
}

async function findLinkedData(ids) {
	const snippeds = document.querySelectorAll('script[type="application/ld+json"]');

	if (snippeds.length < 1) {
		return []
	}

	let parsed = []

	for (let snipped of snippeds) {
		parsed.push(await parse(JSON.parse(snipped.innerText), ids));
	}
	return parsed;
}

export { findLinkedData }