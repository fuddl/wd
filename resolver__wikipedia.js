resolvers.wikipedia = {
	regex: /^https:\/\/([\w]+)(\.m)?\.(wik(?:ipedia|iquote|tionary|isource))\.org\/wiki\/([\w%\.\:\(\)]+)$/,
	applicable: function(location) {
		return location.href.match(this.regex) !== null;
	},
	getEntityId: async function(location) {
		let parts = location.href.match(this.regex);
		let query = `
			SELECT ?item WHERE {
			  VALUES ?lemma {
			    "${ parts[4] }"@${ parts[1] }
			  }
			  ?sitelink schema:about ?item;
			    schema:isPartOf <https://${ parts[1] }.${ parts[3] }.org/>;
			    schema:name ?lemma.
			}
		`;
		let entity = await sparqlQuery(query);
		if (entity[0]) {
			let entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
			console.log(entityId);
			return entityId;
		} else {
			return false;
		}
	}
};