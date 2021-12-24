import * as browser from "webextension-polyfill"

import {css} from "@emotion/react"
import {slide as Slider} from 'react-burger-menu'
import {useEffect, useState} from "react"
import {getInternalUrlForEntity} from "../../core/navigation"

export const Container = () => {
    // todo persist this across navigations between links
    const [isOpen, setOpen] = useState(false)
    // todo show a special empty panel instead
    const [url, setUrl] = useState(getInternalUrlForEntity("Q99894727"))

    useEffect(() => {
        const messageCallback = (event) => {
            console.log('runtime event', event)
            if (event.type === 'update-panel-url') {
                setUrl(event.url)
            } else if (event.type === "toggle-sidebar") {
                setOpen(!isOpen)
            }
        }

        browser.runtime.onMessage.addListener(messageCallback)

        return () => browser.runtime.onMessage.removeListener(messageCallback)
    }, [isOpen])

    return <Slider
        isOpen={isOpen}
        width={450}
        right
        noOverlay
        customBurgerIcon={false}
        styles={styles}
        // This is mainly here to ensure that when menu is closed
        // by internal element logic we're aware and maintain proper state
        onClose={() => setOpen(false)}
    >
        {/*{props.children}*/}
        <iframe
            css={css`
              width: 100%;
              height: 100%;
            `}
            src={url}/>
    </Slider>
}

const styles = {
    bmMenu : {
        overflow: "hidden"
    },
    bmCross: {
        background: '#bdc3c7'
    }
}
