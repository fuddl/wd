import { placeholder } from "../placeholder/placeholder.tpl.js";
import { rubifyLemma } from '../../rubifyLemma.js';
import { requreStylesheet } from '../require-styleheet.js'
import intersection from 'array-intersection'

import rules from "./flex-rules.yml";

const variantFeatures = ['Q115819543']

function buildRepresentations(target, form, affix = {}, lexeme) {
	
	requreStylesheet('components/flex/flex.css')
	
	let variation = document.createElement("div");
	variation.classList.add("flex__variant");
	let formLink = document.createElement("a");
	variation.appendChild(formLink);
	formLink.setAttribute("href", "#" + form.id);

	const hyphenisation = form?.claims?.P5279?.[0]?.mainsnak?.datavalue?.value;

	const ruby = rubifyLemma(form.representations)

	if (ruby.rubified) {
		formLink.appendChild(ruby.rubified);
	}

	for (let rep in ruby.unrubified) {
		if (formLink.innerText !== "") {
			formLink.appendChild(document.createTextNode(" / "));
		}

		let repSpan = document.createElement("span");
		repSpan.setAttribute("lang", form.representations[rep].language);
		let formStr = form.representations[rep].value;
		if (hyphenisation && hyphenisation.replace(/‧/g, "") === formStr) {
			formStr = hyphenisation.replace(/‧/g, String.fromCodePoint(173));
		}
		repSpan.innerText = formStr;
		formLink.appendChild(repSpan);
	}
	if (affix?.prefix) {
		buildAffix(variation, affix.prefix, "before", lexeme);
	}
	if (affix?.suffix) {
		buildAffix(variation, affix.suffix, "after", lexeme);
	}
	target.appendChild(variation);
}

function buildAffix(target, affix, position = "after", lexeme) {
	let affixElement = document.createElement("span");
	affixElement.classList.add("flex__affix");
	let processedAffix = affix.split(/[\[\]]/gm).map((part, index) => {
		if ((index + 1) % 2 == 0 && lexeme.hasOwnProperty(part)) {
			return placeholder({
				entity: lexeme[part],
			});
		}
		return document.createTextNode(part);
	});

	for (let part of processedAffix) {
		affixElement.appendChild(part);
	}

	switch (position) {
		case "after":
			target.appendChild(affixElement);
			break;
		case "before":
			target.prepend(affixElement);
			break;
	}
}

const flex = (vars) => {
	const output = document.createDocumentFragment()

	let xAxis, yAxis;
	let affixes = [];
	let hiddenLabels = [];

	const formSets = {
		'Q0': [],
	}
	for (const form of vars.forms) {
		if (intersection(form.grammaticalFeatures, variantFeatures).length == 0) {
			formSets.Q0.push(form)
		}
	}

	for (const feature of variantFeatures) {
		for (const form of vars.forms) {
			if (form?.grammaticalFeatures.includes(feature)) {
				if (!formSets.hasOwnProperty(feature)) {
					formSets[feature] = []
				}
				formSets[feature].push(form)
			}
		}
	}
	for (const set in formSets) {
		let table = document.createElement("table");
		table.classList.add("flex");

		for (const lang in rules) {
			const ruleset = rules[lang];
			if (ruleset.lang === vars.lang) {
				for (const type in ruleset.categories) {
					let wordType = ruleset.categories[type];
					if (vars.category === wordType.category) {
						// in case this word requires a certain gender which the
						// lexeme does not have, continue to the next loop
						if (wordType?.gender && vars.gender != wordType.gender) {
							continue;
						}

						let header = document.createElement("thead");
						let hRow = document.createElement("tr");
						table.appendChild(header);
						header.appendChild(hRow);
						const oneColumn = wordType?.xAxis ? false : true;
						const oneRow = wordType?.yAxis ? false : true;
						let tbody = document.createElement("tbody");
						table.appendChild(tbody);

						// the upper right column should be empty when there
						// is more than one row and more than one column.
						if (!oneColumn && !oneRow) {
							let emptyHead = document.createElement("th");
							hRow.appendChild(emptyHead);
						}

						// draw the first cell in each row
						for (let y in wordType.yAxis) {
							wordType.yAxis[y].row = document.createElement("tr");
							tbody.appendChild(wordType.yAxis[y].row);
							const yFeatures = wordType.yAxis[y].features;
							for (let feature of yFeatures) {
								if (
									!wordType.yAxis[y].hidden ||
									!wordType.yAxis[y].hidden.includes(feature)
								) {
									let hCell = document.createElement("th");
									hCell.appendChild(
										placeholder({
											entity: feature,
										})
									);
									wordType.yAxis[y].row.appendChild(hCell);
								}
							}
						}

						let iterator = oneColumn ? { one: true } : wordType.xAxis;
						for (let x in iterator) {
							let xFeatures = [];
							if (!oneColumn) {
								xFeatures = wordType.xAxis[x].features;
								for (let feature of xFeatures) {
									let hCell = document.createElement("th");
									hCell.appendChild(
										placeholder({
											entity: feature,
										})
									);
									hRow.appendChild(hCell);
								}
							}

							for (let y in wordType.yAxis) {
								let yFeatures = wordType.yAxis[y].features;
								let dCell = document.createElement("td");
								for (let form of formSets[set]) {
									if (
										oneColumn ||
										xFeatures.every((v) => form.grammaticalFeatures.includes(v))
									) {
										if (
											yFeatures.every((v) => {
												return form.grammaticalFeatures.includes(v);
											})
										) {
											let affix = wordType?.affixes?.find((v) => {
												if (
													v.features.every((vv) =>
														[...xFeatures, ...yFeatures].includes(vv)
													)
												) {
													return v;
												}
											});
											buildRepresentations(dCell, form, affix, vars);
										}
									}
								}
								wordType.yAxis[y].row.appendChild(dCell);
							}
						}

						for (let y in wordType.yAxis) {
							if (!oneRow) {
								let row = document.createElement("tr");
								tbody.appendChild(row);
								if (oneRow) {
									let hCell = document.createElement("th");
									hCell.appendChild(
										placeholder({
											entity: y,
										})
									);
									row.appendChild(hCell);
								}
								for (let x in wordType.xAxis) {
									if (wordType.xAxis[x].present) {
										let dCell = document.createElement("td");
										row.appendChild(dCell);
										if (
											form.grammaticalFeatures.includes(x) &&
											(form.grammaticalFeatures.includes(y) || oneRow)
										) {
											buildRepresentations(dCell, form, {}, vars);
											dCell.appendChild(formLink);
										}
									}
								}
							}
						}
					}
				}
			}
		}
		if (table.childNodes.length > 0) {
			if (set != 'Q0') {
				const heading = document.createElement('h3')
				heading.appendChild(placeholder({
					entity: set,
				}))
				output.appendChild(heading)
			}
			output.appendChild(table)
		}
	}

	if (output.childNodes.length > 0) {
		return output;
	} else {
		return false;
	}

};

export { flex };
