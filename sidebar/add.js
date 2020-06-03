let currentEntity = window.location.search.match(/^\?(\w\d+)/, '')[1];

browser.runtime.sendMessage({
	type: 'lock_sidebar',
});

let content = document.getElementById('content');
content.innerHTML = '';
(async () => {
	let entities = await wikidataGetEntity(currentEntity);
	let allProperties = await getAllProperties();
	let propList = document.createElement('datalist');
	propList.setAttribute('id', 'all-properties');
	for (let prop of allProperties) {
		let propListItem = document.createElement('option');
		propListItem.innerText = prop.propertyLabel.value;
		propListItem.setAttribute('data-description', prop.propertyDescription ? prop.propertyDescription.value : '');
		propList.appendChild(propListItem);
	}
	content.appendChild(propList);

	let randomProperty = allProperties[Math.floor(Math.random()*allProperties.length)];

	content.appendChild(templates.proppick({
		placeholder: randomProperty.propertyLabel.value + '…',
		focus: true,
	}));


	browser.runtime.onMessage.addListener(async (data, sender) => {
		if (data.type === 'entity_add') {
			let tag = document.createElement('code');
			tag.innerText = data.id;
			content.appendChild(tag);
			let e = await wikidataGetEntity(data.id);
			tag.innerText = getValueByLang(e[data.id], 'labels', data.id);
		}
	});

	browser.runtime.sendMessage({
		type: 'collect_pagelinks',
	});




})();