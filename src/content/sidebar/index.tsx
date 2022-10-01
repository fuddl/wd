import * as ReactDOM from "react-dom"
import {SidebarWrapper} from "./sidebar-wrapper"
import {Browser} from "../../core/browser"
import * as browser from "webextension-polyfill"

import css from './sidebar.module.css';

export const setupSidebar = async () => {
    let sidebar = document.createElement('wd-sidebar');
    let shadow = sidebar.attachShadow({ mode: 'closed' });
    let style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet')
    style.setAttribute('href',  browser.runtime.getURL('content/sidebar/sidebar.css'))
    
    sidebar.style.setProperty('all', 'revert', 'important')
    
    const key = `sidebar.open${ await Browser.getCurrentTabIdForAllContexts() }`
    const open = await browser.storage.local.get({[key]: false})
    

    ReactDOM.render(<SidebarWrapper initiallyOpen={ open[key] } />, shadow);
    shadow.appendChild(style);
    document.body.appendChild(sidebar);
}
