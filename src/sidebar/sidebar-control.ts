import * as browser from "webextension-polyfill"

export async function unlockAndWait(currentTab: number) {
	await browser.runtime.sendMessage({
		type: 'unlock_sidebar',
	})

	await browser.runtime.sendMessage({
		type: 'wait',
		tid: currentTab,
	})
}
