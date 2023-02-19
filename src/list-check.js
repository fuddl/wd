import { sparqlQuery } from "./sqarql-query.js";

async function getWebsiteItem(url, queryFragment = '?item wdt:P31/wdt:P279* wd:Q14827288.') {
	const ourHostname = new URL(url).hostname

	const query = `
		SELECT DISTINCT ?hostname ?id WHERE {
			${queryFragment}
			?item wdt:P856 ?url.
			BIND(REPLACE(STR(?item), "http://www.wikidata.org/entity/", "") as ?id).
			BIND(REPLACE(STR(?url), "^[a-z]+://", "") as ?sans_protocol).
			FILTER(!REGEX(?sans_protocol, "/.+$", "i")).
			BIND(REPLACE(?sans_protocol, "/$", '') as ?hostname).
		}
	`

	const result = await sparqlQuery(query, 0, true)

	for (const row of result) {
		if (row?.hostname?.value == ourHostname) {
			return row.id.value
		}
	}
	return false
}

export { getWebsiteItem }