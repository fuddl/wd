let tabStates = {};

function pushEnitiyToSidebar(id, tid) {
	browser.sidebarAction.setPanel({
		tabId: tid,
		panel: browser.runtime.getURL('sidebar/entity.html') + '?' + id,
	});
}

async function openEnitiyInNewTab(id) {
	await browser.tabs.create({
    url: browser.runtime.getURL('sidebar/entity.html') + '?' + id
  });
}

function pushProposalToSidebar(proposals, tid) {
	browser.sidebarAction.setPanel({
		tabId: tid,
		panel: browser.runtime.getURL('sidebar/connector.html') + '?' + JSON.stringify(proposals),
	});
}

browser.browserAction.onClicked.addListener((tab) => {
	let tid = tab.id;
	if (!tabStates[tid]) {
		tabStates[tid] = {};
	}
	if (browser.sidebarAction) {
		if (!tabStates[tid].sidebarOpen) {
			console.log(tabStates[tid].mode);
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

browser.runtime.onMessage.addListener(
	(data, sender) => {
		if (!tabStates[sender.tab.id]) {
			tabStates[sender.tab.id] = {};
		}
		if (data.type === 'match_event') {
			tabStates[sender.tab.id].mode = 'show_entity';
			tabStates[sender.tab.id].entity = data.wdEntityId;
			browser.browserAction.setIcon({
				path: "icons/wd.svg",
				tabId: sender.tab.id,
			});
			(async () => {
				if (await browser.sidebarAction.isOpen({})) {
					pushEnitiyToSidebar(data.wdEntityId, sender.tab.id);
				}
			})();
		} else if(data.type === 'match_proposal') {
			tabStates[sender.tab.id].mode = 'propose_match';
			tabStates[sender.tab.id].proposals = data.proposals;

			browser.browserAction.setIcon({
				path: "icons/halfactive.svg",
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
		}
		return Promise.resolve('done');
});