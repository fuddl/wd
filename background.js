browser.runtime.onMessage.addListener((data, sender) => {
	const tid = sender.tab.id;
	if (data.type === 'tab_resolved') {
		browser.pageAction.setTitle({
			title: data.id,
			tabId: tid,
		});
		browser.pageAction.setIcon({
			tabId: sender.tab.id,
			path: {
				16: "icons/wd.svg",
				32: "icons/wd.svg"
			}
		});
		browser.pageAction.show(tid);
		return Promise.resolve();
	}
	if (data.type === 'tab_unresolved') {
		browser.pageAction.setTitle({
			title: 'Wikidata',
			tabId: tid,
		});
		browser.pageAction.setIcon({
			tabId: tid,
			path: {
				16: "icons/inactive--light.svg",
				32: "icons/inactive--light.svg"
			}
		});
		browser.pageAction.hide(tid);
		return Promise.resolve();
	}
});
