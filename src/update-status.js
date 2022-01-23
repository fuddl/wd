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

export {updateStatus}
