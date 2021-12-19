import browser from 'webextension-polyfill'

import {css} from "@emotion/react"
import {slide as Slider} from 'react-burger-menu'
import {useState} from "react"

export const Container = (props) => {
    const [isOpen, setOpen] = useState(true)

    // todo PoC
    return <Slider
        isOpen={isOpen}
        width={450}
        right
        noOverlay
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
            src={browser.runtime.getURL('sidebar/entity.html') + '?' + "Q1163227"}/>
    </Slider>
}
