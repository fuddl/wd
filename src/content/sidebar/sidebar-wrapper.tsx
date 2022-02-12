import * as browser from "webextension-polyfill"

import {useEffect, useState} from "react"
import {useTabLocalState} from "../../core/react"

export const SidebarWrapper = () => {
    const [isOpen, setOpen] = useTabLocalState("sidebarOpen", false)
    // todo show a loading indicator instead of emptiness
    const [url, setUrl] = useState("")
    const [width, setWidth] = useState(-1)
    const [left, setLeft] = useState(false)

    useEffect(() => {
        const messageCallback = (event) => {
            console.log('content-script container ev', event)
            if (event.type === 'update-panel-url') {
                setUrl(event.url)
            } else if (event.type === "toggle-sidebar") {
                setOpen(!isOpen)
            }
        }

        browser.runtime.onMessage.addListener(messageCallback)

        return () => browser.runtime.onMessage.removeListener(messageCallback)
    }, [isOpen, setOpen])

    const classes = [
        'sidebar',
        left ? 'sidebar--left' : 'sidebar--right',
    ];

    return (
        <div
            className={classes.join(' ')}
            style={{ width: width > -1 ? `${width}px` : null }}
        >
            {/* 
                creating `<iframe src="">` and changing its `src` in a separate
                step will cause firefox to create a new hostory item issue #59.
                so we only create the iframe (and everything else) if there 
                is a src.
            */}
            { url !== '' && (
                <iframe className="sidebar__frame" frameBorder="0" src={url}/>
            )}
            <div className="sidebar__drag" />
        </div>
    )
}