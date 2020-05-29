resolvers.regex = {
	patterns: {
		P345: /^https:\/\/(?:www|m)\.imdb\.com\/(?:(?:search\/)?title(?:\?companies=|\/)|name\/|event\/|news\/)(\w{2}\d{7})/,
		P8013: /^https:\/\/trakt\.tv\/(people\/[^\/]+|movies\/[^\/]+|shows\/[^\/]+\/seasons\/\d+\/episodes\/\d+)/,
		P2002: /^https:\/\/(?:(?:mobile\.)?twitter\.com\/(?:intent\/user\?screen_name\=)?(?!hashtag)([0-9A-Za-z_]{1,15})|tools\.wmflabs\.org\/scholia\/twitter\/([0-9A-Za-z_]{1,15}))/,
		P434: /^https:\/\/(?:musicbrainz\.org\/artist\/|www\.bbc\.co\.uk\/music\/artists\/)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/,
		P436: /^https:\/\/musicbrainz\.org\/release-group\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/,
		P724: /^https:\/\/archive\.org\/details\/([0-9A-Za-z@\._-]+)/,
		P2969: /^https:\/\/www\.goodreads\.com\/book\/show\/(\d+)/,
		P6327: /^https:\/\/www\.goodreads\.com\/characters\/(\d+)/,
		P1651: /^https:\/\/www\.youtube\.com\/watch\?v=([-_0-9A-Za-z]{11})/,
		P1821: /^https:\/\/\w+\.openfoodfacts\.org\/category\/((?:[a-z]{2,3}:)?[a-z-]+)/,
		P5930: /^https:\/\/\w+\.openfoodfacts\.org\/ingredient\/((?:[a-z]{2,3}:)?[a-z-]+)/,
		P2397: /^https:\/\/\w+\.youtube\.com\/channel\/(UC[-_0-9A-Za-z]{21}[AQgw])/,
		P4198: /^https:\/\/play\.google\.com\/(?:store\/music\/artist\?id=|music\/listen\#\/(?:wst\/)?artist\/)(([A-Z]|[a-z]|[0-9]){27})/,
		P4300: /^https:\/\/(?:music|www)\.youtube\.com\/playlist\?list=((?:PL|OLAK)[-_0-9A-Za-z]{32})/,
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
	getEntityId: async function() {
		let applicable = await this.applicable(window.location);

		let prop = applicable[0].prop;
		let id = applicable[0].value;
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