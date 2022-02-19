import {processJobs} from "./add-to-wikidata.js"
import {pushEnitiyToSidebar} from "./push-enitiy-to-sidebar.js"
import {setSidebarUrl} from "./navigation"
import activeIcon from 'url:../icons/wd.svg'
import {setupCommandListener} from "./command-listener"
import browser from 'webextension-polyfill'
import {Browser} from "../core/browser"

window.sidebarLocked = false;

function pushProposalToSidebar(proposals, tid) {
	proposals.fromTab = tid;
	if (!sidebarLocked) {
		return setSidebarUrl(tid, browser.runtime.getURL('sidebar/connector.html') + '?' + encodeURIComponent(JSON.stringify(proposals)))
	}
}

setupCommandListener()

const toggleInlineSidebar = async () =>
    Browser.sendMessageToActiveTab({type: "toggle-sidebar"})

async function toggleSidebar() {
    if ('sidebarAction' in browser) {
        // note: if a user input handler waits on a promise, then its status as a user input handler is lost
        // and this call won't work
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/User_actions
        await browser.sidebarAction.toggle()
    } else {
        // todo I actually want this one in FF too, need a setting
        // also rn the shortcut only works with the iframe sidebar, so there need to call this function instead
        await toggleInlineSidebar()
    }
}

browser.browserAction.onClicked.addListener(toggleSidebar)

async function addToUrlCache(id, url) {
	let cache = await browser.storage.local.get();
	if (!('urlCache' in cache)) {
		cache.urlCache = {};
	}
	cache.urlCache[url] = id;
	await browser.storage.local.set(cache);
}

async function handleMatchEvent(event, sender) {
    if (!sidebarLocked) {
        await browser.browserAction.setIcon({
            path: activeIcon,
            tabId: sender.tab.id,
        })
        await browser.browserAction.setTitle({
            title: event.wdEntityId,
            tabId: sender.tab.id,
        })
    }

    let tabDest = sender.tab?.id ? sender.tab.id : await browser.tabs.getCurrent()
    await pushEnitiyToSidebar(event.wdEntityId, tabDest, event.openInSidebar)

    return addToUrlCache(event.wdEntityId, event.url)
}

async function collectPageLinks(event) {
    const tab = await Browser.getActiveTab()
    browser.tabs.insertCSS(tab.id, {file: "content/content__collect-page-links.css"})

    await browser.tabs.sendMessage(
        tab.id,
        {
            action: "collect_pagelinks",
            subject: event.subject,
        },
    )
}

function clearPageLinks() {
    browser.tabs.query({
        currentWindow: true,
        active: true,
    }).then((tabs) => {
        for (let tab of tabs) {
            browser.tabs.sendMessage(
                tab.id,
                {action: "clear_pagelinks"},
            ).catch((v) => {
                console.log(JSON.stringify(v))
            })
        }
    }).catch((v) => {
        console.log(v)
    })
}

async function handleMatchProposal(event, sender) {
    await browser.browserAction.setIcon({
        path: "icons/halfactive.svg",
        tabId: sender.tab.id,
    })

    await browser.browserAction.setTitle({
        title: event.proposals.ids[0][0].value,
        tabId: sender.tab.id,
    })

    await pushProposalToSidebar(event.proposals, sender.tab.id)
}

async function resetState(sender) {
    await browser.browserAction.setIcon({
        path: "icons/inactive.svg",
        tabId: sender.tab.id,
    })
    await browser.browserAction.setTitle({
        title: 'Wikidata',
        tabId: sender.tab.id,
    })
}

const getTabId =
    async sender => sender?.tab?.id
        || (await Browser.getActiveTab()).id

browser.runtime.onMessage.addListener(async (data, sender) => {
    console.log("background message", data, sender)

    if (data.type === 'get-tab-id') return sender.tab.id
    if (data.type === 'broadcast-to-active-tab') return Browser.sendMessageToActiveTab(data.message)

    if (data.type === 'open_in_sidebar') {
        await pushEnitiyToSidebar(data.wdEntityId, data.tid)
    }

    if (data.type === 'wait') {
        await setSidebarUrl(data.tid || sender?.tab?.id, browser.runtime.getURL('sidebar/wait.html'))
    }

    if (sender.tab) {
        if (data.type === 'match_event') {
            await handleMatchEvent(data, sender)
        } else if (data.type === 'match_proposal') {
            await handleMatchProposal(data, sender)
        } else {
            await resetState(sender)
        }
    }
    if (data.type === 'add_url_cache') {
        await addToUrlCache(data.id, data.url)
    }
    if (data.type === 'send_to_wikidata') {
        await processJobs(data.data)
    }
    if (data.type === 'unlock_sidebar') {
        sidebarLocked = false
    }

    if (data.type === 'open_adder') {
        sidebarLocked = true
        await setSidebarUrl(
            await browser.tabs.getCurrent(),
            browser.runtime.getURL('sidebar/add.html') + '?' + data.entity)
    }

    if (data.type === 'use_in_statement') {
        const message = {
            type: 'use_in_statement',
            dataype: data.dataype,
            value: data.value ? data.value : null,
            wdEntityId: data.entityId ? data.entityId : null,
            reference: data.reference ? data.reference : null,
        }
        await browser.runtime.sendMessage(message)
        await browser.tabs.sendMessage(await getTabId(sender), message)
    }


    if (data.type === 'collect_pagelinks') {
        await collectPageLinks(data)
    }
    if (data.type === 'clear_pagelinks') {
        clearPageLinks()
    }
})

browser.storage.local.set({'sidebarActionSupported': 'sidebarAction' in browser})

browser.webNavigation.onHistoryStateUpdated.addListener(
    e => browser.tabs.sendMessage(e.tabId, {action: "find_applicables"}))
