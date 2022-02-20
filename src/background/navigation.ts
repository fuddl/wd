import * as browser from "webextension-polyfill"

/**
 * Provides an abstraction over switching iframe & actual sidebar state
 */
export const setSidebarUrl = async (tabId, url) => {
    if ('sidebarAction' in browser) {
        await browser.sidebarAction.setPanel({
            tabId,
            panel: url,
        });
    } else {
        await browser.tabs.sendMessage(tabId, {
            type: 'update-panel-url',
            url,
        })  
    }

}
