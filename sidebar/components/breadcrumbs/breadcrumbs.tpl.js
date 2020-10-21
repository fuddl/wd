templates.breadcrumbs = (crumbs, childId = false) => {
	let style = document.createElement('link');
	style.setAttribute('rel',  "stylesheet");
	style.setAttribute('href', "components/breadcrumbs/breadcrumbs.css");

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
	nav.appendChild(style);
	if (childId) {
		nav.setAttribute('data-child-id', childId);
	}
	return nav;
}
templates.breadcrumbsPlaceholder = (childId) => {
	let crumbs = [];
	for (var i = 0; i <= 10; i++) {
		crumbs.push(templates.placeholder({}))
	}
	return templates.breadcrumbs(crumbs, childId);
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
			resolvePlaceholders();
		})();
	}, 0);
}