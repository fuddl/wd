import * as browser from "webextension-polyfill"

import {useEffect, useState} from "react"
import {useTabLocalState} from "../../core/react"

export const SidebarWrapper = () => {
    const [isOpen, setOpen] = useTabLocalState("sidebarOpen", false)
    // todo show a loading indicator instead of emptiness
    const [url, setUrl] = useState("")

    const [width, setWidth] = useState(15)
    const [isLeft, setLeft] = useState(false)
    const [isDragging, setDragging] = useState(false)

    useEffect(() => {
        const messageCallback = (event) => {
            console.log('content-script container ev', event)
            if (event.type === 'update-panel-url') {
                setUrl(event.url)
            // unfortunatly the messages send by Window.postMessage() have a slightly 
            // different structure than the messages send by the browser api
            //
            // we should probably make sure that the message was send by the
            // url in `url` since every website can post a message like this
            } else if (event.type === "toggle-sidebar" || event.data.type === "toggle-sidebar") {
                setOpen(!isOpen)
            }
        }

        browser.runtime.onMessage.addListener(messageCallback)
        window.addEventListener('message', messageCallback)

        return () => {
            browser.runtime.onMessage.removeListener(messageCallback)
            window.removeEventListener('message', messageCallback)
        }
    }, [isOpen, setOpen])


    const updateDrag = (event) => {
        if (isDragging) {
            const newWidth = event.clientX * 100 / window.innerWidth;
            if (newWidth > 50) {
                setLeft(false);
                setWidth(100 - newWidth);
            } else {
                setLeft(true);
                setWidth(newWidth);
            }
        }
    }

    const endDrag = () => {
        if (isDragging) {
           setDragging(false)
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
    }

    const startDrag = (event) => {
        setDragging(true)
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    useEffect(() => {
        document.addEventListener('mousemove', updateDrag)
        document.addEventListener('mouseup', endDrag)
        return () => {
            document.removeEventListener('mousemove', updateDrag)
            document.removeEventListener('mouseup', endDrag)
        }
    }, [isDragging])

    const classes = [
        'sidebar',
        isLeft ? 'sidebar--left' : 'sidebar--right',
        !isOpen ? 'sidebar--closed' : '',
        isDragging ? 'sidebar--dragging' : '',
    ];

    return (
        <div
            className={classes.join(' ')}
            style={{ width: width > -1 ? `${width}vw` : null }}
            onMouseUp={endDrag} 
            onMouseMove={updateDrag} 
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
            <div
                className="sidebar__drag"
                onMouseDown={startDrag} 
            />
        </div>
    )
}