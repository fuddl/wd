function findTitles() {
	let titles = [];

	// extract the lemma of mediawiki based pages
	let scriptBlocks = document.querySelectorAll('script');
	for (s of scriptBlocks) {
		let match = s.innerText.match(/"wgTitle":"((?:[^"\\]|\\.)+)"/);
		if (match) {
			titles.push(match[1].replace(/\\(.)/g, "$1"));
		}
	}

	let ogTitle = document.querySelector('meta[property="og:title"]');
	if (ogTitle) {
		titles.push(ogTitle.getAttribute('content'));
	}
	let hOnes = document.querySelectorAll('h1');
	for (h of hOnes) {
		titles.push(h.innerText);
	}
	let hTwos = document.querySelectorAll('h2');
	for (h of hTwos) {
		titles.push(h.innerText);
	}
	let hThrees = document.querySelectorAll('h3');
	for (h of hThrees) {
		titles.push(h.innerText);
	}
	let titleElement = document.querySelector('title');
	if (titleElement) {
		titles.push(titleElement.innerText);
	}
	titles = titles.filter(function (title) {
  	return title != '';
	});

	return titles;
}