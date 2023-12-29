import { sparqlQuery } from '../sqarql-query.js'
import * as browser from 'webextension-polyfill'
import { Resolver } from './types'
import ISBN from 'isbn3' 

const URL_match_pattern: Resolver = {
	id: 'URL_match_pattern',
	aquireRegexes: async function() {

		const query = `
			SELECT ?p ?s ?r ?c ?t WHERE {
				?stat ps:P8966 ?s.
				OPTIONAL { ?stat pq:P8967 ?r. }
				OPTIONAL { ?stat pq:P10999 ?t }
				?prop p:P8966 ?stat.
				BIND(IF(EXISTS{?prop wdt:P1552 wd:Q3960579}, 'upper',
					IF(EXISTS{?prop wdt:P1552 wd:Q65048529}, 'lower',
						IF(EXISTS{?prop wdt:P1552 wd:Q55121183}, 'insensitive', '')
					)
				) AS ?c)
				BIND(REPLACE(STR(?prop), 'http://www.wikidata.org/entity/', '')	AS ?p ).
				FILTER (?p != 'P4033')
				MINUS {
					?prop wdt:P31 wd:Q18644427.
				}
				MINUS {
					?prop wikibase:propertyType wikibase:GlobeCoordinate.
                }
				${ /* giving a high priority to ids representing wiki articles */ '' }
				OPTIONAL {
					?prop wdt:P31 wd:Q123667996.
					BIND(1 as ?prio)
				}
				${ /* giving a low priority to ids representing a full url */ '' }
				OPTIONAL {
					?prop wikibase:propertyType wikibase:Url.
					BIND(3 as ?prio)
				}
				${ /* giving everything else a default priority */ '' }
				BIND(IF(BOUND(?prio),?prio,2) AS ?prio).
			} ORDER BY ?prio STRLEN(str(?s))
		`

		const patterns = await sparqlQuery(query)
		const output = []
		for (const prop of patterns) {
			let isValid = true
			let regexp = false
			try {
				regexp = new RegExp(prop.s.value + '.*', 'g')
			} catch(e) {
				isValid = false
				console.warn('This regex is not valid', JSON.stringify(prop, null, 2))
			}
			if (isValid) {
				output.push({
					p: prop.p.value,
					s: regexp,
					r: 'r' in prop ? prop.r.value.replace(/\\(\d+)/g, '$$$1') : '$1',
					c: 'c' in prop ? prop.c.value : '',
					t: 't' in prop ? prop.t.value : '',
				})
			}
		}
		return output
	},
	isbnProperties: {
		P212: {
			test: 'isIsbn13',
			format: 'isbn13h',
		},
		P957: {
			test: 'isIsbn10',
			format: 'isbn10h',
		},
	},
	async applicable(location) {
		if (!this.patterns) {
			this.patterns = await this.aquireRegexes()
		}
		const href = decodeURIComponent(location.href)
		for (const prop of this.patterns) {
			const match = href.match(prop.s)
			if (match) {
			
				let id = href.replace(prop.s, prop.r);
				let label = null
				let desiredId = id;
				switch (prop.c) {
					case 'upper':
						desiredId = id.toUpperCase();
						break;
					case 'lower':
					case 'insensitive':
						desiredId = id.toLowerCase();
						break;
				}

				if (prop?.t && document?.title) {
					try {
						const titleExtractionResult = new RegExp(prop.t , 'g').exec(document.title)
						if (titleExtractionResult?.[1]) {
							label = titleExtractionResult[1]
						}
					} catch(e) {
						isValid = false
						console.warn('This title extractor regex is not valid', JSON.stringify(prop, null, 2))
					}
				}

				if (Object.keys(this.isbnProperties).includes(prop.p)) {
					const parsedISBN = ISBN.parse(desiredId)
					if (parsedISBN?.isValid) {
						for (const key in this.isbnProperties) {
							if (parsedISBN[this.isbnProperties[key].test]) {
								prop.p = key
								desiredId = parsedISBN[this.isbnProperties[key].format]
							}
						}
					}
				}

				return [{
					prop: prop.p,
					label: label, 
					value: desiredId,
					case: prop.c ?? '',
					recommended: true,
				}]
			}
		}
		return false
	},
	async getEntityId(location) {
		const applicable = await this.applicable(location)

		const prop = applicable[0].prop
		const id = applicable[0].value
		const c = applicable[0].case


		return await this.getEntityByRegexedId(prop, id, c)
	},
	getEntityByRegexedId: async function(prop, id, c = '') {
		const cached = await this.checkIfCached(prop, id)
		if (cached) {
			return cached
		}

		const query = `
			SELECT ?item
			WHERE {
				?item wdt:${ prop } ${ c == 'insensitive' ? '?id' : `"${ id.replace(/"/g, '\\"') }"`}.
				${ c == 'insensitive' ? `filter(lcase(?id) = "${ id }")` : ''}
			}
		`

		const result = await sparqlQuery(query)
		if (result[0]) {
			const entityId = result[0].item.value.match(/https?:\/\/www\.wikidata\.org\/entity\/(\w\d+)/)[1]
			await this.addToExternalIDCache(prop, id, entityId)
			return entityId
		} else {
			return false
		}
	},
	formCacheKey: function(prop, id) {
		return `${prop}:${id}`
	},
	checkIfCached: async function(prop, id) {
		const cache = await browser.storage.local.get('externalIDCache')
		const cacheKey = this.formCacheKey(prop, id)
		if ('externalIDCache' in cache && cacheKey in cache.externalIDCache) {
			return cache.externalIDCache[cacheKey]
		} else {
			return false
		}
	},
	addToExternalIDCache: async function(prop, id, entityId) {
		const cache = await browser.storage.local.get()
		if (!('externalIDCache' in cache)) {
			cache.externalIDCache = {}
		}
		cache.externalIDCache[this.formCacheKey(prop, id)] = entityId
		browser.storage.local.set(cache)
	}
}

export { URL_match_pattern }
