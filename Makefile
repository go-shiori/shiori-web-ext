SHIORI_BUNDLE_IDENTIFIER ?= "com.durakiconsulting.shiori"

all:
	@echo $(SHIORI_BUNDLE_IDENTIFIER)
				: '$(SHIORI_BUNDLE_IDENTIFIER)'

build:
	web-ext build -a dist

run-firefox:
	web-ext build run -t firefox-desktop

run-chromium:
	web-ext build run -t chromium

run-safari:
	make all
	xcrun safari-web-extension-converter . \
		--project-location xcprj \
		--app-name Shiori \
		--bundle-identifier $(SHIORI_BUNDLE_IDENTIFIER) \
		--macos-only --force --no-open \

	@echo "All Done. [safari-web-ext @ shiori built] 🙌\n"
	@echo "Execute manually to open XCode Project:"
	@echo "\t$ open xcprj/Shiori/Shiori.xcodeproj"

lint:
	web-ext lint

clean:
	rm -rf xcprj/
