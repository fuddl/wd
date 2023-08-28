import { sparqlQuery } from '../sqarql-query.js'
import { templates } from "./components/templates.tpl.js"
import { getValueByLang } from './get-value-by-lang.js';

async function getExpectedProps(e) {
	const search = await browser.search.get()
	const query = `
		SELECT DISTINCT ?c ?p ?v ?sfu ?sfulang ?url ?single WHERE {
			SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
			wd:${e.id} wdt:P31/wdt:P279* ?class.
			?class p:P1963 ?props.
			?props ps:P1963 ?prop.
			?prop wikibase:propertyType wikibase:ExternalId.
			BIND(EXISTS{?prop wdt:P2302 wd:Q19474404} AS ?single)
			OPTIONAL { ?props pq:P11889 ?value. }
			OPTIONAL {
              ?prop p:P4354 ?sfuprop.
              ?sfuprop ps:P4354 ?sfu.
              OPTIONAL {
                ?sfuprop pq:P407 ?lang.
                ?lang wdt:P424 ?sfulang. 
              } 
            }
			OPTIONAL { ?prop wdt:P2699 ?url. }
			BIND (REPLACE(STR(?class), "http://www.wikidata.org/entity/", "") as ?c)
			BIND (REPLACE(STR(?prop), "http://www.wikidata.org/entity/", "") as ?p)
			BIND (REPLACE(STR(?value), "http://www.wikidata.org/entity/", "") as ?v)
		}
	`

	let results = await sparqlQuery(query, null)

	const keywords = []
	keywords.push(getValueByLang(e, 'labels', ''))
	
	for (const lang in e.labels) {
		if (e.labels[lang]?.value && !keywords.includes(e.labels[lang].value)) {
			keywords.push(e.labels[lang].value)
		}
	}


	for (const lang in e.aliases) {
		for (const alias of e.aliases[lang]) {
			if (!keywords.includes(alias.value)) {
				keywords.push(alias.value)
			}
		}
	}

	const existingResults = []
	const proposals = []
	for (const result of results) {
		if (result?.sfu?.value || result?.url?.value) {
			const existingIds = []
			let noValue = false
			if (e.claims?.[result.p.value]) {
				for (const entry of e.claims?.[result.p.value]) {
					if (entry?.mainsnak?.datavalue?.value) {
						existingIds.push(entry.mainsnak.datavalue.value)
					}
					if (entry?.mainsnak?.snaktype == 'novalue') {
						noValue = true
					}
				}
			}
			const bestLabel = result?.sfulang?.value ? e?.labels[result.sfulang.value].value : false

			const newResult = {
				subject: e.id,
				expectedFromClass: result.c.value,
				prop: result.p.value,
				searchUrl: result?.sfu?.value,
				url: result?.url?.value,
				keywords: bestLabel ? [bestLabel, ...keywords] : keywords,
				existingIds: existingIds,
				noValue: noValue,
				singleValue: result?.single?.value == 'true',
			}

			newResult.satisfied = (newResult.singleValue == true && newResult.existingIds.length > 0)

			const hash = JSON.stringify(newResult)

			if (!existingResults.includes(hash)) {
				existingResults.push(hash)
				proposals.push(newResult)
			}

		}
	}

	proposals.sort((a, b) => {

		if (a.noValue !== b.noValue) {
			return !a.noValue ? -1 : 1;
		}

		if (a.satisfied !== b.satisfied) {
			return !a.satisfied ? -1 : 1;
		}


		return a.existingIds.length > a.existingIds.length ? -1 : 1;
	});

	const output = new DocumentFragment()
	let counter = 0
	for (const proposal of proposals) {
		counter++

		proposal.id = `expected-props-search-${counter}`
		output.appendChild(templates.locator(proposal))
	}
	return output
}

export { getExpectedProps }