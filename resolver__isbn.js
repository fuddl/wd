resolvers.isbn = {
	applicable: function(location) {
		return this.findIsbn((found) => {
			if (!found) {
				return false;
			} else {
				return true;
			}
		});
	},
	findIsbn: function(callback) {
		let jsonContainers = document.querySelectorAll('[type="application/ld+json"]');

		let ogIsbn = document.querySelector('meta[property="book:isbn"], meta[property="books:isbn"]');
		if (ogIsbn) {
			return callback(ogIsbn.getAttribute('content'));
		}

		for (container of jsonContainers) {

			// since the json might be invalid
			try {
				let json = JSON.parse(container.innerText);
				if (json["@context"] === 'https://schema.org/') {
					if (json["@type"] === 'Book') {
						if (typeof json["isbn"] != 'undefined') {
							return callback(json["isbn"]);
						}
					}
				}
			} catch(error) {
				console.error('JSON on this site might be invalid.');
				return false;
			}
		}
		return false;
	},
	getEntityId: async function() {
		return this.findIsbn( async (found) => {
			let entity = await this.getEntityByIsbn(found);
			if (entity[0]) {
				console.log(JSON.stringify(entity[0]));
				let entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)/)[1]
				return entityId;
			} else {
				return false;
			}
		});
	},
	getEntityByIsbn: async function(isbn) {
		let plain = isbn.replace(/[^\d]/g, '');
		let prop = plain.length === 13 ? 'P212' : 'P957';

		let query = `
			SELECT ?item WHERE{
			  ?item wdt:${ prop } ?isbn.
			  BIND(REPLACE(?isbn, "-", "") AS ?plain_isbn)
			  FILTER(?plain_isbn in ("${ plain }")) 
			}
		`;
		console.log(query);
		return sparqlQuery(query);
	},
};