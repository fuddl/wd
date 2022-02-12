import * as ReactDOM from "react-dom"
import {SidebarWrapper} from "./sidebar-wrapper"

class WikidataSidebar extends HTMLElement {
  constructor() {
    super();
    let style = document.createElement('style');
    style.textContent = `
        .sidebar {
            position: fixed;
            right: 0;
            top: 0;
            bottom: 0;
            width: 15vw;
        }
        .sidebar__frame {
            width: calc(100% - 2px);
            height: 100%;
        }
        .sidebar__drag {
            width: 3px;
            border-left: 1px solid #E6E6E6;
            cursor: col-resize;
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
        }
    `;

    const shadow = this.attachShadow({ mode: 'open' });
    const react = document.createDocumentFragment();

    ReactDOM.render(<SidebarWrapper/>, react);
    shadow.appendChild(style);
    shadow.appendChild(react);
  }
}

customElements.define('wd-sidebar', WikidataSidebar);


export const setupSidebar = () => {
    let sidebar = document.createElement('wd-sidebar');
    document.body.appendChild(sidebar);
}
