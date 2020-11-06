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
	let uniqueLinks = [];
	let foundEntities = [];
	for (let link of document.links) {

		if (link.href.startsWith('javascript:')) {
			continue;
		}

		if (!uniqueLinks.some((e) => { return e.location === link.href })) {
			uniqueLinks.push({
				location: link.href,
				links: [link],
			});
		} else {
			uniqueLinks
				.find(e => e.location === link.href)
				.links.push(link)
		}
	}

	// sort linksets on whether if they are visible or not
	// visible links should go first
	uniqueLinks.sort((a, b) => {
	  let aVisible = false;
	  let bVisible = false;
		for (let link of a.links) {
	    const aRect = link.getBoundingClientRect();
	    if (aRect.top >= 0 && aRect.bottom <= window.innerHeight) {
	    	aVisible = true;
	    }
	  }
	  for (let link of b.links) {
	    const bRect = link.getBoundingClientRect();
	    if (bRect.top >= 0 && bRect.bottom <= window.innerHeight) {
	    	bVisible = true;
	    }
	  }
    if (aVisible && !bVisible) {
    	return -1;
    }
    if (!aVisible && bVisible) {
    	return 1;
    }
   	return 0;
	});

	// mark  links that are not applicable to wikidata as not-applicable
	for (let key in uniqueLinks) {
		let applicableTo = null;
		for (id of Object.keys(resolvers)) {
			let resolverApplicable = await resolvers[id].applicable(uniqueLinks[key].links[0]);
			if (resolverApplicable) {
				applicableTo = id;
			}
		}
		uniqueLinks[key].applicable = applicableTo;
		uniqueLinks[key].setup = async function() {
			this.selectors = [];
			for (let link of this.links) {
				let selector = document.createElement('a');
				selector.classList.add('entity-selector');
				selector.innerText = '…';
				link.parentNode.insertBefore(selector, link.nextSibling);
				this.selectors.push(selector);
			}
		}
		uniqueLinks[key].init = async function() {
			this.resolver = resolvers[this.applicable];
			this.selected = false;
			this.entityId = await this.resolver.getEntityId(this.links[0]);
	 		if (this.entityId) {
				browser.runtime.sendMessage({
					type: 'match_event',
					wdEntityId: this.entityId,
					openInSidebar: false,
					url: this.links[0].href,
					cache: !this.resolver.noCache,
				});

				for (let selector of this.selectors) {
					selector.setAttribute('href', 'https://www.wikidata.org/wiki/' + this.entityId);
					selector.innerText = this.entityId;
					selector.classList.add('entity-selector--selectable');
					selector.addEventListener('click', (e) => {
						e.preventDefault();
						this.selected = !this.selected;
						for (let otherSelector of this.selectors) {
							otherSelector.classList.toggle('entity-selector--selected', this.selected);
						}
						
						let sectionData = getClosestID(e.target);

						let hash = sectionData.hash ? '#' + sectionData.hash : ''; 

						let oldId = getOldid();

						let search = oldId ? '?oldid=' + oldId : location.search;

						let pageTitle = document.querySelector('title');
						let pageLanguage = document.querySelector('html').lang;

						let message = {
							type: 'use_in_statement',
							wdEntityId: this.entityId,
							reference: {
								url: location.protocol + '//' + location.host + location.pathname + search + hash,
								section: sectionData.section ? sectionData.section.trim().replace("\n", '␤') : null,
								title: pageTitle ? pageTitle.innerText.trim() : null,
								language: pageLanguage ? pageLanguage : 'zxx',
							}
						};

						browser.runtime.sendMessage(message);
					});
				}
			// if there is no qid clean up the selectors
	 		} else {
	 			for (let selector of this.selectors) {
	 				selector.remove();
	 			}
	 		}
		}
	}

	(async () => {
		for (let key in uniqueLinks) {
			if (uniqueLinks[key].applicable) {
				await uniqueLinks[key].setup();
			}
		}
		for (let key in uniqueLinks) {
			if (uniqueLinks[key].applicable) {
				await uniqueLinks[key].init();
			}
		}
	})();
}