const templates = {
	br: () => { return `<br />` },
	code: (text) => { return `<code>${ text }</code>` },
	link: (vars) => { return `<a href="${ vars.href ?? '' }" title="${ vars.title ?? '' }">${ vars.text }</a>` },
	small: (text) => { return `<small>${ text }</small>` },
	title: (text) => { return `<em>${ text }</em>` },
};