import browser from 'webextension-polyfill'

function propSelector() {
	const select = document.createElement('select')

	let emptyOption = document.createElement('option');
	select.appendChild(emptyOption);

	let optionAmount = 0;
	const observer = new MutationObserver(async (mutation) => {
		const history = window?.cache?.propSelectionHistory ?? false
		if (!history) {
			return
		}
		if (optionAmount < select.childNodes.length) {
			optionAmount = select.childNodes.length
		} else {
			return
		}
		const index = []
		for (const option of select.childNodes) {
			let prop;
			if (option.hasAttribute('data-prop')) {
				prop = option.getAttribute('data-prop')
			} else {
				prop = option.getAttribute('value')
			}
			index.push({
				prop: prop,
				element: option,
				lastUsed: prop ? history?.[prop] ?? 0 : Date.now() + 1,
			});
		}
		index.sort(function(a, b) {
		 	return a.lastUsed < b.lastUsed ? 1 : -1
		});

		for (const item of index) {
		 	select.appendChild(item.element);
		}
	});
	observer.observe(select, { childList: true });

	select.addEventListener('change', () => {
		const history = window?.cache?.propSelectionHistory ?? {}
		let key = select?.selectedOptions?.[0]?.getAttribute('data-prop') ?? select.value;
		
		history[key] = Date.now()
		browser.storage.local.set({ 'propSelectionHistory': history });
		select.removeChild(emptyOption);
	})

	return select
}

export { propSelector }