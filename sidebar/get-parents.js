async function getParents (childID) {
	let query = `
		SELECT ?item ?linkTo {
			wd:${childID} wdt:P279* ?item
			OPTIONAL { ?item wdt:P279 ?linkTo }
		}
	`;
	return await sparqlQuery(query);
}

class Breadcrumbs {
	constructor (child, queryResult) {
		this.graph = {};
		this.ends = [];
		this.queryResult = queryResult;
		this.build();
		return this.shortestPath(child);
	}
	id(input) {
		return input.replace('http://www.wikidata.org/entity/', '');
	}
	build() {
		this.queryResult.forEach((entry) => {
			if (entry.linkTo) {
				this.addEdge(this.id(entry.item.value), this.id(entry.linkTo.value));
			} else {
				this.ends.push(this.id(entry.item.value));
			}
		});
	}
	addEdge(u, v) {
		if (this.graph[u] === undefined) {
			this.graph[u] = [];
		}
		this.graph[u].push(v);
	}
	findEnd() {
		return this.ends[0];
	}
	shortestPath(source) {
		let queue = [ source ];
		let visited = { source: true };
		let predecessor = {};
		let tail = 0;
		while (tail < queue.length) {
			let u = queue[tail++];
			let neighbors = this.graph[u];
			if (neighbors) {
				for (var i = 0; i < neighbors.length; ++i) {
					var v = neighbors[i];
					if (visited[v]) {
						continue;
					}
					visited[v] = true;
					if (v === this.findEnd()) {
						var path = [ v ];
						while (u !== source) {
							path.push(u);
							u = predecessor[u];
						}
						path.push(u);
						path.reverse();
						return path;
					}
					predecessor[v] = u;
					queue.push(v);
				}
			}
		}
	}
}
