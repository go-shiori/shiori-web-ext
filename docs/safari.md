## Building Shiori for Safari

Just a small quick write-up how to compile the extension without much changes to work in Safari as well.

### Toolchain & General Requirements

* Tested on XCode v14.3 running on MacOS Mojave (Macbook Pro M1)
* Install `web-ext` requirements from Shiori's own toolchain
  - `npm install --global web-ext`
* Open `Safari -> Settings` and enable "Develop" (development) Menu Bar
* Again, in Safari, press the newly `Develop` menubar and enable `Allow Unsigned Extensions`
* Quit Safari and head over to `shiori-web-ext` repository

### Building Shiori

Clone the repository as usual;

```sh
$ git clone https://github.com/go-shiori/shiori-web-ext.git
$ cd shiori-web-ext
```

The `Makefile` should, with this branch, contain a `run-safari` make handler.

```sh
$ cat Makefile | grep Safari -C 2
# ...
# run-safari:
#	  xcrun safari-web-extension-converter . --project-location xcprj/ --app-name Shiori --bundle-identifier com.durakiconsulting.shiori --macos-only --force
```

You need to set `ENV` variable `SHIORI_BUNDLE_IDENTIFIER` to your bundle identifier, using classical bundle identifier naming convention, such is `ext.yourcompanyname.shiori`. This identifier can be passed during make (defaults to `'com.durakiconsulting.shiori'`).

```sh
$ make run-safari     # bundles with default identifier
    
              # ... OR ...

$ make run-safari SHIORI_BUNDLE_IDENTIFIER=com.yourcompanyname.shiori

# ...
# make all
# ...

# Xcode Project Location: $(PWD)/xcprj
# App Name: Shiori
# App Bundle Identifier: com.yourcompanyname.shiori
# Platform: macOS
# Language: Swift
# 
# All Done. [safari-web-ext @ shiori built] 🙌
# 
# Execute manually to open XCode Project:
#	  open xcprj/Shiori/Shiori.xcodeproj
```

Upon successful Safari build pipeline, you will end up with `xcprj/` directory in the repository root directory. Enter the command seen in the Terminal output:

```sh
$ open xcprj/Shiori/Shiori.xcodeproj
# ... XCode will open ...
```

### Compiling via XCode

Once in XCode, run `Shift + Cmd + R` (`Product => Build For => Running` via Menu) to build release version and generate application product. 
Once the above finished, click `Product => Show Build folder in Finder` and enter `Product/Debug/` directory from inside the Finder and you should see `Shiori.app`.

![](/docs/safari-product-extbuild.png)

### Running

Open the built Shiori application and follow the screen instructions.

![](/docs/safari-enable-shiori-ext.png)

Once enabled, you can click `Settings` button for Shiori, or right-click on Shiori toolbar icon, and click `Manage Extension`. This will open Shiori Session settings where you will enter your server URL and username and password combo.

![](/docs/safari-ext-usage-settings.png)

**Note:** Be free to move the built Shiori extension to your `/Applications` directory to enjoy bugs free deployment on your Host OS.

**Note:** You can use `make clean` to cleanup your build directory and XCode project as to not take space on your disk.


