import { sparqlQuery } from '../sqarql-query.js';

async function getFormatterUrls(prop, id) {
	const query = `
		SELECT ?form ?exp WHERE {
			{
				wd:${prop} p:P1630 ?s.
				?s ps:P1630 ?form.
			} UNION {
				wd:${prop} p:P3303 ?s.
				?s ps:P3303 ?form.
			} UNION {
				wd:${prop} p:P7250 ?s.
				?s ps:P7250 ?form.
			}
			OPTIONAL { 
				?s pq:P8460 ?exp.
			}
			FILTER(!STRSTARTS(?form, 'https://wikidata-externalid-url.toolforge.org/'))
			FILTER(!STRSTARTS(?form, 'https://web.archive.org/web/'))
			FILTER(!STRSTARTS(?form, 'https://resolve.eidr.org/'))
		}
	`;
	const patterns = await sparqlQuery(query);
	if (!id) {
		return patterns;
	} else {
		let output = [];
		for (let template of patterns) {
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
