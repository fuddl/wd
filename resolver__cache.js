resolvers.cache = {
	applicable: async function(location) {
		let cache = await browser.storage.local.get('mapCache');
		return location.href in cache.mapCache;
	},
	getEntityId: async function(location) {
		let cache = await browser.storage.local.get('mapCache');
		return cache.mapCache[location.href];
	},
	noCache: true,
};