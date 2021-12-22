import { sparqlQuery } from "../sqarql-query.js";

const schemaOrg = {
	regex: /^https\:\/\/schema\.org\/[a-zA-Z]+$/,
	applicable: function(location) {
		if (location.href.match(this.regex) !== null) {
			return [{
				prop: 'P1709',
				value: location.href,
			}];
		}
	},
	getEntityId: async function(location) {
		let query = `
			SELECT ?item
			WHERE {
				{ ?item wdt:P1709 <${ location.href }>. }
				UNION
				{ ?item wdt:P1628 <${ location.href }>. }
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

export { schemaOrg }
