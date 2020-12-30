async function getCurrentTab() {
	let result = await browser.tabs.query({
		currentWindow: true,
		active: true,
	});
	return result[0].id;
}
