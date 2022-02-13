build:
	web-ext build -s src -a dist

run-firefox:
	web-ext build -s src run -t firefox-desktop

run-chromium:
	web-ext build -s src run -t chromium

lint:
	web-ext lint -s src
