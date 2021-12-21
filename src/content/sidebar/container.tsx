import * as browser from "webextension-polyfill"

import {css} from "@emotion/react"
import {slide as Slider} from 'react-burger-menu'
import {useEffect, useState} from "react"
import {getInternalUrlForEntity} from "../../core/navigation"

export const Container = (props) => {
    const [isOpen, setOpen] = useState(true)
    // todo show a special empty panel instead
    const [url, setUrl] = useState(getInternalUrlForEntity("Q99894727"))

    /**
     * one option would be to update the current logic in bg to send message to a tab
     * another one is to short-circuit things and just send a js event,
     * but not entirely sure if that works across iframe
     *
     * went with option 1 for now, though the whole round-trip thing is kind-of awkward
     */

    useEffect(() => {
        browser.runtime.onMessage.addListener((event, sender) => {
            console.log('eep', event)
            if (event.type === 'update-panel-url') {
                setUrl(event.url)
            }
        })

    }, [])

    return <Slider
        isOpen={isOpen}
        width={450}
        right
        noOverlay
        customBurgerIcon={false}
        styles={styles}
        customOnKeyDown={(e) => {
            if (e.key === 'Escape') {
                setOpen(false)
            }
        }}
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
