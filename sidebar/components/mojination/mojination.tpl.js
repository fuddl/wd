templates.mojination = (items) => {
	let wrapper = document.createElement('nav');
	wrapper.classList.add('mojination');
	wrapper.classList.add('mojination--hidden');

	for (let item of items) {
		let link = document.createElement('a');
		link.setAttribute('href', item.link);
		link.innerText = item.moji;
		wrapper.appendChild(link);
		if (item.callback) {
			link.addEventListener('click', item.callback);
		}
		link.classList.add('mojination__moji');
	}
	document.addEventListener('wheel', (e) => {
	if (e.deltaX < -20) {
		wrapper.classList.remove('mojination--hidden');
	} 
	if (e.deltaY != 0) {
		wrapper.classList.add('mojination--hidden');
	}
	});
	return wrapper;
}