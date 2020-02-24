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
};