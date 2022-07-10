const ruby = (fragments, lang = '') => {
	const ruby = document.createElement('ruby');
	if (lang) {
		ruby.setAttribute('lang', lang)
	}
	for (const fragment of fragments) {
		if (fragment.w) {
			ruby.appendChild(document.createTextNode(fragment.w))
		}
		if (fragment.r) {
			const start = document.createElement('rp')
			start.innerText = '('
			const end = document.createElement('rp')
			end.innerText = ')'
			const t = document.createElement('rt')
			t.innerText = fragment.r
			ruby.appendChild(start)
			ruby.appendChild(t)
			ruby.appendChild(end)
		}
	}

	return ruby;
}

export { ruby };