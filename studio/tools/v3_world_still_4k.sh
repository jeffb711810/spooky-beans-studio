#!/bin/bash
cd "$(dirname "$0")/.."
export TEMP=/home/user/remotion-tmp2 TMP=/home/user/remotion-tmp2
CHROME=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
P='{"post":{"dpr":2},"captions":false,"look3":{"pos":[-897.8,1.0,44],"look":[-899.2,5.0,0],"fov":26,"noCast":true,"focus":[-898.4,0.8,32],"cInf":7}}'
npx remotion still src/index.ts BellWitch out/v3/world_4k.png --frame=30 --props="$P" --scale=2 --timeout=600000 --gl=swangle --browser-executable=$CHROME > out/v3/world.log 2>&1
echo "WORLD EXIT $?" >> out/v3/world.log
