import * as browser from 'webextension-polyfill'

export const Browser = {
    // Does not work from content scripts
    getActiveTab: () =>
        browser.tabs.query({currentWindow: true, active: true})
            .then(tabs => tabs[0]),

    async sendMessageToActiveTab(message: any) {
        /**
         * If we're in the content script context - force context change and re-broadcast message to origin tab
         */
        if (browser.tabs) {
            return browser.tabs.sendMessage((await this.getActiveTab()).id, message)
        } else {
            return browser.runtime.sendMessage({type: 'broadcast-to-active-tab', message})
        }
    },

    async getCurrentTabIdForAllContexts() {
        if (browser.tabs) {
            return (await this.getActiveTab()).id
        }

        return browser.runtime.sendMessage({type: 'get-tab-id'})
    },
}
