async function collectPageLinks() {
	let links = document.links;
	let processedLinks = [];
	for (let link of links) {
		if (!processedLinks.includes(link.href)) {
			let id = await findApplicables(link);
			processedLinks.push(link.href);
			if (id) {
				for (let matchingLink of getLinksByHref(link.href)) {
					matchingLink.style.outline = '1px solid red';
					matchingLink.appendChild(document.createTextNode(id))
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