import * as browser from "webextension-polyfill"

import {useEffect, useState, useRef} from "react"
import {useTabLocalState} from "../../core/react"

export const SidebarWrapper = () => {
    const ref = useRef()

    const [isOpen, setOpen] = useTabLocalState("sidebarOpen", false)

    // the iframe should be rendered as soon as `isOpen` is true but
    // when `isOpen` becomes `false` the iframe should only dissapear
    // after the hiding animation is completed 
    const [showIFrame, setShowIFrame] = useState(isOpen)

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

        if (isOpen) {
            setShowIFrame(true)
        } else {
            ref.current.addEventListener('transitionend', () => {
                if (ref.current.classList.contains('sidebar--closed')) {
                    setShowIFrame(false)
                    ref.current.removeListener('transitionend', this);
                }
            })
            // hide iFrame after 5s in case transitions are disabled or not supported
            setTimeout(() => {
                if (ref.current.classList.contains('sidebar--closed')) {
                    setShowIFrame(false)
                }
            }, 5000);
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
                style={{ width: width > -1 ? `${width}vw` : null }}
                onMouseUp={endDrag} 
                onMouseMove={updateDrag}
                ref={ref}
            >
                {/* 
                    creating `<iframe src="">` and changing its `src` in a separate
                    step will cause firefox to create a new hostory item issue #59.
                    so we only create the iframe (and everything else) if there 
                    is a src.
                */}
                { url !== '' && showIFrame && (
                    <iframe className="sidebar__frame" frameBorder="0" src={url}/>
                )}
                <div
                    className="sidebar__drag"
                    onMouseDown={startDrag} 
                />
            </div>
        </>
    )
}