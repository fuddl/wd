resolvers.cache = {
	applicable: async function(location) {
		let cache = await browser.storage.local.get('urlCache');
		if ('urlCache' in cache) {
			return location.href in cache.urlCache;
		} else {
			return false;
		}
	},
	getEntityId: async function(location) {
		let cache = await browser.storage.local.get('urlCache');
		console.log(`Got ${cache.urlCache[location.href]} from cache.`)
		return cache.urlCache[location.href];
	},
	noCache: true,
};