async function collectPageLinks() {
	let uniqueLinks = {};
	let foundEntities = [];
	for (let link of document.links) {
		if (!uniqueLinks[link.href]) {
			uniqueLinks[link.href] = link;
		}
	}
	for (let url in uniqueLinks) {
		let id = await findApplicables(uniqueLinks[url]);

		if (id && !foundEntities.includes(id)) {
			foundEntities.push(id);
			for (let matchingLink of getLinksByHref(uniqueLinks[url].href)) {
				if (matchingLink) {
					let wbAppend = document.createDocumentFragment();
					wbAppend.appendChild(document.createTextNode(' '));
					let wpLink = document.createElement('a');
					wpLink.innerText = '(' + id + ')';
					wbAppend.appendChild(wpLink);
					matchingLink.parentNode.insertBefore(wbAppend, matchingLink.nextSibling);
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