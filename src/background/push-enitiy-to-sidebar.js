import browser from 'webextension-polyfill'
import {getInternalUrlForEntity} from "../core/navigation"

function pushEnitiyToSidebar(id, tid, setPanel = true, nocache = false) {
	if (!sidebarLocked && setPanel) {
		browser.sidebarAction.setPanel({
			tabId: tid,
			panel: getInternalUrlForEntity(id, nocache),
		});
	} else {
		browser.runtime.sendMessage({
			type: 'entity_add',
			id: id,
		});
	}
}

export { pushEnitiyToSidebar }
