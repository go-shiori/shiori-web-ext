# Shiori Web Extension

Shiori Web Extension is a simple extension for managing bookmarks using Shiori. This extension is intended to integrate Shiori with your favorite web browser. This way, you can save and remove bookmarks in Shiori without switching from your current page.

[![Download button](.github/firefox-addon.png)](https://addons.mozilla.org/en-US/firefox/addon/shiori_ext/)


## Versioning

This project now follows the same versioning system that Shiori uses, that means that starting on `v1.6.0` the extension will match the supported version of the server. This is to avoid confusion and to make it easier to know which version of the extension is compatible with your server.

Different releases for the same server version will be appended as the extension version, for example, `v1.6.0.1` is the first release of the extension for Shiori `v1.6.0`.

## Development Status

This extension is still in beta, however it's already usable at this point. Unfortunately, I've only tested it in Firefox 59+ so there is no guarantee that it will work in another browser.

### Features

If the extension is not set up yet, it will show a message to open the options page to set up the server, username and password.

![Extension not set up](./docs/popup-not-setup.png)

#### Searching bookmarks

You can search your bookmarks using the search bar. The search will be performed in your Shiori instance, so it will return the same results as if you were searching from Shiori web interface.

You can navigate the search results using <kbd>UP</kbd> and <kbd>DOWN</kbd> arrow keys, then open the selected bookmark by pressing <kbd>ENTER</kbd> in a new tab, or in the current tab by pressing <kbd>SHIFT</kbd> + <kbd>ENTER</kbd>.

![Search bookmarks](./docs/popup-search.png)

#### Adding bookmarks

You can add the current page as a bookmark by clicking the `+` button or pressing <kbd>CTRL</kbd> + <kbd>A</kbd> with the popup open.

![Extension adding a new bookmark](./docs/popup-add.png)

## Installation

Download the extension from release page then install it in your favorite browser.

## Initial Setup

Before using the web extension, we need to specify the server, username and password to access our Shiori instance. To do so, you can specify it in extension options page.

In Firefox, open add-ons page (`about:addons`) then choose Shiori Web Extension :

![Options page](https://raw.githubusercontent.com/go-shiori/shiori-web-ext/master/docs/options-1.png)

Next click `Preferences` tab then specify server, username and password :

![Options page, preferences tab](https://raw.githubusercontent.com/go-shiori/shiori-web-ext/master/docs/options-2.png)

Once finished, click login button. If all goes well, it will show the currently active session and the extension is ready to use.

## License

Shiori Web Extension is distributed using [MIT license](https://choosealicense.com/licenses/mit/), which means you can use and modify it however you want. However, if you make an enhancement for it, if possible, please send a pull request. If you like this project, please consider donating to me either via [PayPal](https://www.paypal.me/RadhiFadlillah) or [Ko-Fi](https://ko-fi.com/radhifadlillah).
