⚠️ This project has moved to [a different repository.](https://github.com/fuddl/wikibase-for-web)

# Wikidata browser extension

Get this Extension for [🦊 Firefox](https://addons.mozilla.org/en-US/firefox/addon/wikidata/),
[Chrome](https://chrome.google.com/webstore/detail/wikidata/iijkiilckldlddidhaomggfadfafpdfd)

![ Douglas Adams on Wikipedia with Wikidata for Firefox ](https://upload.wikimedia.org/wikipedia/commons/3/36/Douglas_Adams_on_Wikipedia_with_Wikidata_for_Firefox.png)

## Features

* Display wikidata-Items while browsing the web.
* Add missing IDs/items to Wikidata
* Extract information from websites to wikidata

## Development-Setup

### Build locally

1. Checkout the repository to your local machine eg. with `git clone git@github.com:fuddl/wd.git`
2. run `yarn` to install all required dependencies
3. run `yarn build`

The build step will create the `distribution` folder, this folder will contain the generated extension.

### Run the extension

Using [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) is recommened for automatic reloading and running in a dedicated browser instance. Alternatively you can load the extension manually (see below).

1. run `yarn watch` to watch for file changes and build continuously
2. run `npm install --global web-ext` (only only for the first time)
3. in another terminal, run `web-ext run --start-url https://www.wikidata.org/wiki/Q16276` for Firefox or `web-ext run -t chromium`

Note: Firefox will automatically reload content scripts when the extension is updated, Chrome requires you to reload the page to reload the content scripts.

#### Manually

You can also [load the extension manually in Chrome](https://www.smashingmagazine.com/2017/04/browser-extension-edge-chrome-firefox-opera-brave-vivaldi/#google-chrome-opera-vivaldi) or [Firefox](https://www.smashingmagazine.com/2017/04/browser-extension-edge-chrome-firefox-opera-brave-vivaldi/#mozilla-firefox).

