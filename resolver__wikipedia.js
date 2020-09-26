resolvers.wikipedia = {
	regex: /^https?:\/\/([\w]+)(\.m)?\.(wik(?:ipedia|iquote|tionary|isource))\.org\/wiki\/([^?#]+)/,
	applicable: function(location) {
		return location.href.match(this.regex) !== null;
	},
	getEntityId: async function(location) {
		let parts = location.href.match(this.regex);
		let title = decodeURIComponent(parts[4]).replace(/_/g, ' ');
		let query = `
			SELECT ?item WHERE {
			  ?sitelink schema:about ?item;
			    schema:isPartOf <https://${ parts[1] }.${ parts[3] }.org/>;
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