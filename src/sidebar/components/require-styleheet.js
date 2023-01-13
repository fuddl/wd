const requreStylesheet = (path) => {
	let exists = false
	for (const sheet of document.styleSheets) {
		if (sheet.href.endsWith(path)) {
			exists = true
		}
	}
	if (!exists) {
		let link = document.createElement('link')
		link.setAttribute('rel', "stylesheet")
		link.setAttribute('href', path)
		document.head.appendChild(link)
	}
}

export { requreStylesheet }