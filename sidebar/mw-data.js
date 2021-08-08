import { templates } from './components/templates.tpl.js';
import { URL_match_pattern } from "../content/resolver__url-match-pattern.js";
import { makeLanguageValid } from '../get-valid-string-languages.js';
import { sparqlQuery } from "../sqarql-query.js";

async function getLangQid(iso) {
	const query = `
		SELECT ?n WHERE {
		  ?q wdt:P218 "${iso}".
		  BIND(REPLACE(STR(?q), "http://www.wikidata.org/entity/Q", "") as ?n)
		}
	`;
	const response = await sparqlQuery(query);
	if (response.length > 0 && response[0].n?.value) {
		return parseInt(response[0].n.value);
	} else {
		return false;
	}
}

async function findMediaWikiData(doc, propform, url) {
	const scripts = doc.querySelectorAll('script');
	for (let script of scripts) {
		if (script?.innerText.match(/"wgArticleInterlangList":\s*\[[^\]]+\]/)) {
			const wgTitle = script?.innerText.match(/"wgTitle":\s*\"([^"]+)"/)[1];
			const wgPageContentLanguage = script?.innerText.match(/"wgPageContentLanguage":"([^"]+)"/)[1];
			// this page seems to be a mediawiki article with interwiki links
			let editUri = doc.querySelector('link[rel="EditURI"]');
			let apiUrl = editUri?.href.replace(/\?.*/, '');
			if (apiUrl) {
				const params = new URLSearchParams({
					action: 'query',
					prop: 'langlinks',
					titles: wgTitle,
					llprop: 'url',
					format: 'json',
				});
				const response = await fetch(`${apiUrl}?${params.toString()}`);
				const jsonResponse = await response.json();
				const pageID = Object.keys(jsonResponse?.query?.pages);
				if (pageID && jsonResponse?.query?.pages[pageID].langlinks.length > 0) {

					let comment = templates.smallBlock(
						templates.text(
							[
								document.createTextNode('Found in interwiki links of '),
								templates.urlLink(url),
							]
						)
					);

					
					

					const langlinks = jsonResponse.query.pages[pageID].langlinks;
					for (let langlink of langlinks) {
						const location = {
							href: langlink.url
						};
						let isApplicable = await URL_match_pattern.applicable(location);
						if (isApplicable) {
							let entityId = await URL_match_pattern.getEntityId(location);
							if (!entityId) {
								let label = templates.placeholder({
									entity: isApplicable[0].prop,
								})
								let references = [{
									"snaktype": "value",
									"property": "P854",
									"datavalue": {
										"value": url,
										"type": "string"
									},
									"datatype": "url"
								},
								{
									"snaktype": "value",
									"property": "P1476",
									"datavalue": {
										"value": {
											text: doc.querySelector('title').innerText,
											language: await makeLanguageValid(wgPageContentLanguage),
										},
										"type": "monolingualtext"
									},
									"datatype": "string"
								}];
								
								let result = await fetch(location.href);
								let text = await result.text();
								let wgArticleId;
								let wgArticleIDQuaifier = [];
								if (text) {
									wgArticleId = text.match(/"wgArticleId":(\d+)/)[1];
									if (wgArticleId) {
										wgArticleIDQuaifier = [{
											property: 'P9675',
											value: wgArticleId,
										}];
									}
								}

								let check = document.createElement('input');
								check.setAttribute('type', 'checkbox');
								check.setAttribute('name', isApplicable[0].value);
								check.setAttribute('value', JSON.stringify({
									type: 'set_claim',
									verb: isApplicable[0].prop,
									object: isApplicable[0].value,
									qualifiers: [{
										property: 'P1810',
										value: langlink["*"],
									},
									{
										property: "P407",
										value: {
											'entity-type': "item",
											'numeric-id': await getLangQid(langlink.lang),
										}
									},
										...wgArticleIDQuaifier,
									],
									references: references,
								}));
								check.checked = true;
								let preview = templates.remark({
									sortKey: isApplicable[0].prop,
									check: check,
									prop: label,
									vals: [
										templates.text([
											templates.code(isApplicable[0].value),
											comment.cloneNode(true),
										]),
									],
								});
								propform.appendChild(preview);		
							}
						}
					}
				}
			}
		}
	}

	return false;
}

export { findMediaWikiData }