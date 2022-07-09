const ruby = (fragments) => {
	const ruby = document.createElement('ruby');
	for (fragment of fragments) {
		if (fragment.w) {
			ruby.appendChild(document.createTextNode(fragment.w))
		}
		if (fragment.r) {
			const t = document.createElement('rt')
			t.innerText = fragment.r
			ruby.appendChild(t)
		}
	}

	return ruby;
}

export { ruby };