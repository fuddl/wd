function findTitles() {
	let titles = [];
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
	return titles;
}