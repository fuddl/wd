resolvers.cache = {
	applicable: async function(location) {
		let cache = await browser.storage.local.get('mapCache');
		if ('mapCache' in cache) {
			return location.href in cache.mapCache;
		} else {
			return false;
		}
	},
	getEntityId: async function(location) {
		let cache = await browser.storage.local.get('mapCache');
		return cache.mapCache[location.href];
	},
	noCache: true,
};