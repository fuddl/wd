import { sparqlQuery } from '../sqarql-query.js'
import {RegexResolver} from './types'

const googleMaps: RegexResolver = {
	id: 'googleMaps',
	regex: /^https:\/\/www\.google\.\w+\/maps\/place\/[^ #]*\/data=[^ #]*(0x[0-9a-f]+)/,
	async applicable(location) {
		const matches = location.href.match(this.regex)
		let label = null

		if (document?.title) {
			const titleExtractionResult = /^(.+)\s+- Google Maps$/.exec(document.title)
			if (titleExtractionResult?.[1]) {
				label = titleExtractionResult[1]
			}
		}

		if (matches !== null) {
			return [{
				prop: 'P3749',
				label: label,
				value: this.convert(matches[1]),
			}]
		}
	},
	convert: function(hex) {
		return String(BigInt(hex, 16))
	},
	async getEntityId(location) {
		const id = this.convert(location.href.match(this.regex)[1])
		const query = `
			SELECT ?item
			WHERE {
				?item wdt:P3749 "${id}".
			}
		`
		const entity = await sparqlQuery(query)
		if (entity[0]) {
			const entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
			return entityId
		} else {
			return false
		}
	},
}

export { googleMaps }
