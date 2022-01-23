import * as browser from "webextension-polyfill"

export const getInternalUrlForEntity = (id: string, nocache: boolean = false) =>
    browser.runtime.getURL('sidebar/entity.html') + '?' + id + (nocache ? '#nocache' : '')
