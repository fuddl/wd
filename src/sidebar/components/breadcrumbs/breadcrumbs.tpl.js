import { placeholder } from '../placeholder/placeholder.tpl.js';
import { requreStylesheet } from '../require-styleheet.js'

const breadcrumbs = (crumbs, childId = false) => {
	requreStylesheet("components/breadcrumbs/breadcrumbs.css")

	let nav = document.createElement('nav');
	nav.classList.add('breadcrumbs');
	let first = true;
	for (let crumb of crumbs) {
		if (!first) {
			nav.appendChild(document.createTextNode(' › '));
		} else {
			first = false;
		}
		nav.appendChild(crumb);
	}

	if (childId) {
		nav.setAttribute('data-child-id', childId);
	}
	return nav;
}

function breadcrumbsPlaceholder(childId) {
	let crumbs = [];
	for (var i = 0; i <= 10; i++) {
		crumbs.push(placeholder({}))
	}
	return breadcrumbs(crumbs, childId);
}

export { breadcrumbs, breadcrumbsPlaceholder }
