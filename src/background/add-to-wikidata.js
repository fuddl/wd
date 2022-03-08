import {getTokens} from '../sidebar/wd-get-token.js'
import {wikidataGetEntity} from '../wd-get-entity.js'
import {pushEnitiyToSidebar} from "./push-enitiy-to-sidebar.js"
import {updateStatus} from "../update-status.js"
import browser from 'webextension-polyfill'
import {URL_match_pattern} from "../resolver/url-match-pattern"


function groupJobs(jobs) {
	let groupedJobs = {};
	for (let job of jobs) {
		let jobWithoutReferences = { ...job, references: null };
		job.serialised = JSON.stringify(jobWithoutReferences);
	}
	for (let job of jobs) {
		if (groupedJobs.hasOwnProperty(job.serialised)) {
			if (!groupedJobs[job.serialised].hasOwnProperty('references')) {
				groupedJobs[job.serialised].references = [];
			}
			groupedJobs[job.serialised].references.push(job.references);
		} else {
			groupedJobs[job.serialised] = job;
		}
	}
	for (let key in groupedJobs) {
		delete groupedJobs[key].serialised;
	}

	return Object.values(groupedJobs);
}

async function processJobs(jobsUngrouped) {
	let jobs = groupJobs(jobsUngrouped);

	let lastCreated = null;
	let lastEdit = null;
	let answer = null;
	let refAnswer = null;
	let qualAnswer = null;
	for (let job of jobs) {
		if (job.hasOwnProperty('object') && (job.object.hasOwnProperty('numeric-id') && !job.object.hasOwnProperty('entity-type'))) {
			job.object['entity-type'] = "item";
		}

		if (job.type === 'create') {
			updateStatus([
				`Creating new entity labeled ${job.label}`,
			]);

			answer = await createEntity(job.label, job.lang);
			if (answer.success && answer.success == 1) {
				lastCreated = {
					id: answer.entity.id,
					job: job,
				}
				updateStatus([
					`Created new entity ${answer.entity.id}`,
				]);
			}

		} else if (job.type === 'set_sitelink') {
			setSiteLink(job.subject, job.verb, job.object);
		} else if (job.type === 'set_claim') {
			let subject = job.subject !== 'LAST' ? job.subject : lastCreated.id;
			let extistingStatement = await getExistingStatement(job.object, job.verb, subject);

			if (!extistingStatement) {
				updateStatus([
					'Setting statement ', {placeholder:{entity:job.verb}},' of ', {placeholder:{entity:subject}},
				]);

				answer = await setClaim(subject, job.verb, job.object);
			} else {
				answer = {
					success: 1,
					claim: {
						id: extistingStatement
					}
				}
			}

			if (job?.references && answer.success && answer.success == 1) {
				updateStatus([
					'Adding references to statement ', {placeholder:{entity:job.verb}},' of ', {placeholder:{entity:subject}},
				]);
				for (let reference of job.references) {
					refAnswer = await addReference(answer.claim.id, reference);
				}
			}
			if (job?.qualifiers && answer.success && answer.success == 1) {
				updateStatus([
					'Adding qualifiers to statement ', {placeholder:{entity:job.verb}},' of ', {placeholder:{entity:subject}},
				]);
				for (let qualifier of job.qualifiers) {
					qualAnswer = await addQualifier(answer.claim.id, qualifier);
				}
			}
			lastEdit = {
				id: subject,
				job: job,
			}
		}
	}

	if (lastEdit == null) {
		lastEdit = lastCreated;
	}

	if (lastEdit) {
        const tabId = lastEdit.job.fromTab
        if (tabId) {
			await pushEnitiyToSidebar(lastEdit.id, tabId, true, true);
		}

		if (lastEdit.job.fromUrl) {
			let cache = await browser.storage.local.get();
			if (!('urlCache' in cache)) {
				cache.urlCache = {};
			}
			cache.urlCache[lastEdit.job.fromUrl] = lastEdit.id;
			browser.storage.local.set(cache);
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

	data.append('summary', 'created with [[d:Wikidata:Tools/Wikidata for Firefox|Wikidata for Firefox 🦊]]');
	data.append('token', token);
	data.append('bot', '1');
	data.append('format', "json");


	let response = await fetch('https://www.wikidata.org/w/api.php', {
		method: 'post',
		body: new URLSearchParams(data),
	});

	return JSON.parse(await response.text());
}

async function setSiteLink(subjectId, property, value) {
	let data = new FormData();
	data.append('token', await getTokens());
	const action = `action=wbsetsitelink&id=${subjectId}&linksite=${property}&linktitle=${value}&format=json`;
	let response = await fetch(`https://www.wikidata.org/w/api.php?${action}`, {
		method: 'post',
		body: new URLSearchParams(data),
	});
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
		await URL_match_pattern.addToExternalIDCache(property, value, subject[subjectId].id);
		data.append('value', '"' + value + '"');
	} else {
		data.append('value', JSON.stringify(value));
	}

	data.append('summary', 'connected with [[d:Wikidata:Tools/Wikidata for Firefox|Wikidata for Firefox 🦊]]');
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

async function addReference(claimId, references) {
	let token = await getTokens();

	let data = new FormData();
	data.append('action', 'wbsetreference');
	data.append('statement', claimId);
	data.append('snaks', JSON.stringify(references));
	data.append('summary', 'added with [[d:Wikidata:Tools/Wikidata for Firefox|Wikidata for Firefox 🦊]]');
	data.append('token', token);
	data.append('bot', '1');
	data.append('format', "json");

	let response = await fetch('https://www.wikidata.org/w/api.php', {
		method: 'post',
		body: new URLSearchParams(data),
	});

	return JSON.parse(await response.text());
}

async function addQualifier(claimId, qualifier) {
	let token = await getTokens();

	let data = new FormData();
	data.append('action', 'wbsetqualifier');
	data.append('claim', claimId);
	data.append('property', qualifier.property);
	data.append('snaktype', 'value');
	data.append('value', JSON.stringify(qualifier.value));
	data.append('summary', 'added with [[d:Wikidata:Tools/Wikidata for Firefox|Wikidata for Firefox 🦊]]');
	data.append('token', token);
	data.append('bot', '1');
	data.append('format', "json");

	let response = await fetch('https://www.wikidata.org/w/api.php', {
		method: 'post',
		body: new URLSearchParams(data),
	});

	return JSON.parse(await response.text());
}

async function getExistingStatement(object, verb, subject) {
	try {
		const response = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${subject}&props=claims&format=json`, {
			cache: 'reload',
		});

		if (response.status !== 200) {
			throw 'Status Code: ' + response.status;
		}

		const json = await response.json();
		const claims = json.entities[subject].claims;

		if (!claims.hasOwnProperty(verb)) {
			return false;
		} else {
			for (const claim of claims[verb]) {
				if(claim.hasOwnProperty('mainsnak')) {
					const value = claim.mainsnak.datavalue.value;
					if (object.hasOwnProperty('numeric-id') && value.hasOwnProperty('numeric-id') && object['numeric-id'] == value['numeric-id']) {
						return claim.id;
					}
					else if (object.hasOwnProperty('language') && object.hasOwnProperty('text') && value.hasOwnProperty('text') && value.hasOwnProperty('language')) {
						if (value.language.startsWith(object.language)) {
							if (object.text === value.text) {
								return claim.id;
							}
						}
					}
					else if (object.hasOwnProperty('amount') && object.hasOwnProperty('unit') && value.hasOwnProperty('amount') && value.hasOwnProperty('unit')) {
						if (object.amount == value.amount && object.unit === value.unit) {
							return claim.id;
						}
					} else if (typeof object === 'string') {
						if (value === object) {
							return claim.id;
						}
					}
				}
			}
			return false;
		}
	} catch(error) {
		throw ['Fetch Error :-S', error];
	}
}

export { processJobs }
