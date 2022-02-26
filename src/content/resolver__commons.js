const commons = {
	applicable: function(location) {
		return location.href.match(/^https:\/\/commons(\.m)?\.wikimedia\.org\/wiki\/File\:/) !== null
	},
	getEntityId: function(location) {
		let link = document.querySelector('link[href^="https://commons.wikimedia.org/wiki/Special:EntityData/M"][type="application/json"]')
		let href = link.getAttribute('href')
		return href.match(/https\:\/\/commons\.wikimedia\.org\/wiki\/Special:EntityData\/(M\d+)\.json/)[1]
	}
}

export { commons }
