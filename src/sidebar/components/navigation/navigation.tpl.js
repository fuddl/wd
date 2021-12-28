import "./navigation.css"

const navigation = () => {

	let wrapper = document.createElement('nav');
	wrapper.classList.add('navigation')

	let back = document.createElement('button');
	back.innerText = '⮜ Back';

	back.addEventListener('click', () => {
		history.back(); 
	});

	wrapper.appendChild(back);
	
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
