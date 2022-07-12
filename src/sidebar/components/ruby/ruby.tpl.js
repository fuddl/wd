const ruby = (fragments, lang = '') => {
	const wrapper = document.createElement('span')
	if (lang) {
		wrapper.setAttribute('lang', lang)
	}
	for (const fragment of fragments) {
		if (fragment.w && fragment.r) {
			const ruby = document.createElement('ruby')
			
			ruby.appendChild(document.createTextNode(fragment.w))

			const start = document.createElement('rp')
			start.innerText = '('
			const end = document.createElement('rp')
			end.innerText = ')'
			const t = document.createElement('rt')
			t.innerText = fragment.r
			ruby.appendChild(start)
			ruby.appendChild(t)
			ruby.appendChild(end)
			wrapper.appendChild(ruby)
		} else if (fragment.w) {
			wrapper.appendChild(document.createTextNode(fragment.w))
		}
	}

	return wrapper;
}

export { ruby };