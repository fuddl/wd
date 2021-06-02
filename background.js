let tabStates = {};
let sidebarLocked = false;

function pushEnitiyToSidebar(id, tid, setPanel = true, nocache = false) {
	if (!sidebarLocked && setPanel) {
		browser.sidebarAction.setPanel({
			tabId: tid,
			panel: browser.runtime.getURL('sidebar/entity.html') + '?' + id + (nocache ? '#nocache' : ''),
		});
	} else {
		browser.runtime.sendMessage({
			type: 'entity_add',
			id: id,
		});
	}
}

async function openEnitiyInNewTab(id) {
	await browser.tabs.create({
		url: browser.runtime.getURL('sidebar/entity.html') + '?' + id
	});
}

function pushProposalToSidebar(proposals, tid) {
	proposals.fromTab = tid;
	if (!sidebarLocked) {
		browser.sidebarAction.setPanel({
			tabId: tid,
			panel: browser.runtime.getURL('sidebar/connector.html') + '?' + encodeURIComponent(JSON.stringify(proposals)),
		});
	}
}

browser.browserAction.onClicked.addListener((tab) => {
	let tid = tab.id;
	if (!tabStates[tid]) {
		tabStates[tid] = {};
	}
	if (browser.sidebarAction) {
		if (!tabStates[tid].sidebarOpen) {
			if (tabStates[tid].mode === 'show_entity') {
				(async () => {
					pushEnitiyToSidebar(tabStates[tid].entity, tid);
				})();
			} else if(tabStates[tid].mode === 'propose_match') {
				(async () => {
					pushProposalToSidebar(tabStates[tid].proposals, tid);
				})();
			}
			browser.sidebarAction.open();
			tabStates[tid].sidebarOpen = true;
		} else {
			browser.sidebarAction.close();
			tabStates[tid].sidebarOpen = false;
		}
	} else {
		openEnitiyInNewTab(tabStates[tid].entity);
	}
});

async function addToUrlCache(id, url) {
	let cache = await browser.storage.local.get();
	if (!('urlCache' in cache)) {
		cache.urlCache = {};
	}
	cache.urlCache[url] = id;
	browser.storage.local.set(cache);
}

async function openInSidebarIfSidebarIsOpen(entityId, tab, setPanel) {
	if (await browser.sidebarAction.isOpen({})) {
		pushEnitiyToSidebar(entityId, tab, setPanel);
	}
};

browser.runtime.onMessage.addListener(
	(data, sender) => {

		if(data.type === 'open_in_sidebar') {
			(async () => {
				pushEnitiyToSidebar(data.wdEntityId, data.tid);
			})()
		}

		if(data.type === 'wait') {
			(async () => {
				browser.sidebarAction.setPanel({
					tabId: data.tid,
					panel: browser.runtime.getURL('sidebar/wait.html'),
				});
			})()
		}

		if (sender.tab) {
			if (!tabStates[sender.tab.id]) {
				tabStates[sender.tab.id] = {};
			}
			if (data.type === 'match_event') {
				if (!sidebarLocked) {
					tabStates[sender.tab.id].mode = 'show_entity';
					tabStates[sender.tab.id].entity = data.wdEntityId;
					browser.browserAction.setIcon({
						path: "icons/wd.svg",
						tabId: sender.tab.id,
					});
					browser.browserAction.setTitle({
						title: data.wdEntityId,
						tabId: sender.tab.id,
					});
				}
				(async () => {
					let tabDest = sender.tab.id ? sender.tab.id : await browser.tabs.getCurrent();
					openInSidebarIfSidebarIsOpen(data.wdEntityId, tabDest, data.openInSidebar);
				})();

				addToUrlCache(data.wdEntityId, data.url);
			} else if(data.type === 'match_proposal') {
				tabStates[sender.tab.id].mode = 'propose_match';
				tabStates[sender.tab.id].proposals = data.proposals;

				browser.browserAction.setIcon({
					path: "icons/halfactive.svg",
					tabId: sender.tab.id,
				});

				browser.browserAction.setTitle({
					title: data.proposals.ids[0][0].value,
					tabId: sender.tab.id,
				});

				(async () => {
					if (await browser.sidebarAction.isOpen({})) {
						pushProposalToSidebar(data.proposals, sender.tab.id);
					}
				})();	
			} else {
				tabStates[sender.tab.id].mode = false;

				browser.browserAction.setIcon({
					path: "icons/inactive.svg",
					tabId: sender.tab.id,
				});
				browser.browserAction.setTitle({
					title: 'Wikidata',
					tabId: sender.tab.id,
				});
			}
		} else {
			if(data.type === 'add_url_cache') {
				addToUrlCache(data.id, data.url);	
			}
			if(data.type === 'send_to_wikidata') {
				processJobs(data.data);
			}
			if (data.type === 'open_adder') {
					sidebarLocked = true;
						browser.sidebarAction.setPanel({
					panel: browser.runtime.getURL('sidebar/add.html') + '?' + data.entity,
				});
			}
			if (data.type === 'unlock_sidebar') {
				sidebarLocked = false;
			}
			if (data.type === 'use_in_statement') {
				browser.runtime.sendMessage({
					type: 'use_in_statement',
					dataype: data.dataype,
					value: data.value ? data.value : null,
					wdEntityId: data.entityId ? data.entityId : null,
					reference: data.reference ? data.reference : null,
				});
			}
			if(data.type === 'collect_pagelinks') {
				browser.tabs.query({
					currentWindow: true,
					active: true
				}).then((tabs) => {
					for (let tab of tabs) {
						browser.tabs.insertCSS({file: "content/content__collect-page-links.css"});
						
						browser.tabs.sendMessage(
							tab.id,
							{
								action: "collect_pagelinks",
								subject: data.subject
							}
						).then(response => {
						}).catch((v) => {
							console.log(JSON.stringify(v));
						});
					}
				}).catch((v) => {
				 	console.log(v);
				});
			}
			if(data.type === 'clear_pagelinks') {
				browser.tabs.query({
					currentWindow: true,
					active: true
				}).then((tabs) => {
					for (let tab of tabs) {
												browser.tabs.sendMessage(
							tab.id,
							{ action: "clear_pagelinks" }
						).then(response => {
						}).catch((v) => {
							console.log(JSON.stringify(v));
						});
					}
				}).catch((v) => {
				 	console.log(v);
				});
			}
		}
		return Promise.resolve('done');
	});

browser.webNavigation.onHistoryStateUpdated.addListener(function(e) {
	browser.tabs.sendMessage(e.tabId, { action: "find_applicables" });
});
