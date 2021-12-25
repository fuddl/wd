import browser from 'webextension-polyfill'
import {Browser} from "./core/browser"

async function updateStatus(parts) {
    const message = {
        type: 'status',
        message: parts,
    }
    await browser.runtime.sendMessage(message)
    await Browser.sendMessageToActiveTab(message)
}

function updateStatusInternal(parts) {
	window.postMessage({
		type: 'status',
		message: parts,
	}, browser.runtime.getURL(''));
}

export { updateStatus, updateStatusInternal }
