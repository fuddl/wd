let currentMatch = {};

browser.browserAction.onClicked.addListener((tab) => {
	let id = tab.id;
	if (currentMatch.hasOwnProperty(id) && !currentMatch[id].sidebarOpen) {
		(async () => {
			const entity = await getEntityByAuthorityId(currentMatch[id].prop, currentMatch[id].id);
			browser.sidebarAction.setPanel({
				tabId: id,
				panel: browser.runtime.getURL('sidebar/entity.html') + '?' + entity[0].item.value,
			});
		})();
		browser.sidebarAction.open();
		currentMatch[id].sidebarOpen = true;
	} else {
		browser.sidebarAction.close();
		currentMatch[id].sidebarOpen = false;
	}
});

browser.runtime.onMessage.addListener( 
  (data, sender) => {
  	if (data.match) {
      currentMatch[sender.tab.id] = data;
		  browser.browserAction.setIcon({
			  path: "icons/wd.svg",
			  tabId: sender.tab.id,
			});
			(async () => {
				const entity = await getEntityByAuthorityId(currentMatch[sender.tab.id].prop, currentMatch[sender.tab.id].id);
				browser.sidebarAction.setPanel({
					tabId: sender.tab.id,
					panel: browser.runtime.getURL('sidebar/entity.html') + '?' + entity,
				});
			})();
  	} else {
		  browser.browserAction.setIcon({
			  path: "icons/inactive.svg",
			  tabId: sender.tab.id,
			});
  	}
    return Promise.resolve('done');
});