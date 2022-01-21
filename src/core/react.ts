import {useCallback, useEffect, useState} from "react"
import * as browser from "webextension-polyfill"
import {Browser} from "./browser"

export function useBrowserLocalState<T>(name: string, initial: T): [T, (value: T) => void]
export function useBrowserLocalState<T = undefined>(name: string, initial?: T): [T | undefined, (value: T | undefined) => void] {
    const storage = browser.storage.local
    const [get, set] = useState(initial)

    useEffect(() => {
        (async () => {
            const result = await storage.get({[name]: initial})
            set(result[name])
        })()
    }, [name])

    /**
     * Need to wrap it in useCallback, so elsewhere `useEffect` and such can depend on this
     * changing based on name change
     */
    const setCallback = useCallback((value: T) => {
        set(value)
        return storage.set({[name]: value})
    }, [name])

    return [get, setCallback]
}


export function useTabLocalState<T>(name: string, initial: T): [T, (value: T) => void]
export function useTabLocalState<T = undefined>(name: string, initial?: T): [T | undefined, (value: T | undefined) => void] {
    const [tabId, setTabId] = useState<number>(null)

    useEffect(() => {
        (async () => {
            setTabId(await Browser.getCurrentTabIdForAllContexts())
        })()
    }, [])

    return useBrowserLocalState(name + tabId, initial)
}
