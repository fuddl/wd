import { sparqlQuery } from '../../sqarql-query.js';

import { placeholder } from './placeholder/placeholder.tpl.js';
import { annote } from './annote/annote.tpl.js';
import { direction } from './direction/direction.tpl.js';
import { ensign } from './ensign/ensign.tpl.js';
import { express, express__tag } from './express/express.tpl.js';
import { breadcrumbs, breadcrumbsPlaceholder } from './breadcrumbs/breadcrumbs.tpl.js';
import { mercator } from './mercator/mercator.tpl.js';
import { remark } from './remark/remark.tpl.js';
import { proof } from './proof/proof.tpl.js';
import { flex } from './flex/flex.tpl.js';
import { actions } from './actions/actions.tpl.js';
import { title } from './title/title.tpl.js';
import { join } from './join/join.tpl.js';

const templates = {
	actions: actions,
	annote: annote,
	breadcrumbs: breadcrumbs,
	breadcrumbsPlaceholder: breadcrumbsPlaceholder,
	ensign: ensign,
	express: express, 
	express__tag: express__tag,
	flex: flex,
	mercator: mercator,
	placeholder: placeholder,
	proof: proof,
	remark: remark,
	direction: direction,
	title: title,
	join: join,
	br: () => { return document.createElement('br') },
	code: (text) => {
		let tag = document.createElement('code');
		tag.innerText = text;
		return tag;
	},
	link: (url, title, lang) => {
		let tag = document.createElement('a');
		tag.setAttribute('href', url);
		tag.innerText = title;
		return tag;
	},
	urlLink: (url, id) => {
		let readable = url
			.replace(/^[a-z]+\:\/\//, '')
			.replace(/^www\./, '')
			.replace(/\/index\.(php|html?)$/, '')
			.replace(/web\.archive.org\/web\/.\//, '')
			.replace(/wikidata-externalid-url\./, '')
			.replace(/\/$/, '');
		let tag = document.createElement('a');
		tag.setAttribute('href', url)
		tag.classList.add('url')
		if (readable.includes(id)) {
			let parts = readable.split(id);
			let readableMarked = new DocumentFragment();
			readableMarked.appendChild(document.createTextNode(parts[0]));
			let markedId = document.createElement('strong');
			markedId.style.textDecoration = 'underline';
			markedId.style.fontWeight = 'inherit';
			markedId.innerText = id;
			readableMarked.appendChild(markedId);
			if (parts[1]) {
				readableMarked.appendChild(document.createTextNode(parts[1]));
			}
			tag.appendChild(readableMarked);
		} else {
			tag.innerText = readable;
		}
		return tag;
	},
	idLink: (url, id) => {
		let wrapper = document.createElement('div');
		wrapper.style.fontSize = '.75em';
		wrapper.style.margin = '1em 0';
		wrapper.style.lineHeight = 1;
		let prefix = document.createTextNode('↳\u00a0');
		wrapper.appendChild(prefix);
		if (url) {
			wrapper.appendChild(templates.urlLink(url, id));
		}
		else {
			wrapper.appendChild(templates.placeholder({}));
		}
		return wrapper;
	},
	blockquote: (text, lang) => {
		let tag = document.createElement('blockquote');
		tag.setAttribute('lang', lang);
		tag.innerText = text;
		return tag;
	},
	idLinksPlaceholder: (prop, id) => {
		let o = document.createElement('div');
		o.classList.add('id-links-placeholder')
		o.setAttribute('data-prop', prop);
		o.setAttribute('data-id', id);
		for (var i = 0; i <= 4; i++) {
			o.appendChild(templates.idLink(false))
		}
		return o;
	},
	time: (vars) => {
		let tag = document.createElement('time');
		tag.appendChild(vars.text);
		return tag;
	},
	small: (text) => {
		let tag = document.createElement('small');
		tag.innerText = text;
		return tag;
	},
	smallBlock: (text) => {
		let tag = document.createElement('div');
		tag.style.lineHeight = .5;
		let small = document.createElement('small');
		if (typeof text === 'string') {
			small.innerText = text;
		} else {
			small.appendChild(text);
		}
		tag.appendChild(small);
		return tag;
	},
	picture: (vars) => {
		let tag = document.createElement('img');
		let srcset = [];
		for (let key in vars.srcSet) {
			srcset.push(`${ vars.srcSet[key] } ${ key }w`);
		}
		tag.setAttribute('srcset', srcset.join(','));
		tag.setAttribute('loading', 'lazy');

		tag.setAttribute('src', vars.srcSet[0]);

		return tag;
	},
	image: (vars) => {
		let tag = document.createElement('img');
		tag.setAttribute('loading', 'lazy');

		tag.setAttribute('src', vars.src);

		return tag;
	},
	audio: (vars) => {
		let tag = document.createElement('audio');
		tag.setAttribute('controls', 'controls');
		tag.setAttribute('preload', 'none');

		tag.setAttribute('src', vars.src);
		
		return tag;
	},
	video: (vars) => {
		let tag = document.createElement('video');
		tag.setAttribute('controls', 'controls');

		tag.setAttribute('controlslist', 'nofullscreen');
		tag.setAttribute('preload', 'none');
		tag.setAttribute('poster', vars.poster);
		tag.setAttribute('src', vars.src);
		
		return tag;
	},
	footnoteRef: (vars) => {
		let tag = document.createElement('a');

		tag.classList.add('footnote');
		tag.setAttribute('href', vars.link);
		//tag.setAttribute('title', vars.title);
		tag.innerText = '*';

		return tag;
	},
	proxy: (vars) => {
		let tag = document.createElement('span');
		tag.setAttribute('data-query', vars.query);
		tag.classList.add('proxy');
		if (vars.text) {
			tag.innerText = vars.text;
		}
	
		(async () => {
			let result = await sparqlQuery(tag.getAttribute('data-query'));
			if (result[0] && result[0].hasOwnProperty('innerText')) {
				tag.innerText = result[0].innerText.value;
				tag.classList.remove('proxy')
			}
		})();

		return tag;
	},
	footer: (content) => {
		let wrapper = document.createElement('div');
		wrapper.classList.add('footer');
		wrapper.appendChild(content);
		
		return wrapper;
	},
	text: (children) => {
		let node = document.createDocumentFragment();
		for (let child of children) {
			node.appendChild(child);
		}
		return node;
	},
	unitNumber: ({number, unit}) => {
		const lang = navigator.language.substr(0,2);
		let o = document.createDocumentFragment();
		o.appendChild(document.createTextNode(parseFloat(number)));
		if (unit) {
			let space = document.createTextNode(' ');
			o.appendChild(space);

			o.appendChild(templates.proxy({
				query: `
					SELECT ?innerText WHERE {
						<${ unit }> wdt:P5061 ?innerText.
						FILTER(LANG(?innerText) = "${ lang }").
					}`
			}));
		}
		return o;
	}
};

export { templates }

