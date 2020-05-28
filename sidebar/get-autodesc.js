async function getAutodesc(id) {
	const lang = navigator.language.substr(0,2);
	let response = await fetch('https://tools.wmflabs.org/autodesc/?q=' + id + '&lang=' + lang + '&mode=short&links=text&redlinks=&format=json');
	let json = JSON.parse(await response.text());
	if (!json.result.match(/<i>/)) {
		return json.result;
	} else {
		return '???';
	}
}