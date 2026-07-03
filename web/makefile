.PHONY: build
build:
	npm run build

.PHONY: android
android:
	npm run build:android
	npx cap sync android
	npx cap copy android
	cd android && ./gradlew assembleDebug
	~/Downloads/platform-tools/adb install -r android/app/build/outputs/apk/debug/app-debug.apk
	~/Downloads/platform-tools/adb shell monkey -p net.nyantan.app -c android.intent.category.LAUNCHER 1
