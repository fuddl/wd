import { navigation } from './components/navigation/navigation.tpl.js';

function PrependNav() {
	document.body.prepend(navigation());
}

export { PrependNav };