resolvers.wikipedia = {
	applicable: function(location) {
		return location.href.match(/^https:\/\/[\w]+(\.m)?\.wik(ipedia|iquote|tionary|isource)\.org\/wiki\/[\w%\.\:\(\)]+$/) !== null;
	},
	getEntityId: function() {
		let meta = document.querySelector('script[type="application/ld+json"]');
		let metaData = JSON.parse(meta.innerText);
		let sameAs = metaData.sameAs;
		return sameAs.match(/http:\/\/www.wikidata.org\/entity\/(Q\d+)/)[1];
	}
};