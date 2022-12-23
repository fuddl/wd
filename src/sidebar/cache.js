async function initializeCache() {
	console.debug('initializing cache')
	window.cache = await browser.storage.local.get();
}

export { initializeCache }