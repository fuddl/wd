templates.flex = (vars) => { 
	let table = document.createElement('table');
	table.classList.add('flex');

	let header = document.createElement('thead');
	let hRow = document.createElement('tr');
	
	table.appendChild(header);
	header.appendChild(hRow);

	let xAxis = {

		// verbs
		Q21714344: {
			// first person
		},
		Q51929049: {
			// second person
		},
		Q51929074: {
			// second person
		},

		// nouns
		Q110786: {
			// singular
		},
		Q146786: {
			// plural
		},

		// adjectives
		Q3482678: {
			// positive
		},
		Q14169499: {
			// comperative
		},
		Q5483481: {
			// superlative
		},

	}

	let yAxis = {
		Q131105: {
			// mominative
		},
		Q146078: {
			// accusative
		},
		Q145599: {
			// dative
		}, 
		Q146233: {
			// genitive
		},
		Q192997: {
			// instrumental
		},
		Q2114906: {
			// prepositional
		},

		// verbs
		Q192613: {
			// present
		},
		Q442485: {
			// preterite
		},
		Q3502544: {
			// past subjunctive
		},
		Q22716: {
			// imperative
		},
		Q625420: {
			// perfect
		}
	}

	let hasYAxis = false;

	for (let x in xAxis) {
		for (let y in yAxis) {
			for (let form of vars.forms) {
				if (form.grammaticalFeatures.includes(x)) {
					xAxis[x].present = true;
				}
				if (form.grammaticalFeatures.includes(y)) {
					yAxis[y].present = true;
					hasYAxis = true;
				}
			}
		}
	}

	if (hasYAxis) {
		hRow.appendChild(document.createElement('th'));
	}

	for (let x in xAxis) {
		if (xAxis[x].present) {
			let hCell = document.createElement('th');
			hCell.appendChild(templates.placeholder({
				entity: x
			}));
			hRow.appendChild(hCell);
		}
	}

	let tbody = document.createElement('tbody');

	table.appendChild(tbody);

	for (let y in yAxis) {
		if (yAxis[y].present || !hasYAxis) {
			let row = document.createElement('tr');
			tbody.appendChild(row);
			if (hasYAxis) {
				let hCell = document.createElement('th');
				hCell.appendChild(templates.placeholder({
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