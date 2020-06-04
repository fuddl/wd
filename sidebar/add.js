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

	let receivedEntities = [];

	browser.runtime.onMessage.addListener(async (data, sender) => {
		if (data.type === 'entity_add') {
			if (!receivedEntities.includes(data.id)) {
				receivedEntities.push(data.id);
				
				let tag = templates.tag({
					id: data.id,
				});

				content.appendChild(tag);
				tag.postProcess();
			}
		}
	});

	browser.runtime.sendMessage({
		type: 'collect_pagelinks',
	});




})();