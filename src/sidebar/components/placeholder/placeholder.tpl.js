import { getLink } from '../../resolve-placeholders.js';
import { wikidataGetEntity } from '../../../wd-get-entity.js';
import { getValueByLang } from '../../get-value-by-lang.js';
import { fit } from 'furigana'
import { ruby } from '../ruby/ruby.tpl.js'

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
				if (vars.desiredInner != 'descriptions') {
					link.setAttribute('title', getValueByLang(entity[id], 'descriptions'));
				}
				link.innerText = getValueByLang(entity[id], vars.desiredInner ?? 'labels', id);
			} else if (entity[id].lemmas) {
				if ('ja' in entity[id].lemmas && 'ja-hira' in entity[id].lemmas) {
					const fitted = fit(entity[id].lemmas.ja.value, entity[id].lemmas['ja-hira'].value, {type: 'object'});
					link.appendChild(ruby(fitted));
				} else {
					let labels = [];
					for (let lang in entity[id].lemmas) {
						labels.push(entity[id].lemmas[lang].value)
					}
					link.innerText = labels.join(' ‧ ');
				}
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

				if (vars?.displayGloss ?? true) {
					let gloss = document.createElement('small');
					gloss.innerText = getValueByLang(entity[id], 'glosses', id);
					gloss.style.display = 'block';
					link.style.display = 'inline-block';
					link.appendChild(gloss);
				} 
			}
		} else if (vars.json) {
			try {
				const response = await fetch(vars.json);

				if (response.status !== 200) {
					throw 'Status Code: ' + response.status;
				}

				let json = await response.json();

				link.innerText = vars.extractor(json);
			} catch(error) {
				throw ['Fetch Error :-S', error];
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

