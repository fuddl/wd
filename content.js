async function findApplicables(location, openInSidebar = true) {
	let applicables = [];

	let foundMatch = false;
	for (id of Object.keys(resolvers)) {
		let isApplicable = await resolvers[id].applicable(location);
		if (isApplicable) {
			let entityId = await resolvers[id].getEntityId(location);

			if (entityId && !foundMatch) {
				foundMatch = true;
				browser.runtime.sendMessage({
					type: 'match_event',
					wdEntityId: entityId,
					openInSidebar: openInSidebar,
					url: location.href,
					cache: !resolvers[id].noCache,
				});
				return entityId;
			}
			applicables.push(isApplicable);
		}
	}
	if (applicables.length > 0 && !foundMatch && openInSidebar) {
		browser.runtime.sendMessage({
			type: 'match_proposal',
			proposals: {
				ids: applicables,
				titles: findTitles(),
				desc: findDescriptions(),
				source: {
					url: location.toString(),
					title: document.querySelector('title').innerText,
					lang: await makeLanguageValid(document.querySelector('html').lang),
				}
			},
		});
	}
	return false;
};

findApplicables(location);

browser.runtime.onMessage.addListener(async function(msg, sender, sendResponse) {
  if (msg.action == 'find_applicables') {
    findApplicables(location);
  } else if (msg.action === 'collect_pagelinks') {
  	return await collectPageLinks(msg.subject);
  } else if (msg.action === 'clear_pagelinks') {
  	clearPageLinks();
  }
});

window.onpopstate = function(event) {
  findApplicables(window.location);
};

window.addEventListener('hashchange', function() {
  findApplicables(window.location);
}, false);

let head = document.querySelector('head');

let title = head.querySelector('title').innerText;
let titleObserver = new MutationObserver(function() {
  let newTitle = head.querySelector('title').innerText;
	if (newTitle != title) {
		findApplicables(window.location);
		title = newTitle;
	}
});

titleObserver.observe(head, { characterData: true });
