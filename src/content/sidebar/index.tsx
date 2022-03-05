import * as ReactDOM from "react-dom"
import {SidebarWrapper} from "./sidebar-wrapper"

import css from './sidebar.module.css';

export const setupSidebar = async () => {
    let sidebar = document.createElement('wd-sidebar');
    let shadow = sidebar.attachShadow({ mode: 'closed' });
    let style = document.createElement('style');
    style.innerText = css;

    const lastState = await browser.storage.local.get("sidebarState");

    ReactDOM.render(<SidebarWrapper { ...lastState.sidebarState } />, shadow)
    shadow.appendChild(style)
    document.body.appendChild(sidebar);
}
