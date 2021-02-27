import { WikidataUrlResolver } from './modules/WikidataUrlResolver.js';

(async () => {
	let resolver = await new WikidataUrlResolver();
	let id = await resolver.getId(location);

	if (id) {
		browser.runtime.sendMessage({
			type: 'tab_resolved',
			id: id,
		});
	} else {
		browser.runtime.sendMessage({
			type: 'tab_unresolved',
			id: id,
		});
	}
})();