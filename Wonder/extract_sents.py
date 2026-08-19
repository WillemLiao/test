# -*- coding: utf-8 -*-
"""Wonder · 解析 96 个 unit HTML → 句映射数据（wu-data/uNN.js）
每个 unit：segs[{i, paras:[{k, sents:[{s,e,t}]}]}]，s/e 为句在 p 文本内的字符偏移
（与前端 CSS Highlight 对齐；音频按 unit 内句序编号 s0001..）
"""
import sys, io, re, os, json, glob, html
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

WONDER = r"E:\桌面\vebcoding\english\book\Wonder"
OUT = os.path.join(WONDER, "wu-data")
os.makedirs(OUT, exist_ok=True)

def sentence_bounds(text):
    """在原始文本上按 .!?… 切句；切不精确整段当一句（与前端高亮偏移一致）"""
    parts = re.findall(r'[^.!?…]+[.!?…]*', text)
    if ''.join(parts) != text:
        return [(0, len(text))]
    pos = 0
    out = []
    for p in parts:
        out.append((pos, pos + len(p)))
        pos += len(p)
    return out

def clean_ws(text):
    return re.sub(r'\s+', ' ', text).strip()

total_s = 0
for u in range(1, 97):
    path = os.path.join(WONDER, "wonder_unit_%02d.html" % u)
    if not os.path.exists(path):
        print("缺失:", path)
        continue
    src = open(path, encoding='utf-8').read()
    segs = []
    for sm in re.finditer(r'<section class="segment" id="seg-(\d+)"(.*?)</section>', src, re.S):
        sid = int(sm.group(1))
        body = sm.group(2)
        paras = []
        for pm in re.finditer(r'<p>(.*?)</p>', body, re.S):
            # 保留原始空白（含实体还原），偏移必须与浏览器 textContent 一致
            raw = html.unescape(re.sub(r'<[^>]+>', '', pm.group(1)))
            if len(raw.strip()) < 3:
                continue
            sents = []
            for s, e in sentence_bounds(raw):
                t = clean_ws(raw[s:e])
                if len(t) >= 2:
                    sents.append({"s": s, "e": e, "t": t})
            if sents:
                paras.append({"k": len(paras), "sents": sents})
        if paras:
            segs.append({"i": sid, "paras": paras})
    n = sum(len(p["sents"]) for g in segs for p in g["paras"])
    total_s += n
    js = "// generated — 句子映射（MiMo 音频用）\nwindow.WU_DATA = " + json.dumps(
        {"u": u, "segs": segs}, ensure_ascii=False) + ";\n"
    with open(os.path.join(OUT, "u%02d.js" % u), "w", encoding="utf-8", newline="\n") as f:
        f.write(js)
    print(f"unit {u:02d}: {len(segs)} 段 / {n} 句")
print(f"\n合计 {total_s} 句")
