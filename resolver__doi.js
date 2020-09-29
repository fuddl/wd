resolvers.doi = {
	applicable: async function(location) {
	
		if (location === window.location) {
			let meta = document.querySelector(this.selector);
			if (meta) {
				if (meta.getAttribute('content').match(this.regex)) {
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		} else {
			return false;
		}
	},
	selector: 'meta[name="citation_doi"]',
	regex: /^10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+$/,
	getEntityId: async function() {
		let meta = document.querySelector(this.selector);
		let doi = meta.getAttribute('content');
		let entity = await this.getEntityByDOI(doi);
		console.log(entity);
		if (entity[0]) {
			let entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
			return entityId;
		} else {
			return false;
		}
	},
	getEntityByDOI: async function(doi) {
		let query = `
			SELECT ?item
			WHERE {
				?item wdt:P356 "${ doi }".
			}
		`;
		console.log(query);
		return sparqlQuery(query);
	},
};