import { requreStylesheet } from '../require-styleheet.js'

const title = (vars) => { 
	requreStylesheet("components/title/title.css")
	
	let tag = document.createElement('i')
	tag.innerText = vars.text
	tag.classList.add('title')
	if (vars.lang) {
		tag.setAttribute('lang', vars.lang)
	}
	return tag;

}

export { title };
