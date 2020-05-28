async function findApplicables(location) {
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
				source: {
					url: location.toString(),
					title: document.querySelector('title').innerText,
					lang: document.querySelector('html').lang,
				}
			},
		});
	}
};

findApplicables(location);

browser.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.action == 'find_applicables') {
    findApplicables(location);
  }
});

window.onpopstate = function(event) {
  findApplicables(location);
};

window.addEventListener('hashchange', function() {
  findApplicables(location);
}, false);
