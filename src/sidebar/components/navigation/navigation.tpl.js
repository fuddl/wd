const navigation = () => {

	let style = document.createElement('link');
	style.setAttribute('rel', "stylesheet");
	style.setAttribute('href', "components/navigation/navigation.css");


	let wrapper = document.createElement('nav');
	wrapper.classList.add('navigation')

	let back = document.createElement('button');
	back.innerText = '⮜ Back';

	back.addEventListener('click', () => {
		history.back(); 
	});

	wrapper.appendChild(back);
	wrapper.appendChild(style);

	let lastScroll = 0;
	window.addEventListener('scroll', function (e) {
		let thisScroll = this.scrollY;

		let down = lastScroll < thisScroll;

		wrapper.classList.toggle('navigation--shy', down);
		if (down) {
			document.body.style.setProperty('--top-offset', 0);
		} else {
			document.body.style.setProperty('--top-offset', `${wrapper.offsetHeight}px`);
		}

		lastScroll = thisScroll;
	})

	return wrapper;
}

export { navigation }
