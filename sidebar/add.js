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
		propListItem.innerText = prop.propLabel.value;
		propListItem.setAttribute('data-description', prop.propDescription ? prop.propDescription.value : '');
		propListItem.setAttribute('data-prop', prop.pid ? prop.pid.value : '');
		propList.appendChild(propListItem);
	}
	content.appendChild(propList);

	let randomProperty = allProperties[Math.floor(Math.random()*allProperties.length)];

	let propPicker = templates.proppick({
		placeholder: randomProperty.propLabel.value + '…',
		focus: true,
	});
	content.appendChild(propPicker);

	let tagSecetor = document.createElement('div');
	content.appendChild(tagSecetor);

	let receivedEntities = [];

	browser.runtime.onMessage.addListener(async (data, sender) => {
		if (data.type === 'entity_add') {
			if (!receivedEntities.includes(data.id)) {
				receivedEntities.push(data.id);
				
				let tag = templates.tag({
					id: data.id,
				});

				tagSecetor.appendChild(tag);
				tag.postProcess();
			}
		}
		if (data.type === 'use_in_statement') {
			let target = tagSecetor.querySelector(`[data-entity="${ data.wdEntityId }"]`);
			target.toggle();
		}
	});

	browser.runtime.sendMessage({
		type: 'collect_pagelinks',
	});

	let saveButton = document.createElement('button');
	saveButton.setAttribute('disabled', 'disabled');
	saveButton.innerText = '💾';

	document.body.appendChild(templates.footer(saveButton));

	propPicker.addEventListener('change', function() {
		saveButton.removeAttribute('disabled');
	});

	saveButton.addEventListener('click', function() {
		if (!saveButton.hasAttribute('disabled')) {
			let selecteds = tagSecetor.querySelectorAll('[data-selected]');

			let now = new Date();

			let jobs = [];	

			for (let selected of selecteds) {

				let numericId = parseInt(selected.getAttribute('data-entity').replace(/\w/,''));

				jobs.push({
					type: 'set_claim',
					subject: currentEntity,
					verb: propPicker.getAttribute('data-prop'),
					object: {
						'entity-type': "item",
						'numeric-id': numericId,
					},
				});

			}
			browser.runtime.sendMessage({
				type: 'send_to_wikidata',
				data: jobs,
			});		
		}
	});

})();