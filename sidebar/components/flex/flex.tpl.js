import { placeholder } from '../placeholder/placeholder.tpl.js';

function tn(str) {
	return document.createTextNode(str);
}

const flex = (vars) => { 
	let table = document.createElement('table');
	table.classList.add('flex');

	let header = document.createElement('thead');
	let hRow = document.createElement('tr');
	
	table.appendChild(header);
	header.appendChild(hRow);

	let xAxis, yAxis;
	let affixes = [];
	let hiddenLabels = [];

	// english
	if (vars.lang === 'Q1860') {
		// noun
		if (vars.category === 'Q1084') {
			yAxis = {
				sigular: {
					features: ['Q110786'],
				},
				plural: {
					features: ['Q146786'],
				},
			};
		}
		// verb
		if (vars.category === 'Q24905') {
			yAxis = {
				presentSingular: {
					features: ['Q3910936', 'Q51929218'], 
					hidden: ['Q51929218'],
				},
				presentPlural: {
					features: ['Q3910936','Q51929447'], 
					hidden: ['Q51929447'],
				},
				simplePast: {
					features: ['Q1392475']
				},
				presentParticiple: {
					features: ['Q10345583']
				},
				presentParticiple: {
					features: ['Q12717679']
				}
			}
			affixes = [
				{
					features: ['Q3910936', 'Q51929218'],
					prefix: tn(`I, you, they `),
				},
				{
					features: ['Q3910936','Q51929447'],
					prefix: tn(`he, she, it `),
				},
			]
		}

		// adjectives
		if (vars.category === 'Q34698') {
			yAxis = {
				positive: {
					features: ['Q3482678'],
					hidden: ['Q1931259'],
				},
				comperative: {
					features: ['Q14169499'],
				},
				superlative: {
					features: ['Q1817208'],
				},
			};
		}
	}
	// german
	if (vars.lang === 'Q188') {
		// noun
		if (vars.category === 'Q1084') {
			xAxis = {
				singular: {
					features: ['Q110786']
				},
				plural: {
					features: ['Q146786']
				},
			};
			yAxis = {
				nominative: {
					features: ['Q131105']
				},
				genitive: {
					features: ['Q146233']
				},
				dative: {
					features: ['Q145599']
				}, 
				accusative: {
					features: ['Q146078']
				},
			};

			if (vars.gender === 'Q1775415') {
				// female
				affixes = [
					{
						features: ['Q131105', 'Q110786'],
						prefix: tn(`die `),
					},
					{
						features: ['Q131105', 'Q146786'],
						prefix: tn(`die `),
					},
					{
						features: ['Q146233', 'Q110786'],
						prefix: tn(`der `),
					},
					{
						features: ['Q146233', 'Q146786'],
						prefix: tn(`der `),
					},
					{
						features: ['Q145599', 'Q110786'],
						prefix: tn(`der `),
					},
					{
						features: ['Q145599', 'Q146786'],
						prefix: tn(`den `),
					},
					{
						features: ['Q146078', 'Q110786'],
						prefix: tn(`die `),
					},
					{
						features: ['Q146078', 'Q146786'],
						prefix: tn(`die `),
					},
				];
			}
			if (vars.gender === 'Q499327') {
				// male
				affixes = [
					{
						features: ['Q131105', 'Q110786'],
						prefix: tn(`der `),
					},
					{
						features: ['Q131105', 'Q146786'],
						prefix: tn(`die `),
					},
					{
						features: ['Q146233', 'Q110786'],
						prefix: tn(`des `),
					},
					{
						features: ['Q146233', 'Q146786'],
						prefix: tn(`der `),
					},
					{
						features: ['Q145599', 'Q110786'],
						prefix: tn(`dem `),
					},
					{
						features: ['Q145599', 'Q146786'],
						prefix: tn(`den `),
					},
					{
						features: ['Q146078', 'Q110786'],
						prefix: tn(`den `),
					},
					{
						features: ['Q146078', 'Q146786'],
						prefix: tn(`die `),
					},
				];
			}
			if (vars.gender === 'Q1775461') {
				// neuter
				affixes = [
					{
						features: ['Q131105', 'Q110786'],
						prefix: tn(`das `),
					},
					{
						features: ['Q131105', 'Q146786'],
						prefix: tn(`die `),
					},
					{
						features: ['Q146233', 'Q110786'],
						prefix: tn(`des `),
					},
					{
						features: ['Q146233', 'Q146786'],
						prefix: tn(`der `),
					},
					{
						features: ['Q145599', 'Q110786'],
						prefix: tn(`dem `),
					},
					{
						features: ['Q145599', 'Q146786'],
						prefix: tn(`den `),
					},
					{
						features: ['Q146078', 'Q110786'],
						prefix: tn(`das `),
					},
					{
						features: ['Q146078', 'Q146786'],
						prefix: tn(`die `),
					},
				];
			}

		}
		// verbs
		if (vars.category === 'Q24905') {
			hiddenLabels = [
				'Q110786',
				'Q21714344',
				'Q682111',
				'Q51929074',
				'Q51929049',
				'Q146786',
			];
			yAxis = {
				ich: {
					features: ['Q110786', 'Q21714344', 'Q192613', 'Q682111'], 
					hidden: hiddenLabels,
				},
				du: {
					features: ['Q110786','Q51929049', 'Q192613', 'Q682111'], 
					hidden: hiddenLabels,
				},
				erSieEs: {
					features: ['Q51929074', 'Q192613', 'Q682111', 'Q110786'], 
					hidden: hiddenLabels,
				},
				ichPreterite: {
					features: ['Q21714344', 'Q442485', 'Q682111', 'Q110786'], 
					hidden: hiddenLabels,
				},
				ichSecondPreterite: {
					features: ['Q3502544', 'Q442485', 'Q110786', 'Q21714344'], 
					hidden: ['Q442485', ...hiddenLabels],
				},
				imperativeSingular: {
					features: ['Q22716', 'Q110786'],
					hidden: hiddenLabels,
				},
				imperativePlural: {
					features: ['Q22716', 'Q146786'],
					hidden: hiddenLabels,
				},
				pastParticiple: {
					features: ['Q12717679'],
				},
			}
			affixes = [
				{
					features: ['Q110786', 'Q21714344', 'Q192613', 'Q682111'],
					prefix: tn(`ich `),
				},
				{
					features: ['Q110786','Q51929049', 'Q192613', 'Q682111'],
					prefix: tn(`du `),
				},
				{
					features: ['Q51929074', 'Q192613', 'Q682111', 'Q110786'],
					prefix: tn(`er, sie, es `),
				},
				{
					features: ['Q21714344', 'Q442485', 'Q682111', 'Q110786'],
					prefix: tn(`ich `),
				},
				{
					features: ['Q3502544', 'Q442485', 'Q110786', 'Q21714344'],
					prefix: tn(`ich `),
				},
				{
					features: ['Q22716', 'Q110786'],
					prefix: tn(`du, `),
					suffix: tn(`!`),
				},
				{
					features: ['Q22716', 'Q146786'],
					prefix: tn(`ihr, `),
					suffix: tn(`!`),
				},
				{
					features: ['Q12717679'],
					suffix: (() => {
						if (vars.auxVerb) {
							let fr = document.createDocumentFragment();
							fr.appendChild(tn(` `));
							fr.appendChild(placeholder({
								entity: vars.auxVerb
							}))
							return fr;
						}
					})(),
				},
			];
		}
		// adjectives
		if (vars.category === 'Q34698') {
			yAxis = {
				positive: {
					features: ['Q3482678'],
					hidden: ['Q1931259'],
				},
				comperative: {
					features: ['Q577714'],
				},
				superlative: {
					features: ['Q5483481'],
				},
			};
			affixes = [
				{
					features: ['Q5483481'],
					prefix: tn(`am `),
				},
			]
		}
	}

	// russian
	if (vars.lang === 'Q7737') {
		// noun
		if (vars.category === 'Q1084') {
			xAxis = {
				singular: {
					features: ['Q110786']
				},
				plural: {
					features: ['Q146786']
				},
			};
			yAxis = {
				nominative: {
					features: ['Q131105']
				},
				genitive: {
					features: ['Q146233']
				},
				dative: {
					features: ['Q145599']
				}, 
				accusative: {
					features: ['Q146078']
				},
				instrumental: {
					features: ['Q192997']
				},
				prepositional: {
					features: ['Q2114906']
				},
			};
		}
	}

	// esperanto
	if (vars.lang === 'Q143') {
		// noun
		if (vars.category === 'Q1084') {
			xAxis = {
				singular: {
					features: ['Q110786']
				},
				plural: {
					features: ['Q146786']
				},
			};
			yAxis = {
				nominative: {
					features: ['Q131105']
				},
				accusative: {
					features: ['Q146078']
				},
			};
		}
	}

	let hasYAxis = false;
	let tbody = document.createElement('tbody');
	const oneColumn = xAxis ? false : true;

	if (!oneColumn) {
		let emptyHead = document.createElement('th');
		hRow.appendChild(emptyHead);
	}

	for (let y in yAxis) {
		yAxis[y].row = document.createElement('tr');
		tbody.appendChild(yAxis[y].row);
		let yFeatures = yAxis[y].features;
		for (let feature of yFeatures) {
			if (!yAxis[y].hidden || !yAxis[y].hidden.includes(feature)) {
				let hCell = document.createElement('th');
				hCell.appendChild(placeholder({
					entity: feature
				}));
				yAxis[y].row.appendChild(hCell);
			}
		}
	}
	let iterator = oneColumn ? {one: true} : xAxis ;
	for (let x in iterator) {
		let xFeatures = [];
		if (!oneColumn) {
			xFeatures = xAxis[x].features;
			for (let feature of xFeatures) {
				let hCell = document.createElement('th');
				hCell.appendChild(placeholder({
					entity: feature
				}));
				hRow.appendChild(hCell);
			}
		}

		for (let y in yAxis) {
			let yFeatures =  yAxis[y].features;
			let dCell = document.createElement('td');
			for (let form of vars.forms) {
				let variation = document.createElement('div');
				if (oneColumn || xFeatures.every(v => form.grammaticalFeatures.includes(v))) {
					if (yFeatures.every(v => { return form.grammaticalFeatures.includes(v) })) {
						let affix = affixes.find((v) => {
							if (v.features.every((vv) => [...xFeatures, ...yFeatures].includes(vv))) {
								return v;
							}
						});
						if (affix?.prefix) {
							variation.appendChild(affix.prefix);
						}
						let formLink = document.createElement('a');
						formLink.setAttribute('href', '#' + form.id);
						variation.appendChild(formLink);
						for (let rep in form.representations) {
							let repSpan = document.createElement('span');
							repSpan.setAttribute('lang', form.representations[rep]);
							repSpan.innerText = form.representations[rep].value;
							formLink.appendChild(repSpan);
						}
						if (affix?.suffix) {
							variation.appendChild(affix.suffix);
						}
						dCell.appendChild(variation);
					}
				}
			}
			yAxis[y].row.appendChild(dCell);
		}
	}

	if (hasYAxis) {
		hRow.appendChild(document.createElement('th'));
	}

	table.appendChild(tbody);

	for (let y in yAxis) {
		if (yAxis[y].present || !hasYAxis) {
			let row = document.createElement('tr');
			tbody.appendChild(row);
			if (hasYAxis) {
				let hCell = document.createElement('th');
				hCell.appendChild(placeholder({
					entity: y
				}));
				row.appendChild(hCell);
			}
			for (let x in xAxis) {
				if (xAxis[x].present) {
					let dCell = document.createElement('td');
					row.appendChild(dCell);
					for (let form of vars.forms) {
						if (form.grammaticalFeatures.includes(x) && (form.grammaticalFeatures.includes(y) || !hasYAxis)) {
							let formLink = document.createElement('a');
							formLink.setAttribute('href', '#' + form.id);
							if (dCell.hasChildNodes()) {
								dCell.appendChild(document.createElement('br'));
							}
							dCell.appendChild(formLink);
							for (let rep in form.representations) {
								let repSpan = document.createElement('span');
								repSpan.setAttribute('lang', form.representations[rep]);
								repSpan.innerText = form.representations[rep].value;
								formLink.appendChild(repSpan);
							}
						}
					}
				}
			}
		}
		if (!hasYAxis) {
			break;
		}
	}

	return table;
}

export { flex }
