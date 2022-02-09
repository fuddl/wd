import {RegexResolver} from './types'

export const wikidata: RegexResolver = {
	regex: /^https:\/\/[\w]+.wikidata.org\/w(?:iki\/|\/index\.php\?title=)(?:Special:WhatLinksHere\/|Talk:)?(?:\w+:)?([QMPL]\d+)/,
	async applicable(location) {
		return location.href.match(this.regex) !== null
	},
	async getEntityId(location) {
		return location.href.match(this.regex)[1]
	},
}
