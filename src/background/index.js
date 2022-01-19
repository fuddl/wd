import {processJobs} from "./add-to-wikidata.js"
import {pushEnitiyToSidebar} from "./push-enitiy-to-sidebar.js"
import {setSidebarUrl} from "./navigation"
import activeIcon from 'url:../icons/wd.svg'
import {setupCommandListener} from "./command-listener"
import browser from 'webextension-polyfill'
import {Browser} from "../core/browser"

let tabStates = {};

function initTabState(tab) {
    if (!tabStates[tab.id]) {
        tabStates[tab.id] = {}
    }
}

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

async function toggleSidebar(tab) {
    initTabState(tab)

    if (browser.sidebarAction) {
        // if a user input handler waits on a promise, then its status as a user input handler is lost
        // and this call won't work
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/User_actions
        // so, we must do this before pushing the content to sidebar
        await browser.sidebarAction.toggle()
    } else {
        // todo I actually want this one in FF too, need a setting
        await toggleInlineSidebar()
    }

    if (tabStates[tab.id].mode === 'show_entity') {
        await pushEnitiyToSidebar(tabStates[tab.id].entity, tab.id)
    } else if (tabStates[tab.id].mode === 'propose_match') {
        await pushProposalToSidebar(tabStates[tab.id].proposals, tab.id)
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
        tabStates[sender.tab.id].mode = 'show_entity'
        tabStates[sender.tab.id].entity = event.wdEntityId
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

function collectPageLinks(event) {
    browser.tabs.query({
        currentWindow: true,
        active: true,
    }).then((tabs) => {
        for (let tab of tabs) {
            browser.tabs.insertCSS({file: "content/content__collect-page-links.css"})

            browser.tabs.sendMessage(
                tab.id,
                {
                    action: "collect_pagelinks",
                    subject: event.subject,
                },
            ).then(response => {
            }).catch((v) => {
                console.log(JSON.stringify(v))
            })
        }
    }).catch((v) => {
        console.log(v)
    })
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
            ).then(response => {
            }).catch((v) => {
                console.log(JSON.stringify(v))
            })
        }
    }).catch((v) => {
        console.log(v)
    })
}

async function handleMatchProposal(event, sender) {
    tabStates[sender.tab.id].mode = 'propose_match'
    tabStates[sender.tab.id].proposals = event.proposals

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
    tabStates[sender.tab.id].mode = false

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

    if (data.type === 'open_in_sidebar') {
        await pushEnitiyToSidebar(data.wdEntityId, data.tid)
    }

    if (data.type === 'wait') {
        await setSidebarUrl(data.tid || sender?.tab?.id, browser.runtime.getURL('sidebar/wait.html'))
    }

    // todo is this different in the inline-sidebar world?
    if (sender.tab) {
        initTabState(sender.tab)

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
        await processJobs(data.data, sender.tab?.id)
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
        collectPageLinks(data)
    }
    if (data.type === 'clear_pagelinks') {
        clearPageLinks()
    }

    return Promise.resolve('done')
});

browser.webNavigation.onHistoryStateUpdated.addListener(function(e) {
	browser.tabs.sendMessage(e.tabId, { action: "find_applicables" });
});
