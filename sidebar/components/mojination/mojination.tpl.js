templates.mojination = (items) => {
	let wrapper = document.createElement('nav');
	wrapper.classList.add('mojination');
	wrapper.classList.add('mojination--hidden');

	for (let item of items) {
		let link = document.createElement('a');
		link.setAttribute('href', item.link);
		link.innerText = item.moji;
		wrapper.appendChild(link);
		link.addEventListener('click', item.callback);
		link.classList.add('mojination__moji');
	}
	document.addEventListener('wheel', (e) => {
		if (window.scrollY === 0 && e.deltaY < -50) {
			wrapper.classList.remove('mojination--hidden');
		} else {
			wrapper.classList.add('mojination--hidden');
		}
	});
	return wrapper;
}