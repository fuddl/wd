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

export { pushEnitiyToSidebar }