resolvers.inventaire = {
	urlMatrch: async function(location) {
		return this.getEntityId() !== null;
	},
	getEntityId: async function() {
		return location.href.match(this.inventaireRegex)[1];
	},
	inventaireRegex: /https\:\/\/inventaire\.io\/entity\/wd\:(Q\d+)/,
};