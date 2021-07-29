import { sparqlQuery } from "../sqarql-query.js";

const wikipedia = {
	regex: /^https?:\/\/([\w]+)(?:\.m)?\.wikipedia\.org\/wiki\/([^?#]+)/,
	applicable: function(location) {
		if(location.href.match(this.regex) !== null ) {
			let parts = location.href.match(this.regex);
			return [{
				sitelink: `${parts[1]}wiki`,
				value: parts[2],
			}];
		} else {
			return false;
		}
	},
	getEntityId: async function(location) {
		let parts = location.href.match(this.regex);
		let title = decodeURIComponent(parts[2]).replace(/_/g, ' ');
		let query = `
			SELECT ?item WHERE {
				?sitelink schema:about ?item;
					schema:isPartOf <https://${ parts[1] }.wikipedia.org/>;
					schema:name "${ title }"@${ parts[1] }.
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
};

export { wikipedia }
