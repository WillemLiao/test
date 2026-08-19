# -*- coding: utf-8 -*-
"""Wonder · 批量替换 96 个 unit 的 speechSynthesis IIFE → MiMo 播放器
替换：从 `// ===== 英文朗读` 到 IIFE 结尾 `})();` 的整块 → 两个 script 引用
"""
import sys, io, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
WONDER = r"E:\桌面\vebcoding\english\book\Wonder"

NEW_BLOCK = """<script src="wu-data/u%02d.js"></script>
<script src="tts-mimo.js"></script>"""

# 锚点：IIFE 起始注释（96 份一致）
START_ANCHOR = "// ===== 英文朗读（Web Speech API + CSS Highlight"

done = 0
for u in range(1, 97):
    path = os.path.join(WONDER, "wonder_unit_%02d.html" % u)
    src = open(path, encoding='utf-8').read()
    i = src.find(START_ANCHOR)
    if i < 0:
        print(f"unit {u:02d}: 未找到 IIFE 锚点，跳过")
        continue
    # 找到该行所在 <script> 的开始
    script_start = src.rfind("<script>", 0, i)
    if script_start < 0:
        print(f"unit {u:02d}: 未找到 <script> 起点，跳过")
        continue
    # 找到 IIFE 结束 `})();` 后的 </script>
    j = src.find("})();", i)
    if j < 0:
        print(f"unit {u:02d}: 未找到 IIFE 结尾，跳过")
        continue
    script_end = src.find("</script>", j)
    if script_end < 0:
        print(f"unit {u:02d}: 未找到 </script>，跳过")
        continue
    new = NEW_BLOCK % u
    src2 = src[:script_start] + new + src[script_end + len("</script>"):]
    # 清理可能的空行堆积
    open(path, "w", encoding="utf-8", newline="\n").write(src2)
    done += 1
print(f"替换完成: {done}/96")
