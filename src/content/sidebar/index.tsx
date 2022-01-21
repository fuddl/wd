import * as ReactDOM from "react-dom"
import {SidebarWrapper} from "./sidebar-wrapper"

export const setupSidebar = () => {
    const container = document.createElement('div');
    container.classList.add('wd--inline-sidebar-container');

    document.body.prepend(container)
    ReactDOM.render(<SidebarWrapper/>, container);
}
