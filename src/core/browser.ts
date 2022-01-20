import * as browser from 'webextension-polyfill'

export const Browser = {
    // Does not work from content scripts
    getActiveTab: () =>
        browser.tabs.query({currentWindow: true, active: true})
            .then(tabs => tabs[0]),

    sendMessageToActiveTab(message: any) {
        return this.getActiveTab().then(tab => browser.tabs.sendMessage(tab.id!, message))
    },

    async getCurrentTabIdForAllContexts() {
        if (browser.tabs) {
            return (await this.getActiveTab()).id
        }

        return browser.runtime.sendMessage({type: 'get-tab-id'})
    },
}
