# -*- coding: utf-8 -*-
"""Wonder · 批量生成 MiMo 句子音频（audio/wonder/uNN/sXXXX.mp3）
用法：python gen_audio_wonder.py [起始unit] [结束unit] [并发数]
- 断点续传：已存在且 >1KB 跳过；失败重试 3 次；风格指令「英文小说旁白」
"""
import base64, json, os, sys, io, time, glob
from concurrent.futures import ThreadPoolExecutor, as_completed
import httpx
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

KEY = "sk-cpg8vn4iqptmyjirbmq6oa0mgu821lrw3hp1rgemkwrlyohc"
URL = "https://api.xiaomimimo.com/v1/chat/completions"
STYLE = "朗读英文小说旁白，语气平静、清晰、自然"
WONDER = r"E:\桌面\vebcoding\english\book\Wonder"
WUDATA = os.path.join(WONDER, "wu-data")

def items_for(cids):
    items = []
    for u in cids:
        path = os.path.join(WUDATA, "u%02d.js" % u)
        if not os.path.exists(path):
            continue
        src = open(path, encoding='utf-8').read()
        data = json.loads(src.split("window.WU_DATA = ", 1)[1].rstrip().rstrip(';'))
        n = 0
        for seg in data["segs"]:
            for p in seg["paras"]:
                for s in p["sents"]:
                    n += 1
                    items.append({"u": u, "n": n, "t": s["t"]})
    return items

def synth_one(it):
    out = os.path.join(WONDER, "audio", "wonder", "u%02d" % it["u"], "s%04d.mp3" % it["n"])
    if os.path.exists(out) and os.path.getsize(out) > 1024:
        return it["u"], it["n"], "skip"
    body = {
        "model": "mimo-v2.5-tts",
        "messages": [
            {"role": "user", "content": STYLE},
            {"role": "assistant", "content": it["t"]},
        ],
        "stream": False,
        "audio": {"format": "mp3", "voice": "Chloe"},
    }
    last_err = None
    for attempt in range(3):
        try:
            with httpx.Client(timeout=180.0) as client:
                r = client.post(URL, headers={"api-key": KEY, "Content-Type": "application/json"}, json=body)
            if r.status_code == 200:
                data = r.json()["choices"][0]["message"]["audio"]["data"]
                with open(out, "wb") as f:
                    f.write(base64.b64decode(data))
                return it["u"], it["n"], "ok"
            last_err = f"HTTP {r.status_code}: {r.text[:200]}"
        except Exception as e:
            last_err = str(e)[:200]
        time.sleep(2 * (attempt + 1))
    return it["u"], it["n"], "FAIL " + str(last_err)

if __name__ == "__main__":
    nums = [int(a) for a in sys.argv[1:] if a.isdigit()]
    WORKERS = nums.pop() if nums and nums[-1] in (3, 4, 5, 6, 8, 10, 12) else 6
    if len(nums) >= 2:
        cids = list(range(nums[0], nums[1] + 1))
    elif len(nums) == 1:
        cids = [nums[0]]
    else:
        cids = list(range(1, 97))
    items = items_for(cids)
    for u in cids:
        os.makedirs(os.path.join(WONDER, "audio", "wonder", "u%02d" % u), exist_ok=True)

    def have(it):
        p = os.path.join(WONDER, "audio", "wonder", "u%02d" % it["u"], "s%04d.mp3" % it["n"])
        return os.path.exists(p) and os.path.getsize(p) > 1024
    todo = [it for it in items if not have(it)]
    print(f"units {cids[0]}..{cids[-1]}: 共 {len(items)} 句，待生成 {len(todo)} 句（并发 {WORKERS}）")
    ok = fail = skip = 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(synth_one, it): it for it in todo}
        done = 0
        for fut in as_completed(futs):
            u, n, st = fut.result()
            done += 1
            if st == "ok": ok += 1
            elif st == "skip": skip += 1
            else:
                fail += 1
                if fail <= 10: print(f"  [{st}] u{u:02d} s{n:04d}")
            if done % 100 == 0 or done == len(todo):
                el = time.time() - t0
                print(f"  进度 {done}/{len(todo)}  ok={ok} fail={fail}  用时 {el:.0f}s")
    print(f"完成: ok={ok} skip={skip} fail={fail}  总用时 {time.time()-t0:.0f}s")
