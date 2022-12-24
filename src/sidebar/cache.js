import browser from 'webextension-polyfill'

async function initializeCache() {
	window.cache = await browser.storage.local.get();
}

export { initializeCache }