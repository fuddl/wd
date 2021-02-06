function getLink(entityId) {
	let ns = entityId.charAt(0);
	let prefixes = {
		Q: 'https://www.wikidata.org/wiki/',
		P: 'https://www.wikidata.org/wiki/Property:',
		L: 'https://www.wikidata.org/wiki/Lexeme:',
	}
	return prefixes[ns] + entityId;
}

function resolvePlaceholders(scope) {
	scope = scope ? scope : document;
	let placeholders = scope.querySelectorAll('.placeholder[data-entity]');

	Array.from(placeholders).reduce((k, placeholder) => {
		(async () => {
			let id = placeholder.getAttribute('data-entity');
			let entity = await wikidataGetEntity(id);
			let type = placeholder.getAttribute('data-type');
			let link = document.createElement(type ? type : 'a');
			link.setAttribute('href', getLink(id));
			if (entity[id].labels || entity[id].descriptions) {
				link.setAttribute('title', getValueByLang(entity[id], 'descriptions'));
				link.innerText = getValueByLang(entity[id], 'labels', id);
			} else if (entity[id].lemmas) {
				let labels = [];
				for (let lang in entity[id].lemmas) {
					labels.push(entity[id].lemmas[lang].value)
				}
				link.innerText = labels.join(' ‧ ');
			} else if (entity[id].representations){
				let labels = [];
				for (let lang in entity[id].representations) {
					labels.push(entity[id].representations[lang].value)
				}
				link.innerText = labels.join(' ‧ ');
			} else if (entity[id].glosses) {
				let baseEntityId = id.replace(/-.+/, '');
				let baseEntity = await wikidataGetEntity(baseEntityId);
				let labels = [];
				for (let lang in baseEntity[baseEntityId].lemmas) {
					labels.push(baseEntity[baseEntityId].lemmas[lang].value)
				}
				link.innerText = labels.join(' ‧ ');
				let gloss = document.createElement('small');
				gloss.innerText = getValueByLang(entity[id], 'glosses', id);
				gloss.style.display = 'block';
				link.style.display = 'inline-block';
				link.appendChild(gloss);

			}
			link.addEventListener('click', (e) => {
				e.preventDefault();
				window.location = 'entity.html?' + id;
			});
			if (placeholder.parentNode) {
				placeholder.parentNode.replaceChild(link, placeholder);
			}
		})();
	}, 0);
}

function resolveBreadcrumbs() {
	let placeholders = document.querySelectorAll('.breadcrumbs[data-child-id]');

	Array.from(placeholders).reduce((k, placeholder) => {
		(async () => {
			let vid = placeholder.getAttribute('data-child-id');
			let parents = await getParents(vid);
			let crumbs = new Breadcrumbs(vid, parents);
			let crumbItems = [];
			if (Symbol.iterator in crumbs) {
				for (let crumb of crumbs) {
					if (crumb != vid) {
						crumbItems.push(crumb);
					}
				}
			}
			crumbItems.reverse();
			let trail = [];
			for (let crumb of crumbItems) {
				trail.push(templates.placeholder({
					entity: crumb,
				}));
			}
			placeholder.parentNode.replaceChild(templates.breadcrumbs(trail), placeholder);
			resolvePlaceholders(placeholder.parentNode);
		})();
	}, 0);
}

function resolveIdLinksPlaceholder() {
	let placeholders = document.querySelectorAll('.id-links-placeholder');
	Array.from(placeholders).reduce( async (k, placeholder) => {
		let prop = placeholder.getAttribute('data-prop');
		let urls = await getFormatterUrls(prop);
		let id = placeholder.getAttribute('data-id');
		let formatted = [];
		for (let template of urls) {
			if (template.exp) {
				let regex = new RegExp(template.exp.value);
				let match = id.match(regex);
				if (match !== null) {
					if (match.length > 1) {
						formatted.push(id.replace(regex, template.form.value));
					} else {
						formatted.push(template.form.value.replace('$1', id));
					}
				}
			} else {
				formatted.push(template.form.value.replace('$1', id));
			}
		}
		let target = new DocumentFragment;
		for (let item of formatted) {
			target.appendChild(templates.idLink(item));
		}
		placeholder.parentNode.replaceChild(target, placeholder);
		resolvePlaceholders(placeholder.parentNode);
	}, 0);
}
