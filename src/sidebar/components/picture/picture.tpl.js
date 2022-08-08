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

	let caption = document.createElement('figcaption')
	caption.classList.add('picture__caption')
	

	let attribution = document.createElement('div')
	attribution.classList.add('picture__attribution')

	if (vars?.licence) {
		attribution.appendChild(vars.licence)
		attribution.appendChild(document.createTextNode(' '))
	}

	if (vars?.creators) {
		attribution.appendChild(vars.creators)
	}

	if (attribution.childNodes.length > 0) {
		caption.appendChild(attribution)
	}
	if (caption.childNodes.length > 0) {
		wrapper.appendChild(caption)
	}

	if (vars?.caption) {
		caption.appendChild(document.createTextNode(vars.caption))
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
