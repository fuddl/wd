import { sparqlQuery } from '../sqarql-query.js'
import { Resolver } from './types'
import binaryVariations from 'binary-variations'

const url: Resolver = {
	id: 'url',
	props: ['P953', 'P973', 'P856', 'P2699', 'P1581'],
	applicable: async function(location) {
		if (location.href === window.location.href) {
			return [{
				prop: this.props,
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

		let groups = []
		for (const prop of this.props) {
			for (const fuzzyHref of hrefs) {
				groups.push(`?item wdt:${prop} <${ fuzzyHref }>.`)
			}
		}

		const query = `
			SELECT ?item {
			  {
				${groups.join('\n} UNION {\n')}
			  }
			}
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
