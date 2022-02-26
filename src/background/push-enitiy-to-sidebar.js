import browser from 'webextension-polyfill'
import {getInternalUrlForEntity} from '../core/navigation'
import {setSidebarUrl} from './navigation'

async function pushEnitiyToSidebar(id, tid, setPanel = true, nocache = false) {
	if (!sidebarLocked && setPanel) {
		await setSidebarUrl(tid, getInternalUrlForEntity(id, nocache))
	} else {
		console.log('pushing entity_add to', tid)
		await browser.tabs.sendMessage(tid, {
			type: 'entity_add',
			id: id,
		})
		await browser.runtime.sendMessage({
			type: 'entity_add',
			id: id,
		})
	}
}

export { pushEnitiyToSidebar }
