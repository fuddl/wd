export default class jobRedundancyChecker {
	constructor() {
		this.list = [];
	}
	check(job) {
		let hash = JSON.stringify(job);
		if (this.list.includes(hash)) {
			return true;
		} else {
			this.list.push(hash);
			return false;
		}
	}
	debug() {
		console.debug(this.list);
	}
}
