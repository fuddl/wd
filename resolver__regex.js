resolvers.regex = {
	location: '',
	patterns: {
		P345:  /^https:\/\/(?:www|m)\.imdb\.com\/(?:(?:search\/)?title(?:\?companies=|\/)|name\/|event\/|news\/)(\w{2}\d+)/,
		P8013: /^https:\/\/trakt\.tv\/(people\/[^\/]+|movies\/[^\/]+|shows\/[^\/]+\/seasons\/\d+$|shows\/[^\/]+\/seasons\/\d+\/episodes\/\d+)/,
		P2002: /^https:\/\/(?:(?:mobile\.)?twitter\.com\/(?:intent\/user\?screen_name\=)?(?!hashtag)([0-9A-Za-z_]{1,15})|scholia\.toolforge\.org\/twitter\/([0-9A-Za-z_]{1,15}))/,
		P434:  /^https:\/\/(?:musicbrainz\.org\/artist\/|www\.bbc\.co\.uk\/music\/artists\/)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/,
		P436:  /^https:\/\/musicbrainz\.org\/release-group\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/,
		P724:  /^https:\/\/archive\.org\/details\/([0-9A-Za-z@\._-]+)/,
		P2969: /^https:\/\/www\.goodreads\.com\/book\/show\/(\d+)/,
		P6327: /^https:\/\/www\.goodreads\.com\/characters\/(\d+)/,
		P6947: /^https:\/\/www\.goodreads\.com\/series\/(\d+)/,
		P2963: /^https:\/\/www\.goodreads\.com\/author\/show\/(\d+)/,
		P1651: /^https:\/\/www\.youtube\.com\/watch\?v=([-_0-9A-Za-z]{11})/,
		P1821: /^https:\/\/\w+\.openfoodfacts\.org\/category\/((?:[a-z]{2,3}:)?[a-z-]+)/,
		P5930: /^https:\/\/\w+\.openfoodfacts\.org\/ingredient\/((?:[a-z]{2,3}:)?[a-z-]+)/,
		P2397: /^https:\/\/\w+\.youtube\.com\/channel\/(UC[-_0-9A-Za-z]{21}[AQgw])/,
		P4198: /^https:\/\/play\.google\.com\/(?:store\/music\/artist\?id=|music\/listen\#\/(?:wst\/)?artist\/)(([A-Z]|[a-z]|[0-9]){27})/,
		P4300: /^https:\/\/(?:music|www)\.youtube\.com\/playlist\?list=((?:PL|OLAK|RDCLAK)[-_0-9A-Za-z]+)/,
		P5327: /^https:\/\/www\.fernsehserien\.de\/([^?#]+)/,
		P3984: /^https:\/\/www\.reddit\.com\/r\/([^\/?#]+)\//,
		P1733: /^https:\/\/(?:store\.)?steam(?:community|powered)\.com\/app\/(\d+)/,
		P2725: /^https:\/\/www\.gog\.com\/([^#?]+)/,
		P4477: /^https:\/\/www\.humblebundle\.com\/store\/([^#\?\/]+)/,
		P1933: /^https:\/\/www\.mobygames\.com\/game\/([^#\?\/]+)/,
		P8376: /^https:\/\/www\.duden\.de\/(?:rechtschreibung|synonyme)\/([_0-9A-Za-z]+)/,
		P1274: /^http:\/\/www\.isfdb\.org\/cgi-bin\/title\.cgi\?(\d+)/,
		P1235: /^http:\/\/www\.isfdb\.org\/cgi-bin\/pe\.cgi\?(\d+)/,
		P1233: /^http:\/\/www\.isfdb\.org\/cgi-bin\/ea\.cgi\?(\d+)/,
		P5646: /^https:\/\/anidb\.net\/anime\/(\d+)/,
		P5648: /^https:\/\/anidb\.net\/character\/(\d+)/,
		P5649: /^https:\/\/anidb\.net\/creator\/(\d+)/,
		P6011: /^https:\/\/www\.ipdb\.org\/machine\.cgi\?id=(\d+)/,
		P5916: /^https:\/\/open\.spotify\.com\/show\/([0-9A-Za-z]{22})/,
		P6517: /^https:\/\/www\.whosampled\.com\/([^ \/]{1,100})/,
		P4903: /^https:\/\/www\.georgiaencyclopedia\.org\/articles\/((?:(?:arts-culture|business-economy|counties-cities-neighborhoods|education|geography-environment|government-politics|history-archaeology|people|science-medicine|sports-outdoor-recreation)\/)?[a-z\d][a-z\-–\d]+)/,
		P5773: /^https:\/\/interviews\.televisionacademy\.com\/interviews\/([a-z][a-z-]+[a-z])/,
		P5829: /^https:\/\/interviews\.televisionacademy\.com\/shows\/([a-z\d][a-z\d-]+[a-z\d])/,
		P5914: /^https:\/\/www\.iana\.org\/domains\/root\/db\/([a-z0-9-]{2,})\.html/,
		P6113: /^https:\/\/www\.playbill\.com\/venue\/([a-z]+(\-[a-z]+)*\-\d{10})/,
		P6132: /^https:\/\/www\.playbill\.com\/person\/([a-z]+(\-[a-z]+)*\-\d{10})/,
		P6136: /^https:\/\/www\.newseum\.org\/todaysfrontpages\/\?tfp_id=([^\/#&]+)/,
		P7595: /^https:\/\/www\.disneyplus\.com\/movies\/wd\/([0-9A-Za-z]{12})/,
		P7596: /^https:\/\/www\.disneyplus\.com\/series\/wd\/([0-9A-Za-z]{12})/,
		P6181: /^https:\/\/d23\.com\/a-to-z\/([^\s\/]+)/,
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
		let id = applicable[0].value;
		let entity = await this.getEntityByRegexedId(prop, id);
		if (entity[0]) {
			let entityId = entity[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(\w\d+)/)[1]
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
