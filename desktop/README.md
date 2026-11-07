# 随手报账 · Windows 电脑版

[English](README.en.md) | 中文

与手机版共用界面风格和解析规则的 Windows 桌面应用（Electron）。语言和货币可在左下角“设置”里切换，票据识别在本机离线完成，不上传任何数据。下载与功能总览见[根目录 README](../README.md)，使用步骤见[用户手册](../docs/user-guide.md)。

## 使用

1. 关闭旧版后，完整解压 `BaoZhang-Desktop-<版本>.zip` 运行其中的 `随手报账.exe`，或运行安装版 `BaoZhang-Desktop-Setup-<版本>.exe`（当前用户安装，无需管理员），沿用原本的本机数据。0.3.1 及更早版本的便携 EXE 不再推荐，见 [Windows 下载与校验](../docs/windows-download.md)。
2. 导入：点“批量添加发票”多选文件，或把文件拖到窗口任意位置；可连续拖入、移除单张或清空，再选择费用种类一起导入。微信图片可复制后点“粘贴微信图片”。
3. 在工作台勾选发票，点“识别选中”。识别按顺序进行，结果为待核对状态，可中途停止。
4. 对照右侧原件核对日期、金额、商家、所在地、分类和备注。日期、金额、商家下方有候选按钮；出差餐补有 Tesco、麦当劳、Sainsbury's、ASDA、Costco 快捷按钮，也可自由填写。“查看大图”打开独立预览窗口，可放大、旋转、PDF 翻页，同时继续在主窗口填写。勾选核对后保存。
5. 日历右侧选择出差、办公、休假或清除，可批量标记日期范围；标记出差时选择国家和天数，餐补额度按该国每日标准（英国 £50，其他国家按欧元），同时显示市内交通额度。
6. “报账导出”：先选费用种类，再选日期范围和发票，生成合并 PDF + Excel；导出后可归档。
7. 左下角可备份、恢复 ZIP（合并恢复，跳过重复原件，不覆盖已有日历标记和设置）。安卓备份不能导入电脑版。
8. 左下角“设置”可切换中文 / 英文和英镑 / 欧元。已确认的发票保留自己的货币，不做汇率换算；未确认的发票跟随设置，也可在编辑时单独修改。选欧元时不显示额度提醒。

数据保存在当前 Windows 用户的应用数据目录（`%APPDATA%` 下的应用文件夹）中，移动程序文件夹、改用安装版或卸载安装版都不影响数据。

## 支持范围

- Windows 10/11 64 位，无需另装 Node.js、Python 或 OCR。
- JPG、JPEG、PNG、WebP、PDF；每批 1–100 个文件，单文件最多 50 MB；一个文件为一张发票。
- 相同内容的文件重复导入会自动跳过。
- PDF 先读前 3 页的文字层，文字不足时再识别图像；导出包含全部页面，一次最多 300 页。
- 识别：PP-OCRv6（自动裁剪与转正，仅用于识别，导出用原件），失败时回退 Tesseract 英文/简中模型。识别不覆盖已有的人工填写。
- 合并 PDF 保留原页面内容，但原 PDF 的数字签名在新文档中不再有效；原件仍完整保存。
- 没有受信任代码签名证书，浏览器和 SmartScreen 会显示“未知发布者”信誉提示。被拦截时核对发布页的 SHA-256，Defender 报毒时由作者提交 Microsoft 复核；不要关闭防护或添加排除项。详见 [Windows 下载与校验](../docs/windows-download.md)。

## 开发

在 `desktop/` 目录，Node.js 22：

```text
npm install        # 同时运行 prepare：下载 Tesseract 模型，复制安卓端的 PP-OCRv6 模型
npm run build      # 生成 ui/app.js 与 PDF.js 资源（不要直接修改 ui/app.js，改 ui/app.src.js）
npm test           # 存储、导入/去重、导出、备份恢复等服务测试
npm run test:ui    # 浏览器界面测试，含语言和货币设置（模拟 Desktop 接口，需 Playwright）
npm run test:settings  # Electron 中语言和货币设置的端到端测试（真实 IPC、重启保留、欧元识别、英文导出）
npm run smoke      # Electron 中真实 OCR 的端到端测试
npm run dist       # 打包 release/ 下的安装版 Setup EXE（NSIS）与 ZIP；再设 BAOZHANG_PACKAGED=1 运行 smoke 测试打包后的程序
```

Windows 上可直接双击仓库里的 `tools\build-release-desktop.cmd` 完成以上全部步骤。
