import { sparqlQuery } from '../sqarql-query.js'
import { RegexResolver } from './types.js'

const schemaOrg: RegexResolver = {
	id: 'schemaOrg',
	regex: /^https:\/\/schema\.org\/[a-zA-Z]+$/,
	async applicable(location) {
		if (location.href.match(this.regex) !== null) {
			return [{
				prop: 'P1709',
				value: location.href,
			}]
		}
	},
	async getEntityId(location) {
		const query = `
			SELECT ?item
			WHERE {
				{ ?item wdt:P1709 <${location.href}>. }
				UNION
				{ ?item wdt:P1628 <${location.href}>. }
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

export { schemaOrg }
