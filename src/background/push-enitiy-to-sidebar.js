import browser from 'webextension-polyfill'
import {getInternalUrlForEntity} from "../core/navigation"
import {setSidebarUrl} from "./navigation"

function pushEnitiyToSidebar(id, tid, setPanel = true, nocache = false) {
	if (!sidebarLocked && setPanel) {
		return setSidebarUrl(tid, getInternalUrlForEntity(id, nocache))
	} else {
		return browser.runtime.sendMessage({
			type: 'entity_add',
			id: id,
		});
	}
}

export { pushEnitiyToSidebar }
