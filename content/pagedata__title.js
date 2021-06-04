function findTitles() {
	let titles = [];

	// extract the lemma of mediawiki based pages
	let scriptBlocks = document.querySelectorAll('script');
	for (let s of scriptBlocks) {
		let mediawikiTitle = s.innerText.match(/"wgTitle":"((?:[^"\\]|\\.)+)"/);
		let isWikibaseItem = s.innerText.match(/"wgPageContentModel":"wikibase-item"/);
		// since the title is not very useful in a wikibase item
		if (mediawikiTitle && !isWikibaseItem) {
			titles.push(mediawikiTitle[1].replace(/\\(.)/g, "$1"));
		}
	}

	let ogTitle = document.querySelector('meta[property="og:title"]');
	if (ogTitle) {
		titles.push(ogTitle.getAttribute('content'));
	}
	let hOnes = document.querySelectorAll('h1');
	for (let h of hOnes) {
		titles.push(h.innerText);
	}
	let hTwos = document.querySelectorAll('h2');
	for (let h of hTwos) {
		titles.push(h.innerText);
	}
	let hThrees = document.querySelectorAll('h3');
	for (let h of hThrees) {
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

export { findTitles }

