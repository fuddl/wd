resolvers.officialWebsite = {
	applicable: function(location) {
		let isIndex = location.href.match(this.indexPageRegex) !== null;
		if (isIndex) {
			return [{
				prop: 'P856',
				value: location.href,
				recommended: isIndex,
			}];
		}
	},
	getEntityId: async function(location) {
		let domain = location.origin;

		let entity = await this.getEntityByOfficialWebsite(domain);
		if (entity[0]) {
			let entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
			return entityId;
		} else {
			return false;
		}
	},
	indexPageRegex: /^https?:\/\/[^\/]+(\/(\?.*|index\.php(\?.*)?)?)?$/,
	getEntityByOfficialWebsite: async function(domain) {
		const { sparqlQuery } = await import(browser.extension.getURL("sqarql-query.js"));
		
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
