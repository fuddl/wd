import { templates } from '../templates.tpl.js';

function statusMessage(parts) {
	let output = document.createDocumentFragment();
	for (let part of parts) {
		if (typeof part === 'string') {
			output.appendChild(document.createTextNode(part))
		} else if (typeof part === 'object') {
			let templateName = Object.keys(part)[0];
			let parameters = Object.values(part)[0];
			if (templates.hasOwnProperty(templateName)) {
				output.appendChild(templates[templateName](parameters));
			}
		}
	}
	return output;
}

const bouncer = () => {
	let style = document.createElement('link');
	style.setAttribute('rel',	"stylesheet");
	style.setAttribute('href', "components/bouncer/bouncer.css");

	let bg = document.createElement('div');
	bg.classList.add('bouncer');

	let div = document.createElement('div');
	div.classList.add('bouncer__mover');
	bg.appendChild(div);
	let bounce = document.createElement('div');
	bounce.classList.add('bouncer__bounce');
	div.appendChild(bounce);
	div.appendChild(style);
	let status = document.createElement('div')
	status.classList.add('bouncer__status');
	div.appendChild(status);
	status.innerText = 'One moment please…';

	browser.runtime.onMessage.addListener((data, sender) => {
		if (data.type === 'status') {
			status.innerText = '';
			status.appendChild(statusMessage(data.message));
		}
	});
	window.addEventListener("message", (event) => {
		if (event.data.type === 'status') {
			status.innerText = '';
			status.appendChild(statusMessage(event.data.message));
		}
	}, false);

	return bg;
}

export { bouncer }
