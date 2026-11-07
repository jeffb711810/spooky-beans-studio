# Forced alignment of voice16k.wav against the known script (pocketsphinx 5, bundled en-us model) -> words_raw.json
import json, re, wave, sys
from pocketsphinx import Decoder
SPOKEN = {"1881.": "eighteen eighty one", "1906,": "nineteen oh six", "1922,": "nineteen twenty two", "two-story": "two story", "Thirteen-pane": "thirteen pane", "thirteens.": "thirteens"}
src = open(sys.argv[1]).read().split()
words, spoken = [], []
for w in src:
    s = SPOKEN.get(w, w)
    toks = [re.sub(r"[^a-z']", "", t.lower()).strip("'") for t in s.split()]
    toks = [t for t in toks if t]
    for t in toks:
        spoken.append(t); words.append(w if len(toks) == 1 else f"{w}~{t}")
d = Decoder(samprate=16000)
d.add_word("thirteens", "TH ER T IY N Z", True) if d.lookup_word("thirteens") is None else None
missing = [t for t in set(spoken) if d.lookup_word(t) is None]
print("not in dict:", missing)
d.set_align_text(" ".join(spoken))
w = wave.open("voice16k.wav", "rb"); data = w.readframes(w.getnframes())
d.start_utt(); d.process_raw(data, full_utt=True); d.end_utt()
segs = [(s.word, s.start_frame / 100, s.end_frame / 100) for s in d.seg() if s.word not in ("<s>", "</s>", "<sil>", "[NOISE]")]
print(len(segs), "aligned of", len(spoken))
out = [{"w": words[i], "s": round(segs[i][1], 3), "e": round(segs[i][2], 3)} for i in range(min(len(segs), len(words)))]
json.dump(out, open("words_raw.json", "w"), indent=0)
for o in out[:12] + out[-8:]: print(o)
