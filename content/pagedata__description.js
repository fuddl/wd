function findDescriptions() {
	let descs = [];
	let metaDesc = document.querySelector('meta[name="description"]');
	if (metaDesc) {
		descs.push(metaDesc.getAttribute('content'));
	}
	let twitterDesc = document.querySelector('meta[name="twitter:description"]');
	if (twitterDesc) {
		descs.push(twitterDesc.getAttribute('content'));
	}
	return descs;
}

export { findDescriptions }