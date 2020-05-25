const resolvers = {
	wikidata: {
		applicable: function(location) {
			return location.href.match(/https:\/\/[\w]+.wikidata.org\/wiki\/(?:\w+\:)?[QMPL]\d+/) !== null;
		},
		getEntityId: function() {
			return location.href.match(/https:\/\/[\w]+.wikidata.org\/wiki\/(?:\w+\:)?([QMPL]\d+)/)[1];
		}
	}
};