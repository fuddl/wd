import { wikidataGetEntity } from '../wd-get-entity.js';

async function getFormatterUrls(prop, id) {
	const property = await wikidataGetEntity(prop, true, true);

	const urlBlacklist = [
		'https://wikidata-externalid-url.toolforge.org/',
		'https://web.archive.org/web/',
		'https://resolve.eidr.org/',
	];

	let patternList = [];

	for (let prop of ['P1630', 'P3303', 'P7250']) {
		if (property?.claims?.[prop]) {
			for (let value of property.claims[prop]) {
				if (value?.mainsnak?.datavalue?.value) {
					let exp = {}
					let url = value.mainsnak.datavalue.value;
					let isBadUrl = false;
					for (let badUrl of urlBlacklist) {
						if (url.startsWith(badUrl)) {
							isBadUrl = true;
							continue;
						}
					}
					if (isBadUrl) {
						continue;
					}
					if (value?.qualifiers?.['P8460']?.[0]?.datavalue?.value) {
						exp.value = value?.qualifiers?.['P8460']?.[0]?.datavalue?.value;
					}

					patternList.push({
						form: {
							value: url,
						},
						exp: exp,
					});
				}
			}
		}
	}

	//console.debug(patternList);
 
	if (!id) {
		return patternList;
	} else {
		let output = [];
		for (let template of patternList) {
			if (template.exp) {
				let regex = new RegExp(template.exp.value);
				let match = id.match(regex);
				if (match !== null) {
					if (match.length > 1) {
						output.push(id.replace(regex, template.form.value));
					} else {
						output.push(template.form.value.replace('$1', id));
					}
				}
			} else {
				output.push(template.form.value.replace('$1', id));
			}
		}
		return output;
	}
} 

export { getFormatterUrls }
