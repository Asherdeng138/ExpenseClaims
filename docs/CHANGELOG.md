# 修改记录

每次修改记录：改了什么、为什么、实际跑过的检查。基线快照：`../_backups/2026-10-13-baseline/`（含 `source-manifest.sha256`，签名文件单独在 `signing/`）。

## 2026-11-07 · 文档：升级、换设备与数据目录说明（双语）

- 用户手册第 9 节改为“升级、换设备与备份”：同一台电脑升级电脑版无需同步（数据在 `%APPDATA%\baozhang-desktop`，与程序文件夹分开，便携版/ZIP/安装版共用）；手机覆盖安装；换电脑用备份与恢复，备份超过 250 MB 时按程序提示复制数据文件夹；换手机暂无一键恢复；手机与电脑不同步。README 与 0.3.0/0.4.0 发布说明加同样的简要说明。
- 更正：此前文档把数据目录写成 `%APPDATA%` 下的“随手报账”。实际由 Electron 按包名 `baozhang-desktop` 决定，已在有数据的电脑上核对（`receipts.json`、`documents/`）。
- 只改文档，程序和已发布的安装包不变。

## 2026-11-07 · 发布 Android 0.3.0（versionCode 7）/ Windows 0.4.0；双语文档

- 版本号：Android 0.2.1 → 0.3.0、versionCode 6 → 7；Windows 0.3.1 → 0.4.0（含语言/货币设置、出差国家，以及下面的安装版改动）。
- 修复：安卓“设置与说明”页写死显示“随手报账 · 0.1.3”，电脑版页脚写死“随手报账 0.2.5”，现改为当前版本，并新增 `tests/version-label.test.cjs`，版本号与 `app/build.gradle`、`desktop/package.json` 不一致时测试失败。
- 新增双语用户手册 `docs/user-guide.md` / `docs/user-guide.en.md`、`README.en.md`、`desktop/README.en.md`、`docs/windows-download.en.md`；中文文档加语言切换链接。

检查（均为改完后的最终产物）：
- Android `tools/build-release-android.cmd`：Java 单测、`lintRelease`（0 错误，5 个依赖版本/既有警告）、签名 APK、`zipalign -c -P 16 4` 通过；签名证书 SHA-256 `197e8692…16a6463b` 与 0.2.1 相同，可覆盖安装；`check-apk-alignment.py` 通过；APK 内 `assets/app.js` 显示 0.3.0。
- 根目录 `node --test` 解析/同步/语言/版本号 72 项、`android-migration`（`--experimental-sqlite`）5 项通过；Android 浏览器 `ui`、`settings`、`trips`、`summary`、`preview-batch`、`deletion` 通过；`smart-scan` 需外部票据照片，未运行。
- Windows `tools/build-release-desktop.cmd`：服务 18/18、`test:ui`（3 项）、真实 OCR `smoke`、打包、打包后 `smoke` 通过；另跑 `settings-electron`、`viewer`、`multi-drop`、`drop`（源码与打包后各一次）、`summary`、`ocr-failure` 通过。
- 安装版实测：`Setup-0.4.0.exe /S /currentuser` 安装成功（约 52 秒，写入当前用户卸载项与开始菜单/桌面快捷方式），对安装后的程序跑 `smoke` 全部功能断言通过（当时本机截图步骤对任何构建都超时，含此前通过的 `win-unpacked`，故去掉截图后运行）；静默卸载后程序目录、卸载项和快捷方式均被清除，未触碰 `%APPDATA%` 数据。
- 本机 Defender（签名 1.463.176.0，云保护关闭）扫描 APK、Setup EXE、ZIP 均无威胁；Setup EXE 仍为 NotSigned。

未验收：Android 真机（v2→v3 升级、相机、原生存储与导出）；他人电脑上的浏览器下载信誉与 SmartScreen 实际表现。

## 2026-11-07 · Windows 改为发布安装版 + ZIP，停发便携 EXE

起因：用户从 GitHub 下载 `BaoZhang-Desktop-<版本>.exe`（便携版）时被 Windows 安全/浏览器拦截或打不开，ZIP 正常。

- 原因：便携版是 electron-builder 的 NSIS 自解压壳，静默模式、无启动画面，每次启动都把约 600 MB / 7100 个文件解压到 `%TEMP%` 再运行，退出后删除，期间没有任何窗口；0.2.4 还因这个临时目录出过重复启动冲突。文件没有 Authenticode 签名（`Get-AuthenticodeSignature`：NotSigned；构建日志中的“signing with signtool.exe”只是改资源），下载量又少，所以浏览器下载信誉检查和 SmartScreen 会提示“不常下载/未知发布者”。本机 Defender（签名 1.463.176.0）扫描 0.3.1 的 EXE、ZIP、`win-unpacked` 均无威胁，但本机云保护（MAPS）关闭，扫描结果不代表用户电脑上的云端判定。
- `desktop/package.json`：目标从 `portable` 改为 `nsis`（`BaoZhang-Desktop-Setup-<版本>.exe`，当前用户安装、不提权、可选目录、卸载保留数据），ZIP 不变；`npm run dist` 同步。数据目录仍是 `%APPDATA%` 下的应用文件夹，与旧便携版相同。
- `tools/publish-release.ps1` 上传 Setup EXE 和 ZIP，并要求发布说明写明安装版文件名和 `Get-FileHash` 校验方法；`.github/workflows/desktop.yml` 为两者生成 `SHA256SUMS-desktop-<版本>.txt` 并一起上传（原来只上传 EXE 和它的哈希）。
- 新增 [docs/windows-download.md](windows-download.md)：选哪个文件、SHA-256 校验、三类安全提示的区别与做法（信誉提示 vs Defender 报毒），可直接复制到发布说明；根 README、desktop/README、AGENTS.md 同步。

检查：用新配置打包到独立目录 `desktop/release-check/`（版本号仍为 0.3.1，只用于验证，不发布）：electron-builder 成功生成 `BaoZhang-Desktop-Setup-0.3.1.exe`（181,505,381 字节，SHA-256 `be71280b…04fa70`）和 ZIP（`045c37de…eb03206`）；Defender 扫描 Setup EXE、ZIP、`win-unpacked` 均无威胁，两个 EXE 均 NotSigned；对 `release-check/win-unpacked` 跑打包后的 `smoke`（真实 OCR、导入、编辑、PDF/Excel 导出、归档、回收站、持久化）通过。

未验收：没有实际运行安装器的安装/卸载（会写当前用户注册表和快捷方式）；没有办法在本机验证浏览器下载信誉和 SmartScreen 对新文件的实际表现，未签名的新 EXE 仍会出现“未知发布者”提示，只有代码签名并积累信誉后才会消失。

## 2026-11-07 · 出差国家与欧洲大区餐补标准（两端）；全面随机测试

来源：用户提供的《财务报销流程指南》第 16 页“2.4 差旅报销申请-5”所附 Hanshow 差旅费用标准（表格是图片，逐行放大核对）。用户要求：英国维持每天 £50；其他欧洲大区国家用表中“餐补（人天）”，按欧元计算。

- 标记出差时选择国家和天数（天数与结束日期联动）。共 29 个选项：英国 £50；荷兰、比利时、卢森堡、德国、法国、奥地利、爱尔兰、以色列等中东国家 €50；瑞士、芬兰、瑞典、丹麦、挪威、冰岛 €60；波兰、意大利、希腊、西班牙、葡萄牙、捷克、斯洛伐克、匈牙利、塞尔维亚、罗马尼亚、保加利亚、俄罗斯、南非、克罗地亚等其他东欧国家 €40。
- 额度按“国家每日标准 × 连续出差天数”，换国家另起一段；只统计与该国货币相同的已确认餐补，其他货币的只提示数量，不换算。
- 发票日期落在出差日时货币自动改为该国货币，之后可手动改回；Windows 批量识别也会按出差日选货币并用对应规则读金额。
- 餐补卡片不再因“设置选欧元”而隐藏（欧元现在有了标准）；市内交通 £150 月额度仍只在英镑设置下显示。
- 数据：Android SQLite 升到版本 3（`days` 加 `country`，旧出差日为空即英国，备份 JSON 增加 `countries`）；Windows JSON 增加 `tripCountries`，`version` 仍为 1，备份恢复只为新加的日期带上国家。
- 随机测试发现并修复：同一天、同商家、同数字但一张英镑一张欧元的发票被误报为疑似重复；切换语言后屏幕上残留旧语言的提示条。随机点击中出现的“页面崩溃”经核实是测试脚本超时杀掉浏览器造成的，改前改后的版本表现相同，不是应用问题。

检查：解析/同步/迁移/语言 `node --test` 75/75；Windows 服务 18/18；Java 单测 11/11 与 `lintRelease` 通过；Android 浏览器 `ui`、`settings`、`trips`、`summary`、`preview-batch`、`deletion` 通过；桌面 `ui`、`settings-ui`、`trips-ui`、`summary`、`ocr-failure` 通过；Electron 中 `settings-electron`（含真实 IPC 标记瑞士出差）、`smoke`（真实 OCR）、`viewer`、`multi-drop`、`drop` 通过。随机测试：解析器 8 万次解析、Windows 存储 600 次随机操作、两端界面随机点击，均未发现异常。

未验收：Android 真机（数据库 v2→v3 升级、原生日历写入）；当地货币（CHF、PLN、SEK 等）发票不支持；法国“大巴黎”、英国“伦敦”等只影响住宿标准的细分未做（餐补无差别）。

## 2026-11-01 · 语言与货币设置（两端）

用户确认的规则：额度只对英镑有效，选欧元时不提醒，欧元发票也不计入；每张发票记录自己的货币，不做汇率换算；导出文件名和 Excel 内容跟随语言；一次导出可混合货币，分币种合计。

- 语言：新增 `app/src/main/assets/i18n.js` 与相同的 `desktop/i18n.cjs`，以中文为键的英式英语对照表；两端界面、提示、原生错误、系统对话框、预览窗口都走这张表。中文仍是默认语言和存储用语，切换语言不改数据；商家、备注不翻译。
- 货币：两端设置可选 GBP / EUR，重启保留。编辑表单新增单张发票的货币选择（原需求没有写，加上是因为否则保存错的货币无法改正）。合计按币种分开显示。
- 识别：`parse(text,{currency})`。欧元模式增加 `1.234,56`、`1 234,56`、`12,50 €` 与德/法/意/荷/西语用词；票据同时标两种货币时只取所选货币，只标另一种货币时提示核对。对比旧解析器：解析测试里 60 段文本中 53 段（没有欧元标记的全部）英镑模式结果完全相同，其余 7 段都带欧元金额，差异只是新增的提示或优先取 £ 金额。
- 导出：Excel 增加货币列（Windows 8 列，Android 10 列），金额带对应符号格式，每种货币单独合计；英文文件名如 `2026-10-01_to_2026-10-31_Travel_Subsistence_Receipts.pdf`。
- 数据兼容：SQLite 仍为版本 2；Windows JSON 仍为 `version:1`，只增加字段。旧记录视为 GBP；备份恢复保留货币、拒绝无效值、不覆盖本机设置。
- 测试：新增 `tests/i18n.test.cjs`、`tests/settings.test.cjs`、`desktop/tests/settings-ui.test.cjs`、`desktop/tests/settings-electron.test.cjs`，并扩充解析、服务、迁移和 Java 测试。`desktop/tests/ui.test.cjs` 固定页面时钟为 2026-10-20：它依赖“当月含 2026-10-09”，进入 11 月后本来就会失败，与本次改动无关。

检查（Node 22 为 `.tools/node`；迁移测试需要 `node:sqlite`，用 Electron 自带的 Node 24 跑）：解析、同步、迁移、语言 4 个文件 `node --test` 全部通过；`desktop` 服务测试 16/16；Java 单测 11/11，`lintRelease` 通过；Android 浏览器 `ui`、`settings`、`summary`、`preview-batch`、`deletion` 通过；桌面 `ui`、`settings-ui`、`settings-electron`、`summary`、`ocr-failure`、`viewer`、`multi-drop`、`smoke` 通过。`drop.test` 与 Gradle 同时运行时在恢复系统剪贴板那一步失败过一次，单独重跑两次都通过。`smart-scan` 因没有样张照片而跳过。

未验收：Android 真机或模拟器（原生设置读写、英文系统对话框、ML Kit 识别欧元票据、真实导出）未测；真实欧元票据的识别准确率未评估，欧洲语言词表是按规则写的，只用合成样例验证过；英文文案未经英语母语者审阅；打包后的 EXE/APK 未构建。应用图标名称（随手报账）不随语言切换。

## 2026-10-13 · 字段解析改进（P2 第一步，两端共用）

改动文件：`app/src/main/assets/parser.js`、`desktop/parser.cjs`（两份保持一致）、`tests/parser.test.cjs`（新增 7 项）、新增 `tests/parser-sync.test.cjs`、`tools/eval-ocr.cjs`；`DELEGATION.md`/`AGENTS.md` 委派规则；新增 `CLAUDE.md`（只引用 AGENTS.md）。

- 金额：区分表头/小计/税/找零/优惠行；总额、刷卡、小计互相印证；分开付款（现金+卡、券+卡）相加核对；"Total … Charges" 视为部分合计；£ 被识别成数字时只有在其他行印证时才修正；没把握时不自动填写，只给候选（警告文案保留"多个合计"）。
- 日期：支持 `10 Aug’ 26`、`22AUG25`；`12 Aug 12:39` 不再误判为 2012 年；带时间的日期优先；月份 97/87 → 07 修正；年份异常（如 2028、2050）只作为候选，不自动填写。
- 商家：英国常见商家词典（容忍 1 个字母识别错误、O/0 混淆）、网址、"Ltd" 公司名；菜品里的常见词和地名不当作商家；总额以下的广告只作低优先级候选。新增返回字段 `merchants`（候选列表），原有字段不变。
- 新增可选参数 `parse(text,{today})`，用于测试固定日期。

评测（SparkReceipt 导出的 149 张已裁剪图片，Tesseract eng+chi_sim，测试数据在项目外 `../ocr-testset/`）：

| 指标 | 旧解析器 | 新解析器 |
|---|---|---|
| 日期 正确 / 错填 | 55.7% / 8.1% | 63.1% / 5.4% |
| 金额 正确 / 错填 | 59.7% / 31.5% | 61.1% / 6.0% |
| 商家 正确 / 错填 | 53.7% / 45.6% | 77.2% / 16.1% |
| 三项全对 | 25.5% | 38.9% |

注意：规则是在同一批图片上调出来的，存在过拟合，真实提升需要用新票据复测。Android 的 ML Kit 识别结果需在手机上另测。Windows 版需重新 `npm run build` 打包后才使用新解析器。

检查：`node --test tests/parser.test.cjs tests/parser-sync.test.cjs tests/android-migration.test.cjs` 34/34 通过；`desktop: node --test tests/service.test.cjs` 11/11 通过；`node --check app/src/main/assets/app.js` 通过。未运行：APK 构建、浏览器 UI 测试、Electron 冒烟测试。

## 2026-10-13（晚）· 识别引擎对比与解析器第二轮

- 解析器：修复 £ 误读修正可能产生 0.00 并使 `parse()` 报错的缺陷；支持 OCR 把年份和时间连在一起（`20/07/202610:17AM`）；"Card Tendered" 视为刷卡付款；总额 − 优惠 = 后一个总额的核对；只有总额/付款行才算相互印证；TfL 车票水印、McDonald's 问卷网址等商家修正。新增 2 项测试（共 33 项）。
- 工具链验证：新增 `tools/build-apk-test.cmd`（测试编译，APK 输出到 `output/test/`，不覆盖正式 APK）。编译、Java 单测、lint 通过；签名证书 SHA-256 与 0.1.3 相同；16 KB 对齐通过。测试 APK 与手机版本号相同，不要安装。
- 识别引擎对比（同 149 张，新解析器，三项全对）：Tesseract（Windows 现用）41.6% · RapidOCR/PP-OCRv3 51.7% · PP-OCRv5 55.0% · **PP-OCRv6 small 61.7%** · v6+v5 融合 64.4%。正确金额出现在候选中：Tesseract 77.9%，PP-OCRv6 94.6%。OCR 文本缓存在 `../ocr-testset/ocr-text.tgz`。
- 注意：规则在同一批样本上调整，存在过拟合；标准答案来自 SparkReceipt 未审核结果，已确认至少 1 张日期标注错误。Android ML Kit 未参与对比，需真机评测。

## 2026-10-16 · Android 0.2.0（versionCode 5）/ Windows 0.3.0 正式版

新增
- 新识别引擎：离线 PP-OCRv6 small（onnxruntime-web WASM），Android 在 WebView、Windows 在主进程后台线程运行，同一份 `receipt-ocr.js`。
- 自动裁剪：按文字区域找出发票、透视矫正、自动转正（横拍/倒拍）；照片偏暗、模糊、反光、发票贴边（可能没拍完整）会提示。
- Android 裁剪编辑：编辑页“裁剪 / 矫正”按钮，可拖动四角、旋转 90°、恢复原图、自动识别边缘；确定后重新识别。裁剪只保存四角坐标（附件 JSON 的 `crop` 字段），原图不变；预览和合并 PDF 按裁剪显示。
- Android 结果融合：先显示原 ML Kit 结果，新引擎完成后逐项融合；两者冲突时留空并提示，给出合并后的金额/日期/商家候选；手动修改过的字段不会被覆盖。新增商家候选按钮。
- Windows：识别前自动裁剪与转正；新引擎失败自动回退原 Tesseract。

数据与升级
- 未改数据库结构（SQLite 仍为 v2）、未改备份格式；Android 包名与签名不变，可覆盖安装 0.1.3。Windows 数据目录与格式不变。
- 新增 `CropSpec.java`（裁剪校验）及单元测试；`setCrop` 桥接接口；预览路由支持 `raw=1`；OCR 资源按正确 MIME 返回；CSP 允许 `wasm-unsafe-eval` 与同源读取模型。

测试（实际执行）
- 根目录 Node 测试 36/36；Android Java 单测 9/9（含 CropSpec 3 项）、lint、签名（证书与 0.1.3 相同）、16 KB 对齐通过。
- Android 浏览器测试：ui、preview-batch、deletion、smart-scan（真实引擎、裁剪编辑器、手改字段保留）全部通过；APK 内前端文件与测试版本逐字节一致。
- Windows：服务测试 11/11、界面测试、源码版与打包版 Electron 真实 OCR 冒烟测试通过；打包目录内引擎实测自动裁剪并读出总额。
- 识别准确率（150 张 SparkReceipt 图片，三项全对）：Tesseract+旧解析 25.5% → PP-OCRv6+新解析 61.1%（JS 引擎实测）。合成手机照片 40 张：不裁剪 37.5% → 自动裁剪 55.0%；文字完整保留 38/40，平均残留背景 5%。
- 未验证：真机上的速度、内存与 WebView 兼容性；ML Kit 与新引擎融合后的真实准确率。

产物（SHA-256 见 `output/release-0.2.0-0.3.0.sha256`）
- `output/BaoZhang-0.2.0.apk`
- `desktop/release/BaoZhang-Desktop-0.3.0.exe`、`BaoZhang-Desktop-0.3.0.zip`

## 2026-10-17 · Android 0.2.1（versionCode 6）/ Windows 0.3.1

- 主界面合计不再固定为日历月份：两端可选择统计时间（本月〔默认〕、上月、日历所选月份、今年、全部时间）和费用类别（全部或五类之一），标题写明统计范围；选择在本机记住。手机统计已保存发票，电脑统计已确认发票；回收站不计入，归档计入。
- 共享解析器新增 `summaryRange`/`summarize`（含测试）；新增 `tests/summary.test.cjs`（手机界面选择、金额、重启后保留、360px）。

## 2026-10-25 · 仓库整理（不改变安装包功能）

- GitHub 仓库改名为 `Asherdeng138/ExpenseClaims`；Android 0.2.1 / Windows 0.3.1 发布为 GitHub Release `v0.2.1-0.3.1`（上传的三个安装包与 10-17 交付文件 SHA-256 一致）。新增 `tools/publish-release.cmd/.ps1`：核对哈希后用 GitHub CLI 发布。
- README 重写为当前版本说明，删除旧 0.1.0 / 0.2.0 下载链接和互相矛盾的旧描述；desktop/README 同步更新。旧 README 原文和各版测试记录移到 `docs/history/`。
- 删除无用代码：`receipt-ocr.js`（两份）中已停用的 `expandToPaper`（按纸张边缘扩展裁剪，评测变差后未再调用）；`ReceiptStore.CURRENCIES`（未被使用的多币种列表）；`tools/package-preview.cjs`（0.2.0 起生成的浏览器演示缺少识别脚本，已无法使用）。
