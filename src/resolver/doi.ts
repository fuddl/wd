import { sparqlQuery } from '../sqarql-query'
import {Resolver} from './types'

const doi: Resolver = {
	id: 'doi',
	async applicable(location) {
		if (location === window.location) {
			const meta = document.querySelector(this.selector)
			if (meta) {
				if (meta.getAttribute('content').match(this.DOIRegex)) {
					return [{
						prop: 'P356',
						value: meta.getAttribute('content').toUpperCase(),
						recommended: true,
					}]
				} else {
					return false
				}
			} else {
				return false
			}
		}

		if (location.href.match(this.DOIUrlRegex)) {
			return [{
				prop: 'P356',
				value: location.href.match(this.DOIUrlRegex)[1],
				recommended: true,
			}]
		} else {
			return false
		}
	},
	selector: 'meta[name="citation_doi"]',
	DOIUrlRegex: /https:\/\/doi\.org\/(10\.\d{4,9}\/[-._;()\/:a-zA-Z0-9]+)/,
	DOIRegex: /10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+/,
	async getEntityId(location) {
		let doi = ''
		if (location === window.location) {
			const meta = document.querySelector(this.selector)
			doi = meta.getAttribute('content').toUpperCase()
		} else {
			doi = location.href.match(this.DOIUrlRegex)[1]
		}
		const entity = await this.getEntityByDOI(doi)
		if (entity[0]) {
			const entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
			return entityId
		}
	},
	getEntityByDOI: async function(doi) {
		const query = `
			SELECT ?item
			WHERE {
				?item wdt:P356 "${ doi.toUpperCase() }".
			}
		`
		return sparqlQuery(query)
	},
}

export { doi }
