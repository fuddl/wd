

async function processJobs(jobs) {
	let lastCreated = null;
	let answer = null;
	for (job of jobs) {
		if (job.type === 'create') {
			answer = await createEntity(job.label, job.lang);
			if (answer.success && answer.success == 1) {
				lastCreated = answer.entity.id;
				if (job.fromTab) {
					pushEnitiyToSidebar(lastCreated, job.fromTab);
				}
			}

		} else if (job.type === 'set_claim') {
			answer = await setClaim(job.subject !== 'LAST' ? job.subject : lastCreated, job.verb, job.object);
			if (job.references && answer.success && answer.success == 1) {
				for (reference of job.references) {
					answer = await addReference(answer.claim.id, answer.pageinfo.lastrevid, reference);
				}
			}
		}
	}
}

async function createEntity(label, lang) {
	let token = await getTokens();

	let labels = { labels: {} };
	labels.labels[lang] = {
		"language": lang,
		"value": label,
	};

	let data = new FormData();
	data.append('action', 'wbeditentity');
	data.append('new', 'item');
	data.append('data', JSON.stringify(labels));

	data.append('summary', 'created with Wikidata for Firefox');
	data.append('token', token);
	data.append('bot', '1');
	data.append('format', "json");

	let response = await fetch('https://www.wikidata.org/w/api.php', {
		method: 'post',
		body: new URLSearchParams(data),
	});

  return JSON.parse(await response.text());
}

async function setClaim(subjectId, property, value) {
	let token = await getTokens();
	let subject = await wikidataGetEntity(subjectId);

	let data = new FormData();
	data.append('action', 'wbcreateclaim');
	data.append('entity', subject[subjectId].id);
	data.append('snaktype', 'value');
	data.append('property', property);

	if (typeof value === "string") {
		data.append('value', '"' + value + '"');
	} else {
		data.append('value', JSON.stringify(value));
	}

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

async function addReference(claimId, lastrevid, references) {
	let token = await getTokens();

	let data = new FormData();
	data.append('action', 'wbsetreference');
	data.append('statement', claimId);
	data.append('snaks', JSON.stringify(references));
	data.append('summary', 'added with Wikidata for Firefox');
	data.append('token', token);
	data.append('baserevid', lastrevid);
	data.append('bot', '1');
	data.append('format', "json");

	let response = await fetch('https://www.wikidata.org/w/api.php', {
		method: 'post',
		body: new URLSearchParams(data),
	});

  return JSON.parse(await response.text());
}