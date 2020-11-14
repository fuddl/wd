resolvers.regex = {
	location: '',
	patterns: {
		P345:  /^https?:\/\/(?:www|m)\.imdb\.com\/(?:(?:search\/)?title(?:\?companies=|\/)|name\/|event\/|news\/)(\w{2}\d+)/,
		P8013: /^https?:\/\/trakt\.tv\/(people\/[^\/]+|movies\/[^\/]+|shows\/[^\/]+\/seasons\/\d+$|shows\/[^\/]+\/seasons\/\d+\/episodes\/\d+)/,
		P2002: /^https?:\/\/(?:(?:mobile\.)?twitter\.com\/(?:intent\/user\?screen_name\=)?(?!hashtag)([0-9A-Za-z_]{1,15})|scholia\.toolforge\.org\/twitter\/([0-9A-Za-z_]{1,15}))/,
		P434:  /^https?:\/\/(?:musicbrainz\.org\/artist\/|www\.bbc\.co\.uk\/music\/artists\/)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/,
		P436:  /^https?:\/\/musicbrainz\.org\/release-group\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/,
		P724:  /^https?:\/\/archive\.org\/details\/([0-9A-Za-z@\._-]+)/,
		P2969: /^https?:\/\/www\.goodreads\.com\/book\/show\/(\d+)/,
		P6327: /^https?:\/\/www\.goodreads\.com\/characters\/(\d+)/,
		P6947: /^https?:\/\/www\.goodreads\.com\/series\/(\d+)/,
		P2963: /^https?:\/\/www\.goodreads\.com\/author\/show\/(\d+)/,
		P8383: /^https?:\/\/www\.goodreads\.com\/work\/editions\/(\d+)/,
		P1651: /^https?:\/\/www\.youtube\.com\/watch\?v=([-_0-9A-Za-z]{11})/,
		P1821: /^https?:\/\/\w+\.openfoodfacts\.org\/category\/((?:[a-z]{2,3}:)?[a-z-]+)/,
		P5930: /^https?:\/\/\w+\.openfoodfacts\.org\/ingredient\/((?:[a-z]{2,3}:)?[a-z-]+)/,
		P2397: /^https?:\/\/\w+\.youtube\.com\/channel\/(UC[-_0-9A-Za-z]{21}[AQgw])/,
		P4198: /^https?:\/\/play\.google\.com\/(?:store\/music\/artist\?id=|music\/listen\#\/(?:wst\/)?artist\/)(([A-Z]|[a-z]|[0-9]){27})/,
		P4300: /^https?:\/\/(?:music|www)\.youtube\.com\/playlist\?list=((?:PL|OLAK|RDCLAK)[-_0-9A-Za-z]+)/,
		P5327: /^https?:\/\/www\.fernsehserien\.de\/([^?#]+)/,
		P3984: /^https?:\/\/www\.reddit\.com\/r\/([^\/?#]+)\//,
		P1733: /^https?:\/\/(?:store\.)?steam(?:community|powered)\.com\/app\/(\d+)/,
		P2725: /^https?:\/\/www\.gog\.com\/([^#?]+)/,
		P4477: /^https?:\/\/www\.humblebundle\.com\/store\/([^#\?\/]+)/,
		P1933: /^https?:\/\/www\.mobygames\.com\/game\/([^#\?\/]+)/,
		P8376: /^https?:\/\/www\.duden\.de\/(?:rechtschreibung|synonyme)\/([_0-9A-Za-z]+)/,
		P1274: /^https?:\/\/www\.isfdb\.org\/cgi-bin\/title\.cgi\?(\d+)/,
		P1235: /^https?:\/\/www\.isfdb\.org\/cgi-bin\/pe\.cgi\?(\d+)/,
		P1233: /^https?:\/\/www\.isfdb\.org\/cgi-bin\/ea\.cgi\?(\d+)/,
		P5646: /^https?:\/\/anidb\.net\/anime\/(\d+)/,
		P5648: /^https?:\/\/anidb\.net\/character\/(\d+)/,
		P5649: /^https?:\/\/anidb\.net\/creator\/(\d+)/,
		P8785: /^https?:\/\/anidb\.net\/tag\/(\d+)/,
		P6011: /^https?:\/\/www\.ipdb\.org\/machine\.cgi\?id=(\d+)/,
		P5916: /^https?:\/\/open\.spotify\.com\/show\/([0-9A-Za-z]{22})/,
		P6517: /^https?:\/\/www\.whosampled\.com\/([^ \/]{1,100})/,
		P4903: /^https?:\/\/www\.georgiaencyclopedia\.org\/articles\/((?:(?:arts-culture|business-economy|counties-cities-neighborhoods|education|geography-environment|government-politics|history-archaeology|people|science-medicine|sports-outdoor-recreation)\/)?[a-z\d][a-z\-–\d]+)/,
		P5773: /^https?:\/\/interviews\.televisionacademy\.com\/interviews\/([a-z][a-z-]+[a-z])/,
		P5829: /^https?:\/\/interviews\.televisionacademy\.com\/shows\/([a-z\d][a-z\d-]+[a-z\d])/,
		P5914: /^https?:\/\/www\.iana\.org\/domains\/root\/db\/([a-z0-9-]{2,})\.html/,
		P6113: /^https?:\/\/www\.playbill\.com\/venue\/([a-z]+(\-[a-z]+)*\-\d{10})/,
		P6132: /^https?:\/\/www\.playbill\.com\/person\/([a-z]+(\-[a-z]+)*\-\d{10})/,
		P6136: /^https?:\/\/www\.newseum\.org\/todaysfrontpages\/\?tfp_id=([^\/#&]+)/,
		P7595: /^https?:\/\/www\.disneyplus\.com\/movies\/wd\/([0-9A-Za-z]{12})/,
		P7596: /^https?:\/\/www\.disneyplus\.com\/series\/wd\/([0-9A-Za-z]{12})/,
		P6181: /^https?:\/\/d23\.com\/a-to-z\/([^\s\/]+)/,
		P7772: /^https?:\/\/www\.atlasobscura\.com\/places\/([a-z\-]+)/,
		P8525: /^https?:\/\/edit\.tosdr\.org\/services\/(\d+)/,
		P2638: /^https?:\/\/www\.tv\.com\/((?:shows|movies|people|web)\/[a-z\d][a-z\d-/]*[a-z\d-])/,
		P3283: /^https?:\/\/([A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9]))\.bandcamp\.com/,
		P3040: /^https?:\/\/soundcloud.com\/([0-9A-Za-z/_-]+)/,
		P1953: /^https?:\/\/www\.discogs\.com\/(?:[a-z]+\/)?artist\/([1-9][0-9]*)/,
		P1955: /^https?:\/\/www\.discogs\.com\/(?:[a-z]+\/)?label\/([1-9][0-9]*)/,
		P1954: /^https?:\/\/www\.discogs\.com\/(?:[a-z]+\/)?(?:[^\/]+\/)?master\/([1-9][0-9]*)/,
		P2206: /^https?:\/\/www\.discogs\.com\/(?:[a-z]+\/)?(?:[^\/]+\/)?release\/([1-9][0-9]*)/,
		P7512: /^https?:\/\/[a-z]+\.startrek\.com\/database_article\/([\d\w\-_]+)/,
		P5905: /^https?:\/\/comicvine\.gamespot\.com\/wd\/(40(?:00|05|10|15|20|25|40|45|50|55|60|70|75)-\d+)/,
		P4933: /^https?:\/\/www\.bcdb\.com\/bcdb\/cartoon\.cgi\?film=([1-9]\d*)/,
		P6472: /^https?:\/\/gamefaqs\.gamespot\.com\/games\/franchise\/([1-9]\d*)/,
		P4769: /^https?:\/\/gamefaqs\.gamespot\.com\/[^\/]+\/([1-9]\d*)/,
		P5842: /^https?:\/\/(?:overcast\.fm\/itunes|podcasts\.apple\.com\/(?:[a-z]+\/)?podcast(?:[^\/]+\/)?\/id)([1-9][0-9]*)/,
		P7998: /^https?:\/\/www\.podchaser\.com\/podcasts\/[a-z\-]+([1-9]\d*)/,
		P4818: /^https?:\/\/panoptikum\.io\/podcasts\/([1-9]\d*)/,
		P7849: /^https?:\/\/panoptikum\.io\/episodes\/([1-9]\d*)/,
		P4110: /^https?:\/\/www\.crunchyroll\.com\/([^\/#?]+)/,
		P3134: /^https?:\/\/www\.tripadvisor\.com\/[\w-]+(?:g|d)(\d+)/,
		P3108: /^https?:\/\/www\.yelp\.com\/biz\/([^\/]+)/,
		P4085: /^https?:\/\/(?:myanimelist\.net|shikimori\.one)\/characters?\/z?([1-9]\d{0,5})/,
		P4086: /^https?:\/\/(?:myanimelist\.net|shikimori\.one)\/animes?\/z?([1-9]\d{0,5})/,
		P4087: /^https?:\/\/(?:myanimelist\.net|shikimori\.one)\/mangas?\/z?([1-9]\d{0,5})/,
		P4084: /^https?:\/\/(?:myanimelist\.net|shikimori\.one)\/people\/z?([1-9]\d{0,5})/,
		P1984: /^https?:\/\/(?:www\.)animenewsnetwork\.com\/encyclopedia\/manga\.php\?id=([1-9]\d*)/,
		P1985: /^https?:\/\/(?:www\.)animenewsnetwork\.com\/encyclopedia\/anime\.php\?id=([1-9]\d*)/,
		P1982: /^https?:\/\/(?:www\.)animenewsnetwork\.com\/encyclopedia\/people\.php\?id=([1-9]\d*)/,
		P1983: /^https?:\/\/(?:www\.)animenewsnetwork\.com\/encyclopedia\/company\.php\?id=([1-9]\d*)/,
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
