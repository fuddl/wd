import {processJobs} from "./add-to-wikidata.js"
import {pushEnitiyToSidebar} from "./push-enitiy-to-sidebar.js"
import {setSidebarUrl} from "./navigation"
import activeIcon from 'url:../icons/wd.svg'
import {setupCommandListener} from "./command-listener"
import browser from 'webextension-polyfill'
import {Browser} from "../core/browser"

let tabStates = {};
window.sidebarLocked = false;

async function openEnitiyInNewTab(id) {
	await browser.tabs.create({
		url: browser.runtime.getURL('sidebar/entity.html') + '?' + id
	});
}

function pushProposalToSidebar(proposals, tid) {
	proposals.fromTab = tid;
	if (!sidebarLocked) {
		return setSidebarUrl(tid, browser.runtime.getURL('sidebar/connector.html') + '?' + encodeURIComponent(JSON.stringify(proposals)))
	}
}

setupCommandListener()

const toggleInlineSidebar = async () =>
    Browser.sendMessageToActiveTab({type: "toggle-sidebar"})

browser.browserAction.onClicked.addListener(async (tab) => {
	let tid = tab.id;
	if (!tabStates[tid]) {
		tabStates[tid] = {};
	}
	if (browser.sidebarAction) {
		if (!tabStates[tid].sidebarOpen) {
			if (tabStates[tid].mode === 'show_entity') {
				await pushEnitiyToSidebar(tabStates[tid].entity, tid);
			} else if(tabStates[tid].mode === 'propose_match') {
                await pushProposalToSidebar(tabStates[tid].proposals, tid)
			}
			await browser.sidebarAction.open();
			tabStates[tid].sidebarOpen = true;
		} else {
			await browser.sidebarAction.close();
			tabStates[tid].sidebarOpen = false;
		}
	} else {
        //todo need better handling here if we actually want "open in new tab" behavior in some cases
        await toggleInlineSidebar()
		// openEnitiyInNewTab(tabStates[tid].entity);
	}
});

async function addToUrlCache(id, url) {
	let cache = await browser.storage.local.get();
	if (!('urlCache' in cache)) {
		cache.urlCache = {};
	}
	cache.urlCache[url] = id;
	await browser.storage.local.set(cache);
}

async function openInSidebarIfSidebarIsOpen(entityId, tab, setPanel) {
	// todo may always be false in chrome?
	// if (await browser.sidebarAction.isOpen({})) {
		await pushEnitiyToSidebar(entityId, tab, setPanel);
	// }
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
    await openInSidebarIfSidebarIsOpen(event.wdEntityId, tabDest, event.openInSidebar)

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

    // todo
    // if (await browser.sidebarAction.isOpen({})) {
    await pushProposalToSidebar(event.proposals, sender.tab.id)
    // }
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

function initTabState(sender) {
    if (!tabStates[sender.tab.id]) {
        tabStates[sender.tab.id] = {}
    }
}

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
        initTabState(sender)

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
        await browser.runtime.sendMessage({
            type: 'use_in_statement',
            dataype: data.dataype,
            value: data.value ? data.value : null,
            wdEntityId: data.entityId ? data.entityId : null,
            reference: data.reference ? data.reference : null,
        })
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
