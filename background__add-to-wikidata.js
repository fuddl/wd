import { sparqlQuery } from "./sqarql-query.js"
import { getTokens } from './sidebar/wd-get-token.js';
import { wikidataGetEntity } from './wd-get-entity.js';
import { resolvers } from './content/resolver.js';
import { pushEnitiyToSidebar } from "./push-enitiy-to-sidebar.js"

async function processJobs(jobs) {
	let lastCreated = null;
	let lastEdit = null;
	let answer = null;
	let refAnswer = null;
	for (let job of jobs) {
		if (job.type === 'create') {
			answer = await createEntity(job.label, job.lang);
			if (answer.success && answer.success == 1) {
				lastCreated = {
					id: answer.entity.id,
					job: job,
				}
			}

		} else if (job.type === 'set_claim') {
			
			let extistingStatement = await getExistingStatement('Q' + job.object['numeric-id'], job.verb, job.subject);
			let subject = job.subject !== 'LAST' ? job.subject : lastCreated.id;

			if (!extistingStatement) {
				answer = await setClaim(subject, job.verb, job.object);
			} else {
				answer = {
					success: 1,
					claim: {
						id: extistingStatement
					}
				}
			}
			
			if (job.references && answer.success && answer.success == 1) {
				for (let reference of job.references) {
					refAnswer = await addReference(answer.claim.id, reference);
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
		if (lastEdit.job.fromTab) {
			pushEnitiyToSidebar(lastEdit.id, lastEdit.job.fromTab, true, true);
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

	data.append('summary', 'created with [[Wikidata:Tools/Wikidata for Firefox|Wikidata for Firefox 🦊]]');
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
		await resolvers.URL_match_pattern.addToExternalIDCache(property, value, subject[subjectId].id);
		data.append('value', '"' + value + '"');
	} else {
		data.append('value', JSON.stringify(value));
	}

	data.append('summary', 'connected with [[Wikidata:Tools/Wikidata for Firefox|Wikidata for Firefox 🦊]]');
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
	data.append('summary', 'added with [[Wikidata:Tools/Wikidata for Firefox|Wikidata for Firefox 🦊]]');
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
	let answer = await sparqlQuery(`
		SELECT ?stmt WHERE {
			wd:${subject} p:${verb} ?stmt.
			?stmt ps:${verb} wd:${object}.
		}
	`);
	if (answer[0]) {
		let output = answer[0].stmt.value.replace("http://www.wikidata.org/entity/statement/", '').replace(/\-/, '$');
		return output;
	} else {
		return false;
	}
}

export { processJobs }
