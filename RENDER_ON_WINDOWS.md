# Render the Winchester video on your Windows PC

Your PC has a graphics card, so it renders much faster than the cloud machine.
Steps 1-3 are one-time setup (about 10 minutes).

## 1. Install Node.js (one time)
1. Go to **https://nodejs.org** and click the big **LTS** download button (Windows Installer, `.msi`).
2. Open the downloaded file and click **Next** through the installer (the default options are fine).

## 2. Get the project
1. Open **https://github.com/jeffb711810/spooky-beans-studio/tree/studio**
2. Click the green **Code** button, then **Download ZIP**.
3. Right-click the ZIP, choose **Extract All...**, and extract it somewhere short, for example `C:\SpookyBeans`.

## 3. Download the video tools into the project (one time, ~2 minutes, ~0.5 GB)
1. Open the extracted folder, then open the **studio** folder inside it.
2. Click the address bar at the top of the window, type `cmd`, and press **Enter**.
   A black Command Prompt window opens in that folder.
3. Type this and press Enter:
   ```
   npm install
   ```

## 4. Render
In the same Command Prompt window, type this and press Enter:
```
npm run final
```
- You'll see `Bundling...`, then a line every 1% like `12%  (282 / 2350 frames)  0h 09m so far, about 1h 05m left`.
  The first run also downloads a small headless Chrome (one time).
- When it says **DONE**, your video is in `studio\out\winchester_4K_2160x3840.mp4`
  (true 4K, with Aiden's narration, the music, all sound effects and captions).
- Keep the PC plugged in and awake (turn off sleep for the render). You can minimise the window.

## Other versions
- `npm run final-1080` - a 1080x1920 version (smaller file, renders about 4x faster).
- `npm run final-safe` - if `npm run final` crashes or freezes partway: same video, renders 2 frames at a time.
- `npm run final-cpu` - only if it fails with a graphics / WebGL error: renders without the graphics card
  (much slower, same result).

## If something goes wrong
Copy the last ~20 lines from the Command Prompt window and send them to Claude.
