#!/bin/bash
cd "$(dirname "$0")/.."
BROWSER=${CHROME_PATH:+$BROWSER_PATH}   # optional: Remotion downloads its own headless Chrome when unset
npx remotion render src/index.ts BellWitch out/prev/prev.mp4 --scale=0.25 --props='{"v":{"captions":false}}' \
  --image-format=jpeg --jpeg-quality=90 --codec=h264 --crf=16 --concurrency=3 --timeout=600000 --gl=swangle $BROWSER --log=info > out/prev/log.txt 2>&1
echo "PREV EXIT $?" >> out/prev/log.txt
