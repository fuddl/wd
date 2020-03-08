resolvers.inventaire = {
	applicable: function(location) {
		return this.getEntityId() !== null;
	},
	getEntityId: function() {
		return location.href.match(this.inventaireRegex) != null ? location.href.match(this.inventaireRegex)[1] : null;
	},
	inventaireRegex: /https\:\/\/inventaire\.io\/entity\/wd\:(Q\d+)/,
};