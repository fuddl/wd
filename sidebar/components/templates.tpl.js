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
	title: (text) => {
		let tag = document.createElement('em');
		tag.innerText = text;
		return tag;
	},
	picture: (vars) => {
		let tag = document.createElement('img');
		let srcset = [];
		for (key in vars.srcSet) {
			srcset.push(`${ vars.srcSet[key] } ${ key }w`)
		}
		tag.setAttribute('srcset', srcset.join(','))
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