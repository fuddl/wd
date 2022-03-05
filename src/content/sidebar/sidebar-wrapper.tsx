import * as browser from "webextension-polyfill"

import {useEffect, useState, useRef} from "react"
import {useTabLocalState} from "../../core/react"

export const SidebarWrapper = (options) => {
    const wrapperRef = useRef()
    const frameRef = useRef()

    const [isOpen, setOpen] = useState(options.open ?? 0)

    // todo show a loading indicator instead of emptiness
    const [url, setUrl] = useState("")

    useEffect(() => {
        // when the sidebar was opened before navigation occured
        // the url will be empty we need to trigger `findApplicables`
        // there is probably a better way to do that
        if (isOpen && url === '') {
            let event = document.createEvent("HTMLEvents");
            event.initEvent("focus", true, true);
            event.eventName = "focus";
            document.dispatchEvent(event);
        }
    }, [url, isOpen])

    const [width, setWidth] = useState(options.initialWidth ?? 0)
    const [isLeft, setLeft] = useState(options.left ?? false)
    const [isDragging, setDragging] = useState(false)

    const loaded = frameRef?.current?.getAttribute('src');

    useEffect(() => {
        browser.storage.local.set({
            sidebarState: {
                initialWidth: width,
                left: isLeft,
                open: isOpen,
            }
        })
    }, [width, isLeft, isOpen])

    useEffect(() => {

        const messageCallback = (event) => {
            console.log('content-script container ev', event)
            if ('type' in event) {
                if (event.type === 'update-panel-url') {
                    setUrl(event.url)
                } else if (event.type === "toggle-sidebar") {
                    setOpen(!isOpen)
                }
            }
        }

        const windowMessageCallback = (event) => {
            const messageIsFromSidebar = url.startsWith(event.origin)
            if (messageIsFromSidebar && 'data' in event) {
                // redirect the relevant part of the message to the actual callback
                messageCallback(event.data)
            }
        }

        browser.runtime.onMessage.addListener(messageCallback)
        window.addEventListener('message', windowMessageCallback)

        return () => {
            browser.runtime.onMessage.removeListener(messageCallback)
            window.removeEventListener('message', windowMessageCallback)
        }
    }, [isOpen, url])


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
        setDragging(false)
    }

    const startDrag = (event) => {
        setDragging(true)
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
        <>
            { isDragging && <div className="sidebar__background"></div> }
            <div
                className={classes.join(' ')}
                style={{ width: width ? `${width}vw` : null }}
                onMouseUp={endDrag} 
                onMouseMove={updateDrag}
                ref={wrapperRef}
            >
                { url !== '' && (
                    <iframe className="sidebar__frame" frameBorder="0" src={isOpen || loaded ? url : ''} ref={frameRef}/>
                )}
                <div
                    className="sidebar__drag"
                    onMouseDown={startDrag} 
                />
            </div>
        </>
    )
}