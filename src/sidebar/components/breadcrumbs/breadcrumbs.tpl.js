import { placeholder } from '../placeholder/placeholder.tpl.js'

const breadcrumbs = (crumbs, childId = false) => {
	let style = document.createElement('link')
	style.setAttribute('rel',	'stylesheet')
	style.setAttribute('href', 'components/breadcrumbs/breadcrumbs.css')

	let nav = document.createElement('nav')
	nav.classList.add('breadcrumbs')
	let first = true
	for (let crumb of crumbs) {
		if (!first) {
			nav.appendChild(document.createTextNode(' › '))
		} else {
			first = false
		}
		nav.appendChild(crumb)
	}
	nav.appendChild(style)
	if (childId) {
		nav.setAttribute('data-child-id', childId)
	}
	return nav
}

function breadcrumbsPlaceholder(childId) {
	let crumbs = []
	for (var i = 0; i <= 10; i++) {
		crumbs.push(placeholder({}))
	}
	return breadcrumbs(crumbs, childId)
}

export { breadcrumbs, breadcrumbsPlaceholder }
