import * as browser from 'webextension-polyfill'
import {Browser} from '../core/browser'

export const setupCommandListener = () => {
	// For now just redirect to current tab, as that's where we want to handle shortcuts
	browser.commands.onCommand.addListener(
		async command => Browser.sendMessageToActiveTab({type: command}))
}
