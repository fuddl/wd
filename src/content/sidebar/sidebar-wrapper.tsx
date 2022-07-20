import * as browser from "webextension-polyfill"

import {useEffect, useState, useRef} from "react"
import {useBrowserLocalState, useTabLocalState} from "../../core/react"

let initial = true

export const SidebarWrapper = ({ initiallyOpen }) => {
    const frameRef = useRef()

    const [isOpen, setOpen] = useTabLocalState("sidebar.open", initiallyOpen)

    // todo show a loading indicator instead of emptiness
    const [url, setUrl] = useTabLocalState("sidebar.url", "")

    const [width, setWidth] = useBrowserLocalState("sidebar.width", 0)
    const [isLeft, setLeft] = useBrowserLocalState("sidebar.isOnTheLeft", false)
    const [isDragging, setDragging] = useState(false)

    const loaded = frameRef?.current?.getAttribute('src')

    useEffect(() => {
        initial = false
    }, [])

    useEffect(() => {
        const messageCallback = (event) => {
            //console.log('content-script container ev', event)
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
			if (messageIsFromSidebar) {
                if ('data' in event) {
                    // redirect the relevant part of the message to the actual callback
                    messageCallback(event.data)
                }
            }
        }

        browser.runtime.onMessage.addListener(messageCallback)
        window.addEventListener('message', windowMessageCallback)

        return () => {
            browser.runtime.onMessage.removeListener(messageCallback)
            window.removeEventListener('message', windowMessageCallback)
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
    }, [isDragging, setWidth])

    const classes = [
        'sidebar',
        isLeft ? 'sidebar--left' : 'sidebar--right',
        !isOpen ? 'sidebar--closed' : '',
        isDragging ? 'sidebar--dragging' : '',
        !initial ? 'sidebar--initiated' : '',
    ];

    return (
        <>
            { isDragging && <div className="sidebar__background"/> }
            <div
                className={classes.join(' ')}
                style={{ width: width ? `${width}vw` : null }}
                onMouseUp={endDrag}
                onMouseMove={updateDrag}
            >
                { url !== ''  && (
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
