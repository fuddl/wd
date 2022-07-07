import { wikidataGetEntity } from '../wd-get-entity.js';
import { getParents, Breadcrumbs } from './get-parents.js';
import { templates } from './components/templates.tpl.js';
import { getFormatterUrls } from './get-formatter-urls.js';
import { sparqlQuery } from '../sqarql-query.js';
import { breadcrumbs } from './components/breadcrumbs/breadcrumbs.tpl.js';
import { getValueByLang } from './get-value-by-lang.js';

function getLink(entityId) {
	let ns = entityId.charAt(0);
	let prefixes = {
		Q: 'https://www.wikidata.org/wiki/',
		P: 'https://www.wikidata.org/wiki/Property:',
		L: 'https://www.wikidata.org/wiki/Lexeme:',
	}
	return prefixes[ns] + entityId.replace(/-(\w\d+)$/, '#$1');
}

function resolvePlaceholders(scope) {

}

function resolveBreadcrumbs(cache) {
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
				}, cache));
			}
			placeholder.parentNode.replaceChild(breadcrumbs(trail), placeholder);
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
			target.appendChild(templates.idLink(item, id));
		}
		placeholder.parentNode.replaceChild(target, placeholder);
	}, 0);
}

export { getLink, resolvePlaceholders, resolveIdLinksPlaceholder, resolveBreadcrumbs }
