function getPropertyScope(property) {
	let scopes = {
		'Q54254515': 'lexeme',
	};
	if (property.claims.P31) {
		for (let instanceOf of property.claims.P31) {
			if (instanceOf.mainsnak.datavalue.value.id) {
				if (scopes[instanceOf.mainsnak.datavalue.value.id]) {
					return scopes[instanceOf.mainsnak.datavalue.value.id];
				}
			}
		}
	}
	return 'item';

}

(async () => {
	let proposals = JSON.parse(decodeURIComponent(window.location.search.replace(/^\?/, '')));
	let content = document.getElementById('content');

	let property = await wikidataGetEntity(proposals.ids[0][0].prop);

	let preview = templates.remark({
		prop: templates.placeholder({
			entity: proposals.ids[0][0].prop,
		}),
		vals: [templates.code(proposals.ids[0][0].value)],
	});

	let labelField = templates.join({
	  human: proposals.titles[0],
	  scope: getPropertyScope(property[proposals.ids[0][0].prop]),
	});

	content.appendChild(preview);
	resolvePlaceholders();

	let direction = templates.direction();

	content.appendChild(direction);

	content.appendChild(labelField);

	let saveButton = document.createElement('button');
	saveButton.setAttribute('disabled', 'disabled');
	saveButton.innerText = '💾';


	let form = document.createElement('div');
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

	console.log(proposals);

	saveButton.addEventListener('click', async function() {
		if (selectedEntity && !saveButton.hasAttribute('disabled')) {
			saveButton.setAttribute('disabled', 'disabled');

			let jobs = [];

			if (selectedEntity === 'CREATE') {
				let lang = navigator.language.substr(0,2);;
				jobs.push({
					type: 'create',
					label: labelField.getAttribute('data-selected-label'),
					lang: lang,
					fromTab: proposals.fromTab,
					fromUrl: proposals.source.url,
				});
				selectedEntity = 'LAST'; 
			}

			let now = new Date();

			jobs.push({
				type: 'set_claim',
				subject: selectedEntity,
				verb: proposals.ids[0][0].prop,
				object: proposals.ids[0][0].value,
				references: [{
				  "P854": [{
			      "snaktype": "value",
			      "property": "P854",
			      "datavalue": {
			        "value": proposals.source.url,
			        "type": "string"
			      },
			      "datatype": "url"
				  }],
				  "P1476": [{
			      "snaktype": "value",
			      "property": "P1476",
			      "datavalue": {
			        "value": {
			          "text": proposals.source.title,
			          "language": proposals.source.lang ? proposals.source.lang : 'zxx',
			        },
			        "type": "monolingualtext"
			      },
			      "datatype": "string"
				  }],
				  "P813": [{
			      "snaktype": "value",
			      "property": "P813",
			      "datavalue": {
			        "type": "time",
			        "value": {
			          "after": 0,
			          "before": 0,
			          "calendarmodel": "http://www.wikidata.org/entity/Q1985727",
			          "precision": 11,
			          "time": `+${ now.toISOString().substr(0,10) }T00:00:00Z`,
			          "timezone": 0
			        }
			      }
			    }]
				}],
			});

			browser.runtime.sendMessage({
				type: 'send_to_wikidata',
				data: jobs,
			});


			if (selectedEntity.match(/\w\d+/)) {

				let cache = await browser.storage.local.get();
				if (!('mapCache' in cache)) {
					cache.mapCache = {};
				}
				cache.mapCache[proposals.source.url] = selectedEntity;
				browser.storage.local.set(cache);


				window.location = 'entity.html?' + selectedEntity;
			}
		}
	});
})()