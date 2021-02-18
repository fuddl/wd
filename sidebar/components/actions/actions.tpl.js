templates.actions = (title, items) => {
	let wrapper = document.createElement('nav');
	wrapper.classList.add('actions');

	let headline = document.createElement('h2');
	headline.classList.add('actions__headline')
	headline.innerText = title;

	let list = document.createElement('ul');
	list.classList.add('actions__actions')

	for (let item of items) {
		let listItem = document.createElement('li');
		let link = document.createElement('a');
		
		let moji = document.createElement('img');
		moji.classList.add('actions__moji');
		moji.src = item.moji;
		link.appendChild(moji);

		let itemTitle = document.createElement('span');
		itemTitle.classList.add('actions__title');
		itemTitle.innerText = ' ' + item.title;
		link.appendChild(itemTitle);

		let desc = document.createElement('span');
		desc.classList.add('actions__desc');
		desc.innerText = ' ' + item.desc;
		link.appendChild(desc);

		link.setAttribute('href', item.link);
		listItem.appendChild(link);
		if (item.callback) {
			link.addEventListener('click', item.callback);
		}
		link.classList.add('actions__action');
		list.appendChild(listItem);
	}

	wrapper.appendChild(headline);
	wrapper.appendChild(list);

	return wrapper;
}
