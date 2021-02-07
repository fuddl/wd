async function getAutodesc(id) {
	try {
		const lang = navigator.language.substr(0,2);
		let response = await fetch('https://autodesc.toolforge.org/?q=' + id + '&lang=' + lang + '&mode=short&links=text&redlinks=&format=json');
		let json = await response.json();
		if (!json.result.match(/<i>/)) {
			return json.result;
		}
	} catch (ex) {
		console.log(ex);
	}
	return '???';
}
