function getClosestID(element) {
    let subject = element;
    let referenceHeadlineQuery = 'h1[id],h1 [id],h2[id],h2 [id],h3[id],h3 [id],h4[id],h4 [id],h5[id],h5 [id],h6[id],h6 [id]';
    let headlineQuery = 'h1, h2, h3, h4, h5, h6';

    while (element.parentElement != null && !element.parentElement.querySelector(referenceHeadlineQuery)) {
        element = element.parentNode;
    }
    while (element.previousElementSibling && !element.matches('h1, h2, h3, h4, h5, h6')) {
        element = element.previousElementSibling;
    }

    if (element.matches(headlineQuery) && (element.getAttribute('id') || element.querySelector('[id]'))) {
    	let thisId = element.getAttribute('id');
    	if (thisId === null) {
			thisId = element.querySelector('[id]').getAttribute('id');
    	}

    	// removing the edit section link from mediawiki articles
    	let editSectionLink = element.querySelector('a[href*="action=edit"][href*="&section="]');
    	if (editSectionLink) {
    		editSectionLink.remove();
    	}

        return {
          section: element.innerText,
          hash: thisId,
        };    	
    }

    let IDwrapper = subject.closest('[id]');
    if (IDwrapper) {
        return {
          section: null,
          hash: IDwrapper.getAttribute('id'),
        }; 	
    }

    return {
    	section: null,
    	hash: null
    };
}

function getOldid() {
	for (let script of document.querySelectorAll('script')) {
		if(script.innerText.match(/wgCurRevisionId"\s*:\s*(\d+)/)) {
			return script.innerText.match(/wgCurRevisionId"\s*:\s*(\d+)/)[1];
		}
	}
	return null;
}

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

					wpLink.setAttribute('href', 'https://www.wikidata.org/wiki/' + id);
					wpLink.classList.add('entity-selector');
					wpLink.classList.add('entity-selector--selectable');
					
					wpLink.innerText = id;
					wbAppend.appendChild(wpLink);
					matchingLink.parentNode.insertBefore(wbAppend, matchingLink.nextSibling);
					wpLink.addEventListener('click', (e) => {
						e.preventDefault();
						wpLink.classList.toggle('entity-selector--selected');
						
						let sectionData = getClosestID(wpLink);

						let hash = sectionData.hash ? '#' + sectionData.hash : ''; 

						let oldId = getOldid();

						let search = oldId ? '?oldid=' + oldId : location.search;

						let pageTitle = document.querySelector('title');
						let pageLanguage = document.querySelector('html').lang;

						let message = {
							type: 'use_in_statement',
							wdEntityId: id,
							reference: {
								url: location.protocol + '//' + location.host + location.pathname + search + hash,
								section: sectionData.section ? sectionData.section.trim() : null,
								title: pageTitle ? pageTitle.innerText.trim() : null,
								language: pageLanguage ? pageLanguage : 'zxx',
							}
						};

						browser.runtime.sendMessage(message);
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