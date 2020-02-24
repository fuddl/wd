browser.runtime.sendMessage({
	"match": false,
	"href": location.href,
});

(async () => {
	for (id of Object.keys(resolvers)) {
		let doesMatch = await resolvers[id].urlMatrch(location);
		if (doesMatch) {
			let entityId = await resolvers[id].getEntityId();
			browser.runtime.sendMessage({
				type: 'match_event',
				wdEntityId: entityId,
			});
			break;
		}
	}
})();