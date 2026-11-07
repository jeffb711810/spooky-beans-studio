#!/bin/bash
# WINCHESTER final in true 4K: every frame rendered natively at 2160x3840 (--scale 2 + post dpr 2), PNG frames, crf 8
# chunks (resumable), joined, then the phone-safe delivery encodes (H.264 High 5.1 / 4.1 with a VBV cap: level 6.0
# broke phone playback on the Bell Witch v1) + a ~9 Mbps two-pass 4K file that fits GitHub's 100 MB limit.
cd "$(dirname "$0")/.."
O=out/final; AU=audio/winchester/audio/mix.wav
BROWSER=${CHROME_PATH:+$BROWSER_PATH}   # optional: Remotion downloads its own headless Chrome when unset
render() { # frames out log
  ps -eo pid,comm | awk '$2 ~ /^chrome/ {print $1}' | xargs -r kill 2>/dev/null
  npx remotion render src/index.ts BellWitch $2 --frames=$1 --scale=2 --props='{"post":{"dpr":2},"v":{"captions":true}}' \
    --image-format=png --codec=h264 --crf=8 --concurrency=3 --timeout=600000 --gl=swangle $BROWSER --log=error > $3 2>&1
}
i=1
for r in 0-149 150-599 600-1049 1050-1499 1500-1949 1950-2349; do
  if [ ! -s $O/k4_chunk$i.mp4 ]; then
    echo "$(date +%T) chunk $i ($r) start" >> $O/progress.txt
    render $r $O/k4_chunk${i}_tmp.mp4 $O/k4log$i.txt
    rc=$?
    if [ $rc -ne 0 ] || [ ! -s $O/k4_chunk${i}_tmp.mp4 ]; then echo "$(date +%T) chunk $i FAILED rc=$rc" >> $O/progress.txt; exit 1; fi
    mv $O/k4_chunk${i}_tmp.mp4 $O/k4_chunk$i.mp4
    echo "$(date +%T) chunk $i DONE" >> $O/progress.txt
  fi
  i=$((i+1))
done
printf "file 'k4_chunk%d.mp4'\n" 1 2 3 4 5 6 > $O/k4_list.txt
ffmpeg -v error -y -f concat -safe 0 -i $O/k4_list.txt -c copy $O/k4_main.mp4
ffmpeg -v error -y -i $O/k4_main.mp4 -i $AU -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -tune animation -crf 16 \
  -maxrate 30M -bufsize 60M -profile:v high -level 5.1 -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart $O/winchester_4K_2160x3840.mp4
echo "$(date +%T) 4K rc=$?" >> $O/progress.txt
ffmpeg -v error -y -i $O/k4_main.mp4 -i $AU -filter_complex "[0:v]scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p[v]" \
  -map "[v]" -map 1:a:0 -c:v libx264 -preset slow -tune animation -crf 17 -maxrate 20M -bufsize 40M -profile:v high -level 4.1 \
  -c:a aac -b:a 192k -shortest -movflags +faststart $O/winchester_1080x1920.mp4
echo "$(date +%T) 1080 rc=$?" >> $O/progress.txt
ffmpeg -v error -y -i $O/k4_main.mp4 -c:v libx264 -preset slow -tune animation -b:v 9M -maxrate 14M -bufsize 28M -profile:v high -level 5.1 -pix_fmt yuv420p -pass 1 -passlogfile $O/p2 -an -f mp4 /dev/null && \
ffmpeg -v error -y -i $O/k4_main.mp4 -i $AU -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -tune animation -b:v 9M -maxrate 14M -bufsize 28M -profile:v high -level 5.1 -pix_fmt yuv420p -pass 2 -passlogfile $O/p2 \
  -c:a aac -b:a 192k -shortest -movflags +faststart $O/winchester_4K_youtube.mp4
echo "$(date +%T) ALL DONE rc=$?" >> $O/progress.txt
