import * as ReactDOM from "react-dom"
import {Container} from "./container"

export const setupSidebar = () => {
    const container = document.createElement('div');
    container.classList.add('wd--inline-sidebar-container');

    document.body.prepend(container)
    ReactDOM.render(<Container/>, container);
}
