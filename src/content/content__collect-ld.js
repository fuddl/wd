import {getMatchSuggestions, resolveAll} from '../resolver'
import fixNewlinesInJsonStrings from 'fix-newlines-in-json-strings'
import { jsonParse } from './json-parse.js'

function createLink(thing, url) {
	let link = document.createElement("a")
	if (thing?.["url"]?.startsWith("/") || thing?.["url"]?.startsWith(".")) {
		link.setAttribute("href", url)
		link.pathname = thing["url"]
	} else {
		link.setAttribute("href", thing["url"])
	}
	return link
}

async function parse(thing, ids, url) {
	if (thing.hasOwnProperty("@type") &&
		["BreadcrumbList", "WebSite"].includes(thing["@type"])
	) {
		return null
	}

	if (thing.hasOwnProperty("url")) {
		let link = createLink(thing, url)

		const resolutions = await resolveAll(link)
		resolutions.forEach(it => {
			let wdUrl = `https://www.wikidata.org/wiki/${it.entityId}`
			if (Array.isArray(thing['sameAs'])) {
				thing['sameAs'].push(wdUrl)
			} else {
				thing['sameAs'] = wdUrl
			}
		})

		// Todo: with the new interface this requires us to iterate over resolvers twice.
		// Check perf impact
		const matchSuggestions = await getMatchSuggestions(link)
		thing.isNeedle = Boolean(matchSuggestions.find(it => JSON.stringify(it) === JSON.stringify(ids)))
	}
	for (let prop in thing) {
		if (Array.isArray(thing[prop])) {
			for (let i in thing[prop]) {
				if (
					typeof thing[prop][i] === "object" &&
					thing[prop][i].hasOwnProperty("@type")
				) {
					thing[prop][i] = await parse(thing[prop][i], ids, url);
				}
			}
		} else if (
			thing?.[prop] &&
			typeof thing[prop] === "object" &&
			thing[prop].hasOwnProperty("@type")
		) {
			thing[prop] = await parse(thing[prop], ids, url);
		}
	}
	return thing;
}

export async function enrichLinkedData(snippeds, ids, url) {
	let parsed = [];

	for (let snipped of snippeds) {
		parsed.push(await parse(jsonParse(snipped.innerHTML), ids, url));
	}

	parsed = parsed.filter((v) => {
		return v != null;
	});

	if (parsed.length === 1) {
		parsed[
			parsed.findIndex(() => {
				return true;
			})
		].isNeedle = true;
	}
	return parsed;
}

export function findLinkedData(document) {
	const snippeds = document.querySelectorAll(
		'script[type="application/ld+json"]'
	);

	if (snippeds.length < 1) {
		return [];
	}

	return snippeds;
}
