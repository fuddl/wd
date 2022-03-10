import { sparqlQuery } from '../sqarql-query.js'
import * as browser from 'webextension-polyfill'
import {Resolver} from './types'

const URL_match_pattern: Resolver = {
	id: 'URL_match_pattern',
	aquireRegexes: async function() {

		const query = `
			SELECT ?p ?s ?r ?ci WHERE {
				?stat ps:P8966 ?s.
				OPTIONAL { ?stat pq:P8967 ?r. }
				?prop	p:P8966 ?stat.
				BIND(REPLACE(STR(?prop), 'http://www.wikidata.org/entity/', '')	AS ?p ).
				OPTIONAL {
					?prop p:P1552 ?ci.
					?ci ps:P1552 wd:Q55121297.
				}
			} ORDER BY STRLEN(str(?s))
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
					ci: 'ci' in prop ? typeof prop.ci.value === 'string' : false,
				})
			}
		}
		return output
	},
	async applicable(location) {
		if (!this.patterns) {
			this.patterns = await this.aquireRegexes()
		}
		const href = decodeURIComponent(location.href)
		for (const prop of this.patterns) {
			const match = href.match(prop.s)
			if (match) {
				return [{
					prop: prop.p,
					value: href.replace(prop.s, prop.r),
					valueIsCaseInsensitive: prop?.ci,
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
		const ci = applicable[0].valueIsCaseInsensitive

		return this.getEntityByRegexedId(prop, id, ci)
	},
	getEntityByRegexedId: async function(prop, id, ci = false) {
		const cached = await this.checkIfCached(prop, id)
		if (cached) {
			return cached
		}
		const query = `
			SELECT ?item
			WHERE {
				?item wdt:${ prop } ${ ci ? '?id' : `"${id}"`}.
				${ ci ? `filter(lcase(?id) = "${ id.toLowerCase() }")` : ''}
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
		return browser.storage.local.set(cache)
	}
}

export { URL_match_pattern }
