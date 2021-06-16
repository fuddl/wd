import { sparqlQuery } from "../sqarql-query.js";

const url = {
	applicable: async function(location) {
		if (location.href === window.location.href) {
			return [{
				prop: ['P953', 'P973', 'P856', 'P2699'],
				value: location.href,
			}];
		}
	},
	getEntityId: async function(location) {
		let query = `
			SELECT ?item {
			  {
			    ?item wdt:P953 <${ location.href }>.
			  } UNION {
			    ?item wdt:P973 <${ location.href }>.
			  } UNION {
			    ?item wdt:P856 <${ location.href }>.
			  } UNION {
			    ?item wdt:P2699 <${ location.href }>.
			  }
			}
		`;
		let entity = await sparqlQuery(query);
		if (entity[0]) {
			let entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
			return entityId;
		} else {
			return false;
		}
	}
}

export { url }
