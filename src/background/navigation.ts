import * as browser from "webextension-polyfill"

/**
 * Provides an abstraction over switching iframe & actual sidebar state
 */
export const setSidebarUrl = async (tabId, url) => {
    await browser.tabs.sendMessage(tabId, {
        type: 'update-panel-url',
        url
    })

    await browser.sidebarAction?.setPanel({
        tabId,
        panel: url,
    })
}
