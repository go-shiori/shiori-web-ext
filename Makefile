build:
	web-ext build -a dist

run-firefox:
	web-ext run -t firefox-desktop

run-chromium:
	web-ext run -t chromium

lint:
	web-ext lint
