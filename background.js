let tabEnities = {};

function pushEnitiyToSidebar(id, tid) {
	browser.sidebarAction.setPanel({
		tabId: tid,
		panel: browser.runtime.getURL('sidebar/entity.html') + '?' + id,
	});
}

browser.browserAction.onClicked.addListener((tab) => {
	let tid = tab.id;
	if (!tabEnities.hasOwnProperty(tid)) {
		tabEnities[tid] = {};
	}
	if (!tabEnities[tid].sidebarOpen) {
		(async () => {
			console.log(tabEnities[tid].id);
			pushEnitiyToSidebar(tabEnities[tid].id, tid);
		})();
		browser.sidebarAction.open();
		tabEnities[tid].sidebarOpen = true;
	} else {
		browser.sidebarAction.close();
		tabEnities[tid].sidebarOpen = false;
	}
});

browser.runtime.onMessage.addListener( 
	(data, sender) => {
		if (data.type === 'match_event') {
			if (data.wdEntityId) {
				if (!tabEnities.hasOwnProperty(sender.tab.id)) {
					tabEnities[sender.tab.id] = {};
				}
				tabEnities[sender.tab.id].id = data.wdEntityId;
				browser.browserAction.setIcon({
					path: "icons/wd.svg",
					tabId: sender.tab.id,
				});
				(async () => {
					if (await browser.sidebarAction.isOpen({})) {
						console.log(data.wdEntityId);
						pushEnitiyToSidebar(data.wdEntityId, sender.tab.id);
					}
				})();
			} else {
				browser.browserAction.setIcon({
					path: "icons/inactive.svg",
					tabId: sender.tab.id,
				});
			}
		}
		return Promise.resolve('done');
});