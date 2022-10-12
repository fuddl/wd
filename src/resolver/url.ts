import { sparqlQuery } from '../sqarql-query.js'
import {Resolver} from './types'

const url: Resolver = {
	id: 'url',
	props: ['P953', 'P973', 'P856', 'P2699'],
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
		slashNoSlash: [
			(url) => url.endsWith('/') ? url : `${url}/`,
			(url) => !url.endsWith('/') ? url : url.replace(/\/$/, ''),
		],
		secureNoSecure: [
			(url) => url.startsWith('http://') ? url.replace(/^http:\/\//, 'https://') : url,
			(url) => url.startsWith('https://') ? url : url.replace(/^https:\/\//, 'http://'),
		],
		wwwNoWww: [
			(url) => url.match(/https?:\/\/www\./) ? url.replace(/^(http:\/\/)www\./, '$1') : null,
		],
	},
	getEntityId: async function(location) {
		let href = location.href

		let groups = []

		for (const prop of this.props) {
			for (const fuzz in this.fuzziness) {
				for (const variation of this.fuzziness[fuzz]) {
					const fuzzyUrl = variation(href)
					if (fuzzyUrl) {
						groups.push(`?item wdt:${prop} <${ fuzzyUrl }>.`)
					}
				}
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
