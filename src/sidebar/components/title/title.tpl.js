const title = (vars) => { 
	let style = document.createElement('link')
	style.setAttribute('rel',	'stylesheet')
	style.setAttribute('href', 'components/title/title.css')
	
	let tag = document.createElement('i')
	tag.innerText = vars.text
	tag.classList.add('title')
	if (vars.lang) {
		tag.setAttribute('lang', vars.lang)
	}	
	tag.appendChild(style)
	return tag

}

export { title }
