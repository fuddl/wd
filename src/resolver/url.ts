import { sparqlQuery } from '../sqarql-query.js'
import {Resolver} from './types'

const url: Resolver = {
	id: 'url',
	applicable: async function(location) {
		if (location.href === window.location.href) {
			return [{
				prop: ['P953', 'P973', 'P856', 'P2699'],
				value: location.href,
				langRequired: true,
			}]
		}
	},
	getEntityId: async function(location) {
		const href = location.href
		const hrefNoSlash = href.replace(/\/$/, '')
		const query = `
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
