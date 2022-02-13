build:
	web-ext build -a dist

run-firefox:
	web-ext build run -t firefox-desktop

run-chromium:
	web-ext build run -t chromium

lint:
	web-ext lint
