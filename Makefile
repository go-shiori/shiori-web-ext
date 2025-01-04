build:
	web-ext build -a dist

build-chromium:
	mkdir -p shiori-chromium
	rsync -av css icons js view LICENSE shiori-chromium/
	jq 'del(.background.scripts) | del(.browser_specific_settings) | .background += {service_worker: "js/service-worker.js"}' manifest.json > shiori-chromium/manifest.json
	echo "importScripts('browser-polyfill.js', 'background-script.js');" > shiori-chromium/js/service-worker.js
	sed -i 's#icons#/icons#g' shiori-chromium/js/background-script.js
	web-ext build -s shiori-chromium -a dist

run-firefox:
	web-ext run -t firefox-desktop

run-chromium:
	web-ext run -t chromium

lint:
	web-ext lint
