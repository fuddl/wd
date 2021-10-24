# Wikidata for Firefox

[Get this Extension for 🦊 Firefox!](https://addons.mozilla.org/en-US/firefox/addon/wikidata/)

![ Douglas Adams on Wikipedia with Wikidata for Firefox ](https://upload.wikimedia.org/wikipedia/commons/3/36/Douglas_Adams_on_Wikipedia_with_Wikidata_for_Firefox.png)

## Features

* Display wikidata-Items while browsing the web.
* Add missing IDs
* Extract information from websites to wikidata

## Development-Setup

```
[sudo] npm install web-ext -g

git clone git@github.com:fuddl/wd.git

cd wd

npm run dev && web-ext run --start-url https://www.wikidata.org/wiki/Q16276
```
