(async () => {
	let applicables = [];

	let foundMatch = false;
	for (id of Object.keys(resolvers)) {
		let isApplicable = await resolvers[id].applicable(location);
		if (isApplicable) {
			let entityId = await resolvers[id].getEntityId();

			if (entityId && !foundMatch) {
				foundMatch = true;
				browser.runtime.sendMessage({
					type: 'match_event',
					wdEntityId: entityId,
				});
			}
			applicables.push(isApplicable);
		}
	}
	if (applicables.length > 0 && !foundMatch) {
		browser.runtime.sendMessage({
			type: 'match_proposal',
			proposals: {
				ids: applicables,
				titles: findTitles(),
				desc: findDescriptions(),
			}
		});
	}
})();