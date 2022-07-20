import { navigation } from './components/navigation/navigation.tpl.js';

function PrependNav() {
	if (history.length > 1 || window != window.top) {
		document.body.prepend(navigation());
	}
}

export { PrependNav };