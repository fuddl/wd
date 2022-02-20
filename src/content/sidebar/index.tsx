import * as ReactDOM from "react-dom"
import {SidebarWrapper} from "./sidebar-wrapper"
import "@webcomponents/custom-elements"

class WikidataSidebar extends HTMLElement {
  constructor() {
    super();

    var path = chrome.extension.getURL('/content/sidebar/sidebar.css');
    let link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', path);

    const shadow = this.attachShadow({ mode: 'closed' });

    ReactDOM.render(<SidebarWrapper/>, shadow);
    shadow.appendChild(link);
  }
}

customElements.define('wd-sidebar', WikidataSidebar);


export const setupSidebar = () => {
    let sidebar = document.createElement('wd-sidebar');
    document.body.appendChild(sidebar);
}
