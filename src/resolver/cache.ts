import * as browser from 'webextension-polyfill'
import {Resolver} from './types'

const cache: Resolver = {
	id: 'cache',
	async applicable(location) {
		const cache = await browser.storage.local.get('urlCache')
		if ('urlCache' in cache) {
			return location.href in cache.urlCache
		} else {
			return false
		}
	},
	async getEntityId(location) {
		const cache = await browser.storage.local.get('urlCache')
		console.log(`Got ${cache.urlCache[location.href]} from cache.`)
		return cache.urlCache[location.href]
	},
	noCache: true,
}

export { cache }
