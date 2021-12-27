import { navigation } from './components/navigation/navigation.tpl.js';

function PrependNav() {
	document.body.insertBefore(navigation(), document.body.firstChild);
}

export { PrependNav };