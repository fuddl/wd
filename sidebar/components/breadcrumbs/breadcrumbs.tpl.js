templates.breadcrumbs = (crumbs) => {
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
	return nav;
}