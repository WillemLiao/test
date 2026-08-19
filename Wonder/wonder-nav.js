// wonder-nav.js · 全自动整书左侧导航（96 单元 / 8 部）
// 由脚本注入 CSS + DOM，无需在页面 HTML 里写导航结构
(function(){
  var UNITS = {"1":{"file":"wonder_unit_01.html","num":1,"zh":"普通男孩奥吉","en":"Ordinary + Why I Didn’t Go to School · 851 词 · 约 11 分钟"},"2":{"file":"wonder_unit_02.html","num":2,"zh":"妈妈讲我从出生到决定上学的故事","en":"How I Came to Life + Christopher’s House · 1131 词 · 约 14 分钟"},"3":{"file":"wonder_unit_03.html","num":3,"zh":"深夜回家路上，偷听到爸妈的争论","en":"Driving · 673 词 · 约 8 分钟"},"4":{"file":"wonder_unit_04.html","num":4,"zh":"爸妈瞒了我一年的入学秘密","en":"Driving · 667 词 · 约 8 分钟"},"5":{"file":"wonder_unit_05.html","num":5,"zh":"第一次见到图什曼先生和加西亚太太","en":"Paging Mr. Tushman + Nice Mrs. Garcia · 1118 词 · 约 14 分钟"},"6":{"file":"wonder_unit_06.html","num":6,"zh":"喜欢上校长的办公室，开始僵住","en":"Jack Will, Julian, and Charlotte · 703 词 · 约 9 分钟"},"7":{"file":"wonder_unit_07.html","num":7,"zh":"来不及拒绝，三个同学已经到了","en":"Jack Will, Julian, and Charlotte · 735 词 · 约 9 分钟"},"8":{"file":"wonder_unit_08.html","num":8,"zh":"三个同学带着我逛学校","en":"The Grand Tour · 721 词 · 约 9 分钟"},"9":{"file":"wonder_unit_09.html","num":9,"zh":"表演厅里的冒犯与一句温暖的反击","en":"The Performance Space · 1102 词 · 约 14 分钟"},"10":{"file":"wonder_unit_10.html","num":10,"zh":"道别后回家，妈妈心疼到脸红","en":"The Deal + Home · 1078 词 · 约 13 分钟"},"11":{"file":"wonder_unit_11.html","num":11,"zh":"开学第一天，我紧张成一只鸽子","en":"First-Day Jitters · 641 词 · 约 8 分钟"},"12":{"file":"wonder_unit_12.html","num":12,"zh":"教室里的空座位，没人敢坐我旁边","en":"Locks · 615 词 · 约 8 分钟"},"13":{"file":"wonder_unit_13.html","num":13,"zh":"大家轮流介绍自己，奥吉躲在后排","en":"Locks + Around the Room · 1101 词 · 约 14 分钟"},"14":{"file":"wonder_unit_14.html","num":14,"zh":"待宰的羔羊，还有那句刺人的话","en":"Lamb to the Slaughter · 369 词 · 约 5 分钟"},"15":{"file":"wonder_unit_15.html","num":15,"zh":"布朗老师的神秘“箴言”，唯一没提的东西","en":"Choose Kind · 1077 词 · 约 13 分钟"},"16":{"file":"wonder_unit_16.html","num":16,"zh":"午餐时分，一个人嚼三明治","en":"Lunch · 545 词 · 约 7 分钟"},"17":{"file":"wonder_unit_17.html","num":17,"zh":"夏天之桌：第一个主动坐过来的女孩","en":"The Summer Table · 618 词 · 约 8 分钟"},"18":{"file":"wonder_unit_18.html","num":18,"zh":"一百分，我打五分：第一天回家","en":"One to Ten · 636 词 · 约 8 分钟"},"19":{"file":"wonder_unit_19.html","num":19,"zh":"剪掉辫子那晚，爸爸来陪我说话","en":"Padawan · 998 词 · 约 12 分钟"},"20":{"file":"wonder_unit_20.html","num":20,"zh":"九月开学，人人都在偷看我","en":"Wake Me Up when September Ends + Jack Will · 994 词 · 约 12 分钟"},"21":{"file":"wonder_unit_21.html","num":21,"zh":"十月格言和一场缺了席的生日保龄球","en":"Mr. Browne’s October Precept + Apples · 722 词 · 约 9 分钟"},"22":{"file":"wonder_unit_22.html","num":22,"zh":"万圣节变装，和那张不想拍的照片","en":"Halloween + School Pictures · 676 词 · 约 8 分钟"},"23":{"file":"wonder_unit_23.html","num":23,"zh":"没人愿意碰我的“奶酪怪”","en":"The Cheese Touch · 565 词 · 约 7 分钟"},"24":{"file":"wonder_unit_24.html","num":24,"zh":"万圣节：戴上头盔才能做回普通人","en":"Costumes · 786 词 · 约 10 分钟"},"25":{"file":"wonder_unit_25.html","num":25,"zh":"面具下，我听见了他们怎么说我","en":"The Bleeding Scream · 690 词 · 约 9 分钟"},"26":{"file":"wonder_unit_26.html","num":26,"zh":"锁在厕所里哭，然后装病回家","en":"Names · 468 词 · 约 6 分钟"},"27":{"file":"wonder_unit_27.html","num":27,"zh":"太阳奥吉统治下的家庭宇宙","en":"A Tour of the Galaxy + Before August · 881 词 · 约 11 分钟"},"28":{"file":"wonder_unit_28.html","num":28,"zh":"外婆的最后一句话：你是我的全部","en":"Seeing August · 990 词 · 约 12 分钟"},"29":{"file":"wonder_unit_29.html","num":29,"zh":"透过小孔，我看见两个奥吉","en":"August Through the Peephole · 864 词 · 约 11 分钟"},"30":{"file":"wonder_unit_30.html","num":30,"zh":"走进新学校，我只想做平凡的我","en":"High School · 649 词 · 约 8 分钟"},"31":{"file":"wonder_unit_31.html","num":31,"zh":"新学期，米兰达变了，我的谎也越编越顺","en":"Major Tom + After School · 1096 词 · 约 14 分钟"},"32":{"file":"wonder_unit_32.html","num":32,"zh":"妈妈深夜站在奥吉房门口，像一抹幽灵","en":"The Padawan Bites the Dust + An Apparition at the Door · 806 词 · 约 10 分钟"},"33":{"file":"wonder_unit_33.html","num":33,"zh":"早餐桌上的地铁之争","en":"Breakfast · 743 词 · 约 9 分钟"},"34":{"file":"wonder_unit_34.html","num":34,"zh":"解析家族相册，诊断一块坏基因","en":"Genetics 101 + The Punnett Square · 779 词 · 约 10 分钟"},"35":{"file":"wonder_unit_35.html","num":35,"zh":"与旧友分道，万圣节独自想外婆","en":"Out with the Old + October 31 · 971 词 · 约 12 分钟"},"36":{"file":"wonder_unit_36.html","num":36,"zh":"万圣节之夜，奥吉说出杰克背叛的真相","en":"Trick or Treat · 753 词 · 约 9 分钟"},"37":{"file":"wonder_unit_37.html","num":37,"zh":"姐姐劝回弟弟，妈妈却漏听了米兰达的下落","en":"Time to Think · 993 词 · 约 12 分钟"},"38":{"file":"wonder_unit_38.html","num":38,"zh":"萨默为什么总和奥吉同桌吃饭","en":"Weird Kids + The Plague · 637 词 · 约 8 分钟"},"39":{"file":"wonder_unit_39.html","num":39,"zh":"万圣节派对上的“友情考验”","en":"The Halloween Party · 832 词 · 约 10 分钟"},"40":{"file":"wonder_unit_40.html","num":40,"zh":"僵掉的午饭：奥吉信了别人的谣言","en":"November · 755 词 · 约 9 分钟"},"41":{"file":"wonder_unit_41.html","num":41,"zh":"奥吉第一次来家里：关于脸与来世","en":"Warning: This Kid Is Rated R · 883 词 · 约 11 分钟"},"42":{"file":"wonder_unit_42.html","num":42,"zh":"埃及博物馆之夜与那个秘密提示","en":"The Egyptian Tomb · 539 词 · 约 7 分钟"},"43":{"file":"wonder_unit_43.html","num":43,"zh":"妈妈接来的那个电话","en":"The Call · 615 词 · 约 8 分钟"},"44":{"file":"wonder_unit_44.html","num":44,"zh":"冰淇淋店前第一次见到奥吉","en":"Carvel · 700 词 · 约 9 分钟"},"45":{"file":"wonder_unit_45.html","num":45,"zh":"杰克改变主意的原因，与奥吉的四个亮点","en":"Why I Changed My Mind + Four Things · 1116 词 · 约 14 分钟"},"46":{"file":"wonder_unit_46.html","num":46,"zh":"好朋友奥吉突然不理我了","en":"Ex-Friends · 645 词 · 约 8 分钟"},"47":{"file":"wonder_unit_47.html","num":47,"zh":"雪天里打造的闪电雪橇，与那句格言","en":"Snow + Fortune Favors the Bold · 725 词 · 约 9 分钟"},"48":{"file":"wonder_unit_48.html","num":48,"zh":"那条雪橇原来是迈尔斯的","en":"Private School · 660 词 · 约 8 分钟"},"49":{"file":"wonder_unit_49.html","num":49,"zh":"科学课上想起万圣节真相，挥拳打向朱利安","en":"In Science + Partners · 1071 词 · 约 13 分钟"},"50":{"file":"wonder_unit_50.html","num":50,"zh":"杰克的办公室困局与冬日家书","en":"Detention + Season’s Greetings · 1073 词 · 约 13 分钟"},"51":{"file":"wonder_unit_51.html","num":51,"zh":"道歉信与朱利安妈妈的来信","en":"Letters, Emails, Facebook, Texts · 656 词 · 约 8 分钟"},"52":{"file":"wonder_unit_52.html","num":52,"zh":"邮件往来与寒假后的排挤","en":"Letters, Emails, Facebook, Texts + Back from Winter Break · 1092 词 · 约 14 分钟"},"53":{"file":"wonder_unit_53.html","num":53,"zh":"夏洛特的纸条与朱利安布下的局","en":"The War + Switching Tables · 1064 词 · 约 13 分钟"},"54":{"file":"wonder_unit_54.html","num":54,"zh":"杰克的忏悔与「官方站队名单」","en":"Why I Didn’t Sit with August the First Day of School + Sides · 795 词 · 约 10 分钟"},"55":{"file":"wonder_unit_55.html","num":55,"zh":"造访奥吉的星球大战小屋","en":"August’s House · 960 词 · 约 12 分钟"},"56":{"file":"wonder_unit_56.html","num":56,"zh":"维娅的男朋友贾斯汀","en":"The Boyfriend · 305 词 · 约 4 分钟"},"57":{"file":"wonder_unit_57.html","num":57,"zh":"第一次见到奥吉，我惊住了","en":"Olivia’s Brother · 815 词 · 约 10 分钟"},"58":{"file":"wonder_unit_58.html","num":58,"zh":"情人节礼物与第一次见她的家人","en":"Valentine’s Day · 992 词 · 约 12 分钟"},"59":{"file":"wonder_unit_59.html","num":59,"zh":"舞台剧试镜与许愿的瓢虫","en":"Our Town + Ladybug · 632 词 · 约 8 分钟"},"60":{"file":"wonder_unit_60.html","num":60,"zh":"公交站：三个恶霸与我的小把戏","en":"The Bus Stop · 1072 词 · 约 13 分钟"},"61":{"file":"wonder_unit_61.html","num":61,"zh":"排练室里的秘密与维娅的眼泪","en":"Rehearsal + Bird · 1123 词 · 约 14 分钟"},"62":{"file":"wonder_unit_62.html","num":62,"zh":"关于宇宙与运气的一场失眠思考","en":"The Universe · 296 词 · 约 4 分钟"},"63":{"file":"wonder_unit_63.html","num":63,"zh":"北极星上的科学展","en":"North Pole · 581 词 · 约 7 分钟"},"64":{"file":"wonder_unit_64.html","num":64,"zh":"写给奥吉娃娃的纸条","en":"The Auggie Doll · 778 词 · 约 10 分钟"},"65":{"file":"wonder_unit_65.html","num":65,"zh":"我把自己装扮成了洛鲍特","en":"Lobot · 722 词 · 约 9 分钟"},"66":{"file":"wonder_unit_66.html","num":66,"zh":"听得见的明亮与姐姐的秘密","en":"Hearing Brightly + Via’s Secret · 708 词 · 约 9 分钟"},"67":{"file":"wonder_unit_67.html","num":67,"zh":"妈妈没来敲我的门","en":"My Cave · 721 词 · 约 9 分钟"},"68":{"file":"wonder_unit_68.html","num":68,"zh":"向达西说再见","en":"Goodbye · 569 词 · 约 7 分钟"},"69":{"file":"wonder_unit_69.html","num":69,"zh":"达西的玩具堆成小山","en":"Daisy’s Toys · 827 词 · 约 10 分钟"},"70":{"file":"wonder_unit_70.html","num":70,"zh":"天堂里，脸不再重要","en":"Heaven · 383 词 · 约 5 分钟"},"71":{"file":"wonder_unit_71.html","num":71,"zh":"替补演员","en":"Understudy · 806 词 · 约 10 分钟"},"72":{"file":"wonder_unit_72.html","num":72,"zh":"站在台上的维娅和人群里的我","en":"The Ending · 919 词 · 约 11 分钟"},"73":{"file":"wonder_unit_73.html","num":73,"zh":"夏令营里的谎言：米兰达编出一个全新的自己","en":"Camp Lies · 776 词 · 约 10 分钟"},"74":{"file":"wonder_unit_74.html","num":74,"zh":"在学校渐行渐远，我阻止了《象人》剧，打电话给奥吉","en":"School + What I Miss Most · 976 词 · 约 12 分钟"},"75":{"file":"wonder_unit_75.html","num":75,"zh":"首演之夜，我把角色让给了维娅","en":"Extraordinary, but No One There to See + The Performance · 1063 词 · 约 13 分钟"},"76":{"file":"wonder_unit_76.html","num":76,"zh":"演出后重逢：米兰达回到温暖的怀抱","en":"After the Show · 287 词 · 约 4 分钟"},"77":{"file":"wonder_unit_77.html","num":77,"zh":"五年级自然营：第一次离开家","en":"The Fifth-Grade Nature Retreat + Known For · 685 词 · 约 9 分钟"},"78":{"file":"wonder_unit_78.html","num":78,"zh":"临行整理与黎明时分的告别","en":"Packing + Daybreak · 1110 词 · 约 14 分钟"},"79":{"file":"wonder_unit_79.html","num":79,"zh":"第一天：露营开始得太顺利了","en":"Day One · 689 词 · 约 9 分钟"},"80":{"file":"wonder_unit_80.html","num":80,"zh":"露天电影夜前的盛会把戏","en":"The Fairgrounds · 702 词 · 约 9 分钟"},"81":{"file":"wonder_unit_81.html","num":81,"zh":"林边的火堆声与萤火虫之夜","en":"Be Kind to Nature + The Woods Are Alive · 926 词 · 约 12 分钟"},"82":{"file":"wonder_unit_82.html","num":82,"zh":"树林里的“外星人”：一场残忍的羞辱","en":"Alien · 953 词 · 约 12 分钟"},"83":{"file":"wonder_unit_83.html","num":83,"zh":"黑暗里的声音：逃出生天后互相看顾","en":"Voices in the Dark · 743 词 · 约 9 分钟"},"84":{"file":"wonder_unit_84.html","num":84,"zh":"皇帝的卫队：难忘却的一夜","en":"The Emperor’s Guard + Sleep · 1064 词 · 约 13 分钟"},"85":{"file":"wonder_unit_85.html","num":85,"zh":"回家：让那一个小时别毁掉整个旅程","en":"Aftermath + Home · 980 词 · 约 12 分钟"},"86":{"file":"wonder_unit_86.html","num":86,"zh":"回家与那只叫“小熊”的新狗狗","en":"Home + Bear · 886 词 · 约 11 分钟"},"87":{"file":"wonder_unit_87.html","num":87,"zh":"全校都知道我们被欺负的事了","en":"The Shift · 367 词 · 约 5 分钟"},"88":{"file":"wonder_unit_88.html","num":88,"zh":"图什曼先生：朱利安要离开了","en":"Ducks + The Last Precept · 1046 词 · 约 13 分钟"},"89":{"file":"wonder_unit_89.html","num":89,"zh":"去毕业典礼路上，爸爸坦白扔了头盔","en":"The Drop-Off · 647 词 · 约 8 分钟"},"90":{"file":"wonder_unit_90.html","num":90,"zh":"爸爸的真心话：我爱你这张脸","en":"The Drop-Off · 618 词 · 约 8 分钟"},"91":{"file":"wonder_unit_91.html","num":91,"zh":"礼堂入座，我发现杰克暗恋夏默","en":"Take Your Seats, Everyone · 722 词 · 约 9 分钟"},"92":{"file":"wonder_unit_92.html","num":92,"zh":"图什曼先生的毕业致辞：你们在成长的门槛上","en":"A Simple Thing · 553 词 · 约 7 分钟"},"93":{"file":"wonder_unit_93.html","num":93,"zh":"全书最暖的格言：要更善良一点","en":"A Simple Thing · 605 词 · 约 8 分钟"},"94":{"file":"wonder_unit_94.html","num":94,"zh":"颁奖时刻：奥吉获亨利·沃德·比彻勋章","en":"Awards · 813 词 · 约 10 分钟"},"95":{"file":"wonder_unit_95.html","num":95,"zh":"全场起立为奥吉，他像在飘","en":"Floating + Pictures · 1003 词 · 约 13 分钟"},"96":{"file":"wonder_unit_96.html","num":96,"zh":"回家路上：你真的是一个奇迹","en":"The Walk Home · 312 词 · 约 4 分钟"}};
  var PARTS = [{"title":"第一部 · 奥吉","en":"One: August","color":"#a8743a","from":1,"to":26},{"title":"第二部 · 维娅","en":"Two: Via","color":"#6a8056","from":27,"to":37},{"title":"第三部 · 萨默","en":"Three: Summer","color":"#4a7a8c","from":38,"to":42},{"title":"第四部 · 杰克","en":"Four: Jack","color":"#4a6fa5","from":43,"to":56},{"title":"第五部 · 贾斯汀","en":"Five: Justin","color":"#7a6aa8","from":57,"to":62},{"title":"第六部 · 奥吉","en":"Six: August","color":"#a85a4a","from":63,"to":72},{"title":"第七部 · 米兰达","en":"Seven: Miranda","color":"#b06a8a","from":73,"to":76},{"title":"第八部 · 奥吉","en":"Eight: August","color":"#4a6a78","from":77,"to":96}];

  // 识当前单元号（从文件名）
  var page = (location.pathname.split('/').pop() || '').toLowerCase();
  var curNum = 0, m;
  if ((m = page.match(/wonder_unit_(\d+)\.html/))) curNum = parseInt(m[1], 10);

  // ---- 注入样式 ----
  var css = [
    '.wnav{position:fixed;top:0;left:0;bottom:0;width:252px;background:#22262f;color:#e8e6e0;display:flex;flex-direction:column;z-index:300;border-right:1px solid rgba(255,255,255,.06);font-family:-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}',
    '.wnav-hd{padding:18px 16px 12px;border-bottom:1px solid rgba(255,255,255,.08)}',
    '.wnav-hd h1{font-size:16px;font-weight:700;color:#e6c188;display:flex;align-items:center;gap:8px}',
    '.wnav-hd h1 .d{width:9px;height:9px;border-radius:50%;background:#e6c188;flex-shrink:0}',
    '.wnav-hd .sub{font-size:11px;opacity:.5;margin-top:4px}',
    '.wnav-prog{font-size:11px;color:#9aa3ae;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.06)}',
    '.wnav-list{flex:1;overflow-y:auto;padding:4px 0 16px}',
    '.wnav-list::-webkit-scrollbar{width:5px}',
    '.wnav-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:3px}',
    '.wpart{padding:10px 16px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:7px;color:rgba(255,255,255,.85);letter-spacing:.3px;position:sticky;top:0;background:#22262f;z-index:1;cursor:pointer;user-select:none}',
    '.wpart:hover{background:rgba(255,255,255,.05)}',
    '.wpart .dot{width:9px;height:9px;border-radius:3px;flex-shrink:0}',
    '.wpart small{font-weight:400;font-size:10px;opacity:.45;margin-left:2px}',
    '.wpart .caret{font-size:9px;opacity:.5;margin-left:auto;transition:transform .18s}',
    '.wpart.open .caret{transform:rotate(180deg)}',
    '.wpart-body{display:none}',
    '.wpart.open + .wpart-body{display:block}',
    '.wu{display:flex;gap:8px;align-items:baseline;padding:6px 16px 6px 22px;text-decoration:none;color:rgba(255,255,255,.62);font-size:12.5px;line-height:1.45;border-left:3px solid transparent;cursor:pointer}',
    '.wu:hover{background:rgba(255,255,255,.06);color:#fff}',
    '.wu .nu{font-size:10.5px;color:#d9b17c;font-weight:700;min-width:20px;font-variant-numeric:tabular-nums}',
    '.wu .zh{flex:1}',
    '.wu.cur{background:rgba(201,154,91,.16);color:#ffddaa;border-left-color:#e6c188;font-weight:600}',
    '.wu.cur .nu{color:#ffddaa}',
    '.wnav-mask{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:290;display:none}',
    '.wnav-mask.show{display:block}',
    '.wbtn{display:none;position:fixed;top:12px;left:12px;z-index:320;width:38px;height:38px;border:none;border-radius:9px;background:#22262f;color:#fff;font-size:18px;cursor:pointer;align-items:center;justify-content:center}',
    'body{padding-left:252px!important;padding-right:230px!important}',
    // ---- 右侧：本节小段导航 ----
    '.rnav{position:fixed;top:0;right:0;bottom:0;width:230px;background:var(--nav,#ebe3d2);color:#444;display:flex;flex-direction:column;z-index:300;border-left:1px solid rgba(0,0,0,.08);font-family:-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}',
    '.rnav-hd{padding:18px 16px 12px;border-bottom:1px solid rgba(0,0,0,.07)}',
    '.rnav-hd b{font-size:14px;color:#a8743a}',
    '.rnav-hd .sub{font-size:11px;color:#888;margin-top:2px}',
    '.rnav-prog{font-size:11px;color:#777;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,.06)}',
    '.rprogbar{height:4px;background:rgba(0,0,0,.08);border-radius:2px;margin-top:6px}',
    '.rprogbar i{display:block;height:100%;width:0;background:#a8743a;border-radius:2px;transition:width .3s}',
    '.rnav-list{flex:1;overflow-y:auto;padding:4px 0 14px}',
    '.rnav-list::-webkit-scrollbar{width:4px}',
    '.rnav-list::-webkit-scrollbar-thumb{background:rgba(0,0,0,.14);border-radius:2px}',
    '.ri{display:flex;gap:8px;align-items:baseline;padding:7px 14px 7px 16px;text-decoration:none;color:#555;font-size:12px;line-height:1.5;border-left:3px solid transparent;cursor:pointer}',
    '.ri:hover{background:rgba(255,255,255,.55)}',
    '.ri .nu{font-size:11px;color:#a8743a;font-weight:700;min-width:14px}',
    '.ri.on{background:#fff;border-left-color:#a8743a;font-weight:600;color:#a8743a}',
    '@media(max-width:1100px){body{padding-right:0!important}.rnav{display:none}}',
    '@media(max-width:900px){',
      '.wnav{transform:translateX(-100%);transition:transform .25s;width:280px}',
      '.wnav.open{transform:none}',
      '.wbtn{display:flex}',
      '.wnav-mask.show{display:block}',
      'body{padding-left:0!important}',
      '.main{margin-left:0!important;padding-left:16px!important}',
    '}'
  ].join('\n');
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  // ---- 汉堡按钮 ----
  var btn = document.createElement('button');
  btn.className = 'wbtn';
  btn.textContent = '☰';
  btn.setAttribute('aria-label','目录');
  document.body.appendChild(btn);
  var mask = document.createElement('div');
  mask.className = 'wnav-mask';
  document.body.appendChild(mask);

  // ---- 构建导航 ----
  var nav = document.createElement('aside');
  nav.className = 'wnav';
  var hd = document.createElement('div');
  hd.className = 'wnav-hd';
  hd.innerHTML = '<h1><span class="d"></span>Wonder</h1><div class="sub">R. J. Palacio 著 · 96 单元</div>';
  nav.appendChild(hd);
  var prog = document.createElement('div');
  prog.className = 'wnav-prog';
  prog.id = 'wnavProg';
  nav.appendChild(prog);
  var list = document.createElement('div');
  list.className = 'wnav-list';
  // 只展开包含当前单元的那一部
  function partOpen(part){ return curNum >= part.from && curNum <= part.to; }
  PARTS.forEach(function(part){
    var ph = document.createElement('div');
    var isOpen = partOpen(part);
    ph.className = 'wpart' + (isOpen ? ' open' : '');
    ph.innerHTML = '<span class="dot" style="background:' + part.color + '"></span>' + part.title + '<small>' + part.en + '</small><span class="caret">▼</span>';
    ph.addEventListener('click', function(){ ph.classList.toggle('open'); });
    list.appendChild(ph);
    var body = document.createElement('div');
    body.className = 'wpart-body';
    for (var n = part.from; n <= part.to; n++) {
      if (!UNITS[n]) continue;
      var it = document.createElement('a');
      it.className = 'wu' + (n === curNum ? ' cur' : '');
      it.href = UNITS[n].file;
      it.dataset.num = n;
      it.innerHTML = '<span class="nu">' + String(n).padStart(2,'0') + '</span><span class="zh">' + UNITS[n].zh + '</span>';
      it.addEventListener('click', function(ev){
        try { localStorage.setItem('wonder_unit', this.dataset.num); } catch(e){}
        closeNav();
      });
      body.appendChild(it);
    }
    list.appendChild(body);
  });
  nav.appendChild(list);
  document.body.appendChild(nav);

  // ---- 记忆：进入页面时记忆当前单元（若不在导航则为 0） ----
  function saveCur(){
    try { localStorage.setItem('wonder_unit', String(curNum)); } catch(e){}
  }
  if (curNum > 0) saveCur();

  function updateProg(){
    var last = 0;
    try { last = parseInt(localStorage.getItem('wonder_unit'), 10) || curNum || 0; } catch(e){}
    var txt = '进度：第 ' + (curNum || '—') + ' / 96 单元';
    if (last && last !== curNum) txt += ' · 上次读到 ' + last;
    var el = document.getElementById('wnavProg');
    if (el) el.textContent = txt;
  }
  updateProg();

  // 定位当前单元到可见区域
  (function(){
    var cur = nav.querySelector('.wu.cur');
    if (cur) try { cur.scrollIntoView({ block:'center' }); } catch(e){}
  })();

  // ---- 侧栏开关 ----
  var open = false;
  function openNav(){ nav.classList.add('open'); mask.classList.add('show'); open = true; btn.textContent = '✕'; }
  function closeNav(){ nav.classList.remove('open'); mask.classList.remove('show'); open = false; btn.textContent = '☰'; }
  btn.addEventListener('click', function(e){ e.stopPropagation(); if (open) closeNav(); else openNav(); });
  mask.addEventListener('click', closeNav);
  document.addEventListener('click', function(e){ if (open && !nav.contains(e.target) && e.target !== btn) closeNav(); });

  // ---- 快捷键 ----
  function go(n){
    if (n < 1) n = 1; if (n > 96) n = 96;
    if (n === curNum) return;
    try { localStorage.setItem('wonder_unit', String(n)); } catch(e){}
    location.href = UNITS[n].file;
  }
  document.addEventListener('keydown', function(e){
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') { e.preventDefault(); go(curNum + 1); }
    else if (e.key === 'a' || e.key === 'A' || e.key === 'e' || e.key === 'E' || e.key === 'ArrowLeft') { e.preventDefault(); go(curNum - 1); }
    else if (e.key === 'Escape') { closeNav(); }
  });

  // 移动端打开时自动显示当前单元上下文（可选）
  document.body.style.paddingLeft = '';

  // ---- 右侧：本节小段导航（动态从 .segment 生成） ----
  (function(){
    var segs = document.querySelectorAll('.segment');
    if (!segs.length) return;
    var rnav = document.createElement('aside');
    rnav.className = 'rnav';
    var hd = document.createElement('div');
    hd.className = 'rnav-hd';
    hd.innerHTML = '<b>本节 · 本单元</b><div class="sub">第 ' + (curNum || '?') + ' 单元 · ' + segs.length + ' 小段</div>';
    rnav.appendChild(hd);
    var rp = document.createElement('div');
    rp.className = 'rnav-prog';
    rp.innerHTML = '已读 <span id="rpct">0</span>%<div class="rprogbar"><i id="rprog"></i></div>';
    rnav.appendChild(rp);
    var rlist = document.createElement('div');
    rlist.className = 'rnav-list';
    var items = [];
    segs.forEach(function(seg, k){
      var numEl = seg.querySelector('.seg-num');
      var titleEl = seg.querySelector('.seg-titles h2');
      var num = numEl ? numEl.textContent.trim() : (k + 1);
      var title = titleEl ? titleEl.textContent.trim() : ('第 ' + (k + 1) + ' 段');
      var a = document.createElement('a');
      a.className = 'ri' + (k === 0 ? ' on' : '');
      a.href = '#seg-' + (k + 1);
      a.dataset.i = k;
      a.innerHTML = '<span class="nu">' + num + '</span><span>' + title + '</span>';
      a.addEventListener('click', function(ev){
        ev.preventDefault();
        try { segs[+this.dataset.i].scrollIntoView({ behavior:'smooth', block:'start' }); } catch(e){}
      });
      rlist.appendChild(a);
      items.push(a);
    });
    rnav.appendChild(rlist);
    document.body.appendChild(rnav);

    var rprog = document.getElementById('rprog');
    var rpct = document.getElementById('rpct');
    function setOn(i){
      items.forEach(function(a, k){ a.classList.toggle('on', k === i); });
    }
    // 滚动高亮当前段 + 进度
    function onScroll(){
      var st = window.scrollY + 120;
      var cur = 0;
      for (var i = 0; i < segs.length; i++) { if (segs[i].offsetTop <= st) cur = i; else break; }
      setOn(cur);
      var doc = document.documentElement;
      var max = (doc.scrollHeight - window.innerHeight) || 1;
      var p = Math.max(0, Math.min(100, Math.round(window.scrollY / max * 100)));
      if (rpct) rpct.textContent = p;
      if (rprog) rprog.style.width = p + '%';
    }
    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
    // 高亮当前段对应的导航项
    (function(){
      if (curNum > 0) return;
    })();
  })();
})();
