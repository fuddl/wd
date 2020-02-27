const templates = {
	br: () => { return document.createElement('br') },
	code: (text) => {
		let tag = document.createElement('code');
		tag.innerText = text;
		return tag;
	},
	link: (vars) => {
		let tag = document.createElement('a');
		tag.setAttribute('href', vars.href)
		tag.setAttribute('title', vars.title)
		tag.innerText = vars.text;
		return tag;
	},
	urlLink: (url) => {
		let readable = url.replace(/^[a-z]+\:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
		let tag = document.createElement('a');
		tag.setAttribute('href', url)
		tag.classList.add('url')
		tag.innerText = readable;
		return tag;
	},
	time: (vars) => {
		let tag = document.createElement('time');
		tag.innerText = vars.text;
		return tag;
	},
	small: (text) => {
		let tag = document.createElement('small');
		tag.innerText = text;
		return tag;
	},
	title: (vars) => {
		let tag = document.createElement('em');
		tag.innerText = vars.text;
		if (vars.lang) {
			tag.setAttribute('lang', vars.lang);
		}
		return tag;
	},
	picture: (vars) => {
		let tag = document.createElement('img');
		let srcset = [];
		for (key in vars.srcSet) {
			srcset.push(`${ vars.srcSet[key] } ${ key }w`);
		}
		tag.setAttribute('srcset', srcset.join(','));
		tag.setAttribute('loading', 'lazy');

		tag.setAttribute('src', vars.srcSet[0]);

		return tag;
	},
	placeholder: (vars) => {
		let rand = (min, max) => {
		  min = Math.ceil(min);
		  max = Math.floor(max);
		  return Math.floor(Math.random() * (max - min)) + min;
		}
		let tag = document.createElement('span');
		tag.classList.add('placeholder')
		tag.setAttribute('data-entity', vars.entity);
		let words = [];
		for (var i = 0; i <= rand(1,2); i++) {
			words.push("█".repeat(rand(5,10)))
		}

		tag.innerText = words.join(' ');
		return tag;
	}
};