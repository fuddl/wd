const picture = (vars) => {
	let tag = document.createElement('img');
	let srcset = [];
	for (let key in vars.srcSet) {
		srcset.push(`${ vars.srcSet[key] } ${ key }w`);
	}
	tag.setAttribute('srcset', srcset.join(','));
	tag.setAttribute('loading', 'lazy');

	tag.setAttribute('src', vars.srcSet[0])

	const link = document.createElement('a')
	link.setAttribute('href', vars.link)
	link.appendChild(tag)

	let wrapper = document.createElement('figure');
	wrapper.classList.add('picture');
	wrapper.appendChild(link);

	if (vars?.caption) {
		let caption = document.createElement('figcaption')
		caption.classList.add('picture__caption')
		caption.innerText = vars.caption
		wrapper.appendChild(caption)
	}

	let style = document.createElement('link');
	style.setAttribute('rel',	"stylesheet");
	style.setAttribute('href', "components/picture/picture.css");

	wrapper.appendChild(style);

	if (vars.tag) {
		let tagWrapper = document.createElement('div');
		tagWrapper.classList.add('picture__tag');
		tagWrapper.appendChild(vars.tag);
		wrapper.appendChild(tagWrapper);
	}
	
	return wrapper;
}

export { picture }
