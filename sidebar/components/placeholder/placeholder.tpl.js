import { getLink } from '../../resolve-placeholders.js';
import { wikidataGetEntity } from '../../../wd-get-entity.js';
import { getValueByLang } from '../../get-value-by-lang.js';

const placeholder = (vars, cache) => {
	let tagName = vars?.tag ?? 'a';

	// don't create a placeholder if the label is already in cache
	if (vars.entity && cache && 'labels' in cache && cache.labels[vars.entity] && !vars.type) {
		let link = document.createElement(tagName);
		link.innerText = cache.labels[vars.entity];
		if ('descriptions' in cache && cache.descriptions[vars.entity]) {
			link.setAttribute('title', cache.descriptions[vars.entity]);
		}
		if (tagName === 'a') {
			link.setAttribute('href', getLink(vars.entity));
			link.addEventListener('click', (e) => {
				e.preventDefault();
				window.location = 'entity.html?' + vars.entity;
			});
			return link;
		}
	}

	let rand = (min, max) => {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min;
	}
	let tag = document.createElement('span');
	tag.classList.add('placeholder');
	if (vars.entity) {
		tag.setAttribute('data-entity', vars.entity);
	}
	if (vars.type) {
		tag.setAttribute('data-type', vars.type);
	}
	let words = [];
	if (vars.lazy) {
		tag.setAttribute('data-lazy', true);
	}
	for (var i = 0; i <= rand(1,2); i++) {
		words.push("█".repeat(rand(5,10)))
	}

	tag.innerText = words.join(' ');

	(async () => {
		let id = tag.getAttribute('data-entity');
		let type = tag.getAttribute('data-type');
		let link = document.createElement(type ? type : 'a');
		if (id !== null) {
			let entity = await wikidataGetEntity(id);
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
		}
		if (link.tagName === 'A') {
			link.addEventListener('click', (e) => {
				e.preventDefault();
				window.location = 'entity.html?' + id;
			});
		}
		let value = tag.getAttribute('value');
		if (value) {
			link.setAttribute('value', tag.getAttribute('value'));
		}
		if (tag.parentNode) {
			tag.parentNode.replaceChild(link, tag);
		}
	})();

	return tag;
}

export { placeholder }

