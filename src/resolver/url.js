import { sparqlQuery } from '../sqarql-query.js'

const url = {
	applicable: async function(location) {
		if (location.href === window.location.href) {
			return [{
				prop: ['P953', 'P973', 'P856', 'P2699'],
				value: location.href,
			}]
		}
	},
	getEntityId: async function(location) {
		const href = location.href
		const hrefNoSlash = href.replace(/\/$/, '')
		let query = `
			SELECT ?item {
			  {
			    ?item wdt:P953 <${ href }>.
			  } UNION {
			    ?item wdt:P973 <${ href }>.
			  } UNION {
			    ?item wdt:P856 <${ href }>.
			  } UNION {
			    ?item wdt:P2699 <${ href }>.
			  } UNION {
			    ?item wdt:P953 <${ hrefNoSlash }>.
			  } UNION {
			    ?item wdt:P973 <${ hrefNoSlash }>.
			  } UNION {
			    ?item wdt:P856 <${ hrefNoSlash }>.
			  } UNION {
			    ?item wdt:P2699 <${ hrefNoSlash }>.
			  }
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

export { url }
