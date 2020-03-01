resolvers.officialWebsite = {
	urlMatrch: function(location) {
		return location.href.match(/^https?:\/\/.+/) !== null;
	},
	getEntityId: async function() {
		let domain = window.location.origin;

		let entity = await this.getEntityByOfficialWebsite(domain);
		if (entity[0]) {
			let entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
			return entityId;
		} else {
			return false;
		}
	},
	getEntityByOfficialWebsite: async function(domain) {
		let query = `
			SELECT ?item
			WHERE {
				{
					?item wdt:P856 <${ domain.replace(/^http\:/, 'https:') }/>.
				} union {
					?item wdt:P856 <${ domain.replace(/^https\:/, 'http:') }/>.
				} union {
					?item wdt:P856 <${ domain.replace(/^http\:/, 'https:') }>.
				} union {
					?item wdt:P856 <${ domain.replace(/^https\:/, 'http:') }>.
				} union {
					?item wdt:P2699 <${ domain.replace(/^http\:/, 'https:') }/>.
				} union {
					?item wdt:P2699 <${ domain.replace(/^https\:/, 'http:') }/>.
				} union {
					?item wdt:P2699 <${ domain.replace(/^http\:/, 'https:') }>.
				} union {
					?item wdt:P2699 <${ domain.replace(/^https\:/, 'http:') }>.
				}
			}
		`;
		return sparqlQuery(query);
	},
};