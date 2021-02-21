const hash = {
	applicable: function(location) {
		return location.hash.match(/#wd:[QMPL]\d+/) !== null;
	},
	getEntityId: function() {
		return location.href.match(/#wd:([QMPL]\d+)/)[1];
	}
}

export { hash }