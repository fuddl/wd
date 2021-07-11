import { resolvers } from './resolver.js';

async function parse(thing, ids, url) {

	if (thing.hasOwnProperty('@type') && ['BreadcrumbList'].includes(thing['@type'])) {
		return null;
	}

	if (thing.hasOwnProperty('url')) {
		let link = document.createElement('a');

		if (thing['url'].startsWith('/') || thing['url'].startsWith('.')) {
			link.setAttribute('href', url);
			link.pathname = thing['url'];
		} else {
			link.setAttribute('href', thing['url']);
		}

		for (let id of Object.keys(resolvers)) {
			let isApplicable = await resolvers[id].applicable(link);
			if (isApplicable) {
				let entityId = await resolvers[id].getEntityId(link);
				if (entityId) {
					let wdUrl = `https://www.wikidata.org/wiki/${entityId}`;
					if (Array.isArray(thing['sameAs'])) {
						thing['sameAs'].push(wdUrl);
					} else {
						thing['sameAs'] = wdUrl;
					}
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
					thing[prop][i] = await parse(thing[prop][i], ids, url)
				}
			}
		} else if (typeof thing[prop] === 'object' && thing[prop].hasOwnProperty('@type')) {
			thing[prop] = await parse(thing[prop], ids, url)
		}
	}
	return thing;
}

function jsonParse(i) {
	return JSON.parse(i.replace(/\/\*[\s\S]*?\*\//g, ''));
}

async function enrichLinkedData(snippeds, ids, url) {
	let parsed = []

	for (let snipped of snippeds) {
		parsed.push(await parse(jsonParse(snipped.innerHTML), ids, url));
	}

	parsed = parsed.filter((v) => {
		return v != null;
	});

	if (parsed.length === 1) {
		parsed[parsed.findIndex(() => {
			return true;
		})].isNeedle = true;
	}
	return parsed;

}

function findLinkedData(document) {
	const snippeds = document.querySelectorAll('script[type="application/ld+json"]');

	if (snippeds.length < 1) {
		return []
	}

	return snippeds;
}

export { findLinkedData, enrichLinkedData }
