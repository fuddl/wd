let proposals = JSON.parse(decodeURIComponent(window.location.search.replace(/^\?/, '')));
let content = document.getElementById('content');

async function setClaim(subjectId, property, value) {
	let token = await getTokens();
	let subject = await wikidataGetEntity(subjectId);

	let data = new FormData();
	data.append('action', 'wbcreateclaim');
	data.append('entity', subject[subjectId].id);
	data.append('snaktype', 'value');
	data.append('property', property);
	data.append('value', '"' + value + '"');
	data.append('summary', 'connected with Wikidata for Firefox');
	data.append('token', token);
	data.append('baserevid', subject[subjectId].lastrevid);
	data.append('bot', '1');
	data.append('format', "json");

	let response = await fetch('https://www.wikidata.org/w/api.php', {
		method: 'post',
		body: new URLSearchParams(data),
	});

  return JSON.parse(await response.text());
}

let preview = templates.remark({
	prop: templates.placeholder({
		entity: proposals.ids[0][0].prop,
	}),
	vals: [templates.code(proposals.ids[0][0].value)],
});

let labelField = templates.join({
  human: proposals.titles[0],
});

content.appendChild(preview);
resolvePlaceholders();

let direction = document.createElement('div');
direction.innerText = '⬇';
direction.style.fontSize = '50vw';
direction.style.textAlign = 'center';
direction.style.color = '#c8ccd1';

content.appendChild(direction);

content.appendChild(labelField);

let saveButton = document.createElement('button');
let form = document.createElement('div');
saveButton.setAttribute('disabled', 'disabled');
saveButton.innerText = '💾';

form.classList.add('submit-actions');

form.appendChild(saveButton);
content.appendChild(form);

let selectedEntity = '';

var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type == "attributes") {
      if (labelField.hasAttribute('data-selected-entity')) {
      	saveButton.removeAttribute('disabled');
      	selectedEntity = labelField.getAttribute('data-selected-entity');
      }
    }
  });
});

observer.observe(labelField, {
  attributes: true,
});

saveButton.addEventListener('click', async function() {
	if (selectedEntity) {
		saveButton.setAttribute('disabled', 'disabled');
		let answer = await setClaim(selectedEntity, proposals.ids[0][0].prop, proposals.ids[0][0].value);
		if (answer.success && answer.success == 1) {
			window.location = 'entity.html?' + selectedEntity;
		} 
	}
});