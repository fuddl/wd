resolvers.p8966 = {
	aquireRegexes: async function() {
		let query = `
			SELECT ?p ?s ?r WHERE {
				?stat ps:P8966 ?s.
				OPTIONAL { ?stat pq:P8967 ?r. }
				?prop	p:P8966 ?stat.
				BIND(REPLACE(STR(?prop), 'http://www.wikidata.org/entity/', '')	AS ?p ).
			} ORDER BY STRLEN(str(?s))
		`;
		let patterns = await sparqlQuery(query);
		output = [];
		for (prop of patterns) {
			let isValid = true;
			let regexp = false;
			try {
					regexp = new RegExp(prop.s.value + '.*', 'g');
			} catch(e) {
					isValid = false;
					console.warn('This regex is not valid', JSON.stringify(prop, null, 2));
			}
			if (isValid) {
				output.push({
					p: prop.p.value,
					s: regexp,
					r: prop?.r?.value ? prop.r.value.replace(/\\(\d+)/g, "$$$1") : "$1",
				});
			}
		}
		return output;
	},
	applicable: async function(location) {
		this.patterns = await this.aquireRegexes();
		let href = decodeURIComponent(location.href);
		for (prop of this.patterns) {
			let match = href.match(prop.s);
			if (match) {
				return [{
					prop: prop.p,
					value: href.replace(prop.s, prop.r),
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
		return await this.getEntityByRegexedId(prop, id);
	},
	getEntityByRegexedId: async function(prop, id) {
		let cached = await this.checkIfCached(prop, id);
		if (cached) {
			return cached;
		}
		let query = `
			SELECT ?item
			WHERE {
				?item wdt:${ prop } "${ id }".
			}
		`;
		let result = await sparqlQuery(query);
		if (result[0]) {
			let entityId = result[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(\w\d+)/)[1];
			await this.addToExternalIDCache(prop, id, entityId);
			return entityId;
		} else {
			return false;
		}
	},
	formCacheKey: function(prop, id) {
		return `${prop}:${id}`;
	},
	checkIfCached: async function(prop, id) {
		let cache = await browser.storage.local.get('externalIDCache');
		let cacheKey = this.formCacheKey(prop, id);
		if ('externalIDCache' in cache && cacheKey in cache.externalIDCache) {
			console.debug(`Found ${cacheKey} in externalIDCache`);
			return cache.externalIDCache[cacheKey];
		} else {
			return false;
		}
	},
	addToExternalIDCache: async function(prop, id, entityId) {
		let cache = await browser.storage.local.get();
		if (!('externalIDCache' in cache)) {
			cache.externalIDCache = {};
		}
		cache.externalIDCache[this.formCacheKey(prop, id)] = entityId;
		browser.storage.local.set(cache);
	}
};
