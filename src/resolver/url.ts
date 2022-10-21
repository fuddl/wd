import { sparqlQuery } from '../sqarql-query.js'
import { Resolver } from './types'
import binaryVariations from 'binary-variations'

const url: Resolver = {
	id: 'url',
	applicable: async function(location) {
		if (location.href === window.location.href) {
			return [{
				prop: await this.getProps(),
				value: location.href,
				langRequired: true,
			}]
		}
	},
	fuzziness: {
		noIndexHtml: (url) => url.replace(/\/index\.html?$/, ''),
		trailingSlash: (url) => url.endsWith('/') ? url : `${url}/`,
		noTrailingSlash: (url) => !url.endsWith('/') ? url : url.replace(/\/$/, ''),
		secure: (url) => url.startsWith('http://') ? url.replace(/^http:\/\//, 'https://') : url,
		noScecure: (url) => url.startsWith('https://') ? url.replace(/^https:\/\//, 'http://') : url,
		noWww: (url) => url.match(/https?:\/\/www\./) ? url.replace(/^(http:\/\/)www\./, '$1') : url,
	},
	getProps: async function() {
		let props = await sparqlQuery(`
			SELECT DISTINCT ?p WHERE {
				SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE]". }
				{
					SELECT DISTINCT ?prop WHERE {
						?prop p:P31 ?s0.
						?prop wikibase:propertyType wikibase:Url.
						?s0 (ps:P31/(wdt:P279*)) wd:Q84764641.
						MINUS {
							?prop p:P31 ?s1.
							?s1 (ps:P31/(wdt:P279*)) wd:Q19847637.
						}
					}
				}
				MINUS { ?prop wdt:P8966 [] } .
				BIND(REPLACE(STR(?prop), "http://www.wikidata.org/entity/", "") as ?p)
			}
		`)

		return props.map((item) => { 
			return item.p.value
		})
	},
	getEntityId: async function(location) {
		let href = location.href

		let hrefs = [href]

		const fuzzyPermutation = binaryVariations(Object.keys(this.fuzziness))

		for (const fuzzy of fuzzyPermutation) {
			let variation = href
			for (const fuzz of fuzzy) {
				variation = this.fuzziness[fuzz](variation)
			}
			if (variation && !hrefs.includes(variation)) {
				hrefs.push(variation)	
			}
		}


		const props = await this.getProps()

		let groups = []
		for (const fuzzyHref of hrefs) {
			groups.push(`?item ?predicate <${ fuzzyHref }>.`)
		}

		const query = `
			SELECT ?item ?property WHERE {
				{
					${groups.join('\n} UNION {\n')}
				}
				?property wikibase:directClaim ?predicate.
				FILTER(?property IN (wd:${ props.join(', wd:') }))
			}
			LIMIT 1
		`
		
		const entity = await sparqlQuery(query)
		if (entity[0]) {
			const entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
			return entityId
		} else {
			return false
		}
	}
}

export { url }
