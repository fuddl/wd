import * as ReactDOM from "react-dom"
import retargetEvents from 'react-shadow-dom-retarget-events';
import {SidebarWrapper} from "./sidebar-wrapper"
import "@webcomponents/custom-elements"

class WikidataSidebar extends HTMLElement {
  constructor() {
    super();
    let style = document.createElement('style');

    // i'd rather source this from a seperate file, but I didn't see
    // a way to do that inside the shadowDOM
    style.textContent = `
        .sidebar {
            position: fixed;
            top: 0;
            bottom: 0;
        }
        @media (prefers-reduced-motion: no-preference) {
            .sidebar {
                transition: .25s transform;
            }
        }

        .sidebar--right {
            right: 0;
        }

        .sidebar--left {
            left: 0;
        }

        .sidebar--right.sidebar--closed {
            transform: translateX(100%)
        }
        .sidebar--left.sidebar--closed {
            transform: translateX(-100%)
        }
        .sidebar__frame {
            width: 100%;
            height: 100%;
        }
        .sidebar__background {
            cursor: col-resize;
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
        }
        .sidebar__drag {
            width: 3px;
            cursor: col-resize;
            position: absolute;
            top: 0;
            bottom: 0;
            border: 0 solid #E6E6E6;
        }
        @media (prefers-color-scheme: dark) {
            .sidebar__drag {
                border-color: #44464A;
            }
        }
        .sidebar--right > .sidebar__drag {
            border-left-width: 1px;
            left: 0;
        }
        .sidebar--left > .sidebar__drag {
            border-right-width: 1px;
            right: 0;
        }
        .sidebar--dragging {
            cursor: col-resize;
            user-select: none;
        }
        .sidebar--dragging > .sidebar__frame {
            pointer-events: none;
        }
        @media (prefers-reduced-motion) {
            .sidebar--dragging > .sidebar__frame {
                opacity: 0;
            }
            .sidebar--dragging > .sidebar__drag {
                background: #a7d7f9;
                border: none;
            }
            .sidebar--dragging {
                background: #a7d7f955;
            }
        }
    `;

    const shadow = this.attachShadow({ mode: 'open' });

    ReactDOM.render(<SidebarWrapper/>, shadow);
    retargetEvents(shadow);
    shadow.appendChild(style);
  }
}

customElements.define('wd-sidebar', WikidataSidebar);


export const setupSidebar = () => {
    let sidebar = document.createElement('wd-sidebar');
    document.body.appendChild(sidebar);
}
