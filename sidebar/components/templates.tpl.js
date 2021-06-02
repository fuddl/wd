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
	br: () => { return document.createElement('br') },
	code: (text) => {
		let tag = document.createElement('code');
		tag.innerText = text;
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
		
		return tag;
	},
	footer: (content) => {
		let wrapper = document.createElement('div');
		wrapper.classList.add('footer');
		wrapper.appendChild(content);
		
		return wrapper;
	}
};

export { templates }

