let currentEntity = window.location.search.match(/^\?(\w\d+)/, '')[1];

browser.runtime.sendMessage({
	type: 'lock_sidebar',
});

let content = document.getElementById('content');
content.innerHTML = '';
(async () => {
	let entities = await wikidataGetEntity(currentEntity);
	let e = entities[currentEntity];

	let description = getValueByLang(e, 'descriptions', false);
	let hasDescription = description != false;

	content.appendChild(templates.ensign({
		revid: e.lastrevid,
		id: currentEntity,
		label: getValueByLang(e, 'labels', e.title),
		description: {
			text: description,
			provisional: !hasDescription
		},
	}));

	let direction = templates.direction({flippable: true});

	content.appendChild(direction);

	(async () => {
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
	})();

	//let randomProperty = allProperties[Math.floor(Math.random()*allProperties.length)];

	let propPicker = templates.express({
		//placeholder: randomProperty.propLabel.value + '…',
	});
	content.appendChild(propPicker.element);


	let receivedEntities = [];

	browser.runtime.onMessage.addListener(async (data, sender) => {
		if (data.type === 'entity_add') {
			if (!receivedEntities.includes(data.id)) {
				receivedEntities.push(data.id);
				
				let tag = templates.express__tag({
					id: data.id,
					dest: propPicker.selection,
					src: propPicker.options,
				});

				propPicker.options.appendChild(tag);
				tag.postProcess();
			}
		}
		if (data.type === 'use_in_statement') {
			let target = propPicker.element.querySelector(`[data-entity="${ data.wdEntityId }"]`);
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

	propPicker.element.addEventListener('change', function() {
		saveButton.removeAttribute('disabled');
	});

	saveButton.addEventListener('click', function() {
		if (!saveButton.hasAttribute('disabled')) {
			saveButton.setAttribute('disabled', 'disabled')
			let selecteds = propPicker.selection.querySelectorAll('[data-selected]');

			let flipped = direction.hasAttribute('data-flipped');

			let now = new Date();

			let jobs = [];	

			for (let selected of selecteds) {

				let selectedId = selected.getAttribute('data-entity');
				let selectedNummericId = parseInt(selectedId.replace(/\w/,''));
				let currentEntityNummericId = parseInt(currentEntity.replace(/\w/,''));

				jobs.push({
					type: 'set_claim',
					subject: !flipped ? currentEntity : selectedId,
					verb: propPicker.element.getAttribute('data-prop'),
					object: {
						'entity-type': "item",
						'numeric-id': !flipped ? selectedNummericId : currentEntityNummericId,
					},
				});

			}
			browser.runtime.sendMessage({
				type: 'send_to_wikidata',
				data: jobs,
			});
			browser.runtime.sendMessage({
				type: 'unlock_sidebar',
			});
			window.location = 'entity.html?' + selectedId;
		}
	});

})();