import * as ReactDOM from "react-dom"
import {SidebarWrapper} from "./sidebar-wrapper"

export const setupSidebar = () => {
    let sidebar = document.createElement('wd-sidebar');
    let shadow = sidebar.attachShadow({ mode: 'closed' });
    let link = document.createElement('link');
    const path = chrome.extension.getURL('/content/sidebar/sidebar.css');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', path);

    ReactDOM.render(<SidebarWrapper/>, shadow);
    shadow.appendChild(link);
    document.body.appendChild(sidebar);
}
