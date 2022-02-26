import { sparqlQuery } from '../sqarql-query.js'

const googleMaps = {
	regex: /^https\:\/\/www\.google\.\w+\/maps\/place\/[^ #]*\/data=[^ #]*(0x[0-9a-f]+)/,
	applicable: function(location) {
		let matches = location.href.match(this.regex)
		if (matches !== null) {
			return [{
				prop: 'P3749',
				value: this.convert(matches[1]),
			}]
		}
	},
	convert: function(hex) {
		return String(BigInt(hex, 16))
	},
	getEntityId: async function(location) {
		let id = this.convert(location.href.match(this.regex)[1])
		let query = `
			SELECT ?item
			WHERE {
				?item wdt:P3749 "${ id }".
			}
		`
		let entity = await sparqlQuery(query)
		if (entity[0]) {
			let entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
			return entityId
		} else {
			return false
		}
	}
}

export { googleMaps }
