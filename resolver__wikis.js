resolvers.wikies = {
	location: '',
	patterns: {
		P8344: /^https?:\/\/wikitrek\.org\/index\.php\/([^?#]+)/,
		P6812: /^https?:\/\/(?:www\.)?antwiki\.org\/wiki\/([^?#]+)/,
		P7824: /^https?:\/\/www\.cpcwiki\.eu\/index\.php\/([^?#]+)/,
		P2390: /^https?:\/\/ballotpedia\.org\/([^?#]+)/,
		P8895: /^https?:\/\/allthetropes\.org\/wiki\/([^?#]+)/,
	},
	applicable: async function(location) {
		for (prop in this.patterns) {
			let match = location.href.match(this.patterns[prop]);
			if (match) {
				return [{
					prop: prop,
					value: match[1],
					recommended: true,
				}];
			}
		}
		return false;
	},
	getEntityId: async function(location) {
		let applicable = await this.applicable(location);

		let prop = applicable[0].prop;
		let id = decodeURIComponent(applicable[0].value);
		let entity = await this.getEntityByRegexedId(prop, id);
		if (entity[0]) {
			let entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
			return entityId;
		} else {
			return false;
		}
	},
	getEntityByRegexedId: async function(prop, id) {
		let query = `
			SELECT ?item
			WHERE {
				?item wdt:${ prop } "${ id }".
			}
		`;
		return sparqlQuery(query);
	},
};
