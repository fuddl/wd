import * as ReactDOM from "react-dom"
import {SidebarWrapper} from "./sidebar-wrapper"

import css from './sidebar.module.css';

export const setupSidebar = () => {
    let sidebar = document.createElement('wd-sidebar');
    let shadow = sidebar.attachShadow({ mode: 'closed' });
    let style = document.createElement('style');
    style.innerText = css;

    ReactDOM.render(<SidebarWrapper/>, shadow);
    shadow.appendChild(style);
    document.body.appendChild(sidebar);
}
