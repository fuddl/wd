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
			return entityId;
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

browser.runtime.onMessage.addListener(async function(msg, sender, sendResponse) {
  if (msg.action == 'find_applicables') {
    findApplicables(location);
  } else if (msg.action === 'collect_pagelinks') {
  	return await collectPageLinks();
  }
});

window.onpopstate = function(event) {
  findApplicables(location);
};

window.addEventListener('hashchange', function() {
  findApplicables(location);
}, false);

let head = document.querySelector('head');

let title = head.querySelector('title').innerText;
let titleObserver = new MutationObserver(function() {
  let newTitle = head.querySelector('title').innerText;
	if (newTitle != title) {
		findApplicables(location);
		title = newTitle;
	}
});

titleObserver.observe(head, { characterData: true });
