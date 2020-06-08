async function collectPageLinks() {
	let uniqueLinks = {};
	let foundEntities = [];
	for (let link of document.links) {
		if (!uniqueLinks[link.href]) {
			uniqueLinks[link.href] = link;
		}
	}
	for (let url in uniqueLinks) {
		let id = await findApplicables(uniqueLinks[url], false);

		if (id && !foundEntities.includes(id)) {
			foundEntities.push(id);
			for (let matchingLink of getLinksByHref(uniqueLinks[url].href)) {
				if (matchingLink) {
					let wbAppend = document.createDocumentFragment();;
					wbAppend.appendChild(document.createTextNode(' '));
					
					let wpLink = null;
					if (matchingLink.nextElementSibling && matchingLink.nextElementSibling.classList.contains('entity-selector')) {
						wpLink = matchingLink.nextElementSibling;
						if (wpLink.classList.contains('entity-selector--selected')) {
							browser.runtime.sendMessage({
								type: 'entity_add',
								id: id,
							});
							browser.runtime.sendMessage({
								type: 'use_in_statement',
								wdEntityId: id,
							});
						}
					} else {
						wpLink = document.createElement('a');
					}

					wpLink.classList.add('entity-selector');
					wpLink.innerText = id;
					wbAppend.appendChild(wpLink);
					matchingLink.parentNode.insertBefore(wbAppend, matchingLink.nextSibling);
					wpLink.addEventListener('click', (e) => {
						e.preventDefault();
						wpLink.classList.toggle('entity-selector--selected');
						browser.runtime.sendMessage({
							type: 'use_in_statement',
							wdEntityId: id,
						});
					});
				}
			}
		}
	}
}

function getLinksByHref(href) {
	let output = [];
	for (let link of document.links) {
		if (link.href === href) {
			output.push(link);
		}
	}
	return output;
}