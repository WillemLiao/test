$src = "E:\我的笔记\读书笔记\2025\纳瓦尔宝典\Text"
$dst = "E:\我的笔记\读书笔记\2025\纳瓦尔宝典\html"

Get-ChildItem "$src\part*.md" | ForEach-Object {
    $lines = Get-Content $_.FullName
    $title = ""
    $chapterNum = ""
    if ($_.Name -match 'part(\d+)\.md') { $chapterNum = [int]$matches[1] }

    # extract first h1 or h2
    foreach ($line in $lines) {
        if ($line -match '^#\s+(.+)$') { $title = $matches[1]; break }
        if ($line -match '^##\s+(.+)$') { $title = $matches[1]; break }
    }
    if (-not $title) { $title = $_.Name }

    # clean title for filename
    $safeName = $title -replace '[\\/:*?"<>|]', ''
    $safeName = $safeName.Trim()
    if ($safeName.Length -gt 40) { $safeName = $safeName.Substring(0, 40) }
    $outName = "$chapterNum-$safeName.html"
    $outPath = Join-Path $dst $outName

    # remove first heading line from body
    $bodyLines = $lines | Where-Object { $_ -notmatch '^#{1,2}\s' }
    $bodyText = $bodyLines -join "`r`n"

    # html escape
    $bodyText = $bodyText -replace '&', '&amp;'
    $bodyText = $bodyText -replace '<', '&lt;'
    $bodyText = $bodyText -replace '>', '&gt;'

    # bold **text** -> <strong>
    $bodyText = $bodyText -replace '\*\*(.+?)\*\*', '<strong>$1</strong>'
    # italic *text* -> <em>
    $bodyText = $bodyText -replace '(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', '<em>$1</em>'

    # split into paragraphs on blank lines
    $paras = $bodyText -split "`r?`n`r?`n"
    $bodyHtml = ""
    foreach ($para in $paras) {
        $para = $para.Trim()
        if ($para -eq "") { continue }
        # replace single line breaks with <br>
        $para = $para -replace "`r?`n", '<br>'
        $bodyHtml += "<p>$para</p>"
    }

    $html = '<!DOCTYPE html>' + "`r`n"
    $html += '<html lang="zh-CN">' + "`r`n"
    $html += '<head>' + "`r`n"
    $html += '<meta charset="UTF-8">' + "`r`n"
    $html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">' + "`r`n"
    $html += "<title>$title — 纳瓦尔宝典</title>" + "`r`n"
    $html += '<style>' + "`r`n"
    $html += '  * { margin: 0; padding: 0; box-sizing: border-box; }' + "`r`n"
    $html += '  body {' + "`r`n"
    $html += '    font-family: "Noto Serif SC", "Source Han Serif SC", "STSong", "SimSun", "Songti SC", serif;' + "`r`n"
    $html += '    background: #f8f5f0;' + "`r`n"
    $html += '    color: #2c2416;' + "`r`n"
    $html += '    padding: 40px 20px;' + "`r`n"
    $html += '  }' + "`r`n"
    $html += '  .container { max-width: 800px; margin: 0 auto; }' + "`r`n"
    $html += '  .header {' + "`r`n"
    $html += '    text-align: center;' + "`r`n"
    $html += '    padding: 50px 30px 40px;' + "`r`n"
    $html += '    background: linear-gradient(135deg, #3d2b1f 0%, #2a1d14 100%);' + "`r`n"
    $html += '    color: #eadbc5;' + "`r`n"
    $html += '    border-radius: 12px 12px 0 0;' + "`r`n"
    $html += '    position: relative;' + "`r`n"
    $html += '    overflow: hidden;' + "`r`n"
    $html += '  }' + "`r`n"
    $html += '  .header::before {' + "`r`n"
    $html += '    content: "";' + "`r`n"
    $html += '    position: absolute;' + "`r`n"
    $html += '    top: -40px; left: -40px; right: -40px; bottom: -40px;' + "`r`n"
    $html += '    background: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.03) 0%, transparent 50%);' + "`r`n"
    $html += '    opacity: 0.3;' + "`r`n"
    $html += '  }' + "`r`n"
    $html += '  .header h1 { font-size: 26px; font-weight: 700; letter-spacing: 4px; position: relative; }' + "`r`n"
    $html += '  .header .book { font-size: 14px; opacity: 0.6; margin-top: 8px; letter-spacing: 2px; position: relative; }' + "`r`n"
    $html += '  .header .chapter { font-size: 12px; opacity: 0.4; margin-top: 6px; position: relative; }' + "`r`n"
    $html += '  .body {' + "`r`n"
    $html += '    background: #fffcf7;' + "`r`n"
    $html += '    padding: 40px 40px;' + "`r`n"
    $html += '    border-left: 1px solid #e6dccf;' + "`r`n"
    $html += '    border-right: 1px solid #e6dccf;' + "`r`n"
    $html += '    border-bottom: 1px solid #e6dccf;' + "`r`n"
    $html += '    border-radius: 0 0 12px 12px;' + "`r`n"
    $html += '    font-size: 16px;' + "`r`n"
    $html += '    line-height: 2;' + "`r`n"
    $html += '    color: #2c2416;' + "`r`n"
    $html += '    text-align: justify;' + "`r`n"
    $html += '  }' + "`r`n"
    $html += '  .body strong { color: #6b3a2a; }' + "`r`n"
    $html += '  .body em { color: #6b5d4a; }' + "`r`n"
    $html += '  .body p { margin-bottom: 1em; }' + "`r`n"
    $html += '  .footer {' + "`r`n"
    $html += '    text-align: center;' + "`r`n"
    $html += '    padding: 24px;' + "`r`n"
    $html += '    color: #a69580;' + "`r`n"
    $html += '    font-size: 12px;' + "`r`n"
    $html += '    letter-spacing: 2px;' + "`r`n"
    $html += '    margin-top: 40px;' + "`r`n"
    $html += '  }' + "`r`n"
    $html += '  @media (max-width: 600px) {' + "`r`n"
    $html += '    .header h1 { font-size: 20px; }' + "`r`n"
    $html += '    .body { padding: 24px 18px; font-size: 15px; }' + "`r`n"
    $html += '  }' + "`r`n"
    $html += '  @media print {' + "`r`n"
    $html += '    body { background: #fff; padding: 0; }' + "`r`n"
    $html += '    .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }' + "`r`n"
    $html += '  }' + "`r`n"
    $html += '</style>' + "`r`n"
    $html += '</head>' + "`r`n"
    $html += '<body>' + "`r`n"
    $html += '<div class="container">' + "`r`n"
    $html += '  <div class="header">' + "`r`n"
    $html += "    <h1>$title</h1>" + "`r`n"
    $html += '    <div class="book">纳瓦尔宝典</div>' + "`r`n"
    $html += '    <div class="chapter">The Almanack of Naval Ravikant</div>' + "`r`n"
    $html += '  </div>' + "`r`n"
    $html += '  <div class="body">' + "`r`n"
    $html += "    $bodyHtml" + "`r`n"
    $html += '  </div>' + "`r`n"
    $html += '  <div class="footer">— 纳瓦尔宝典 · 章节 —</div>' + "`r`n"
    $html += '</div>' + "`r`n"
    $html += '</body>' + "`r`n"
    $html += '</html>' + "`r`n"

    # write as UTF8 without BOM
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($outPath, $html, $utf8NoBom)
    Write-Output "✔ $outName"
}
