# 🔍 Obsidian WeChat Local OCR Plugin

> **Obsidian 的本地 OCR 图片识别插件。**
> **Local OCR plugin for Obsidian based on WeChat's OCR engine.**

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![Downloads](https://img.shields.io/badge/downloads-pending-orange)

## 📖 简介 (Introduction)

这是一个 Obsidian 插件，它允许你直接在笔记中对图片进行 OCR 文字识别。
它具有以下强大的交互功能：

* **🖱️ 滑动多选 (Slide to Select)**: 像 iOS 相册一样，按住鼠标滑动即可批量选中/取消文字区域。
* **🔭 定点缩放 (Point Zoom)**: 按住 `Ctrl + 滚轮`，朝着鼠标指向的位置精准缩放预览。
* **👁️ 全景居中 (Auto Center)**: 图片自动适应窗口大小并居中，双击背景一键还原。
* **📋 智能拼接 (Smart Merge)**: 自动处理中文换行，将多行文字拼接为通顺的段落。

## ⚠️ 前置要求 (Prerequisites)

**本插件只是一个客户端，它必须配合服务端才能工作！**
**This plugin is a client. It REQUIRES the server to run!**

请先下载并运行服务端：
👉 **[WeChat-Local-OCR-Serve](https://github.com/zhywjml/WeChat-Local-OCR-Serve)**

## 📥 安装 (Installation)

1.  下载本仓库的 `main.js` and `manifest.json`。
2.  在你的 Obsidian 仓库中创建文件夹: `.obsidian/plugins/wechat-local-ocr/`。
3.  将文件放入该文件夹。
4.  在 Obsidian 设置中启用插件。
5.  **确保后台运行了 [OCR Server](https://github.com/zhywjml/WeChat-Local-OCR-Serve)**。

## 🎮 使用方法 (Usage)

1.  在 Obsidian 中，**右键点击** 任意图片（支持 png, jpg, bmp）。
2.  选择菜单项 **"🔍 OCR 多选模式"**。
3.  在弹出的窗口中：
    * **左键滑动**: 选中文字区域。
    * **Ctrl+滚轮**: 缩放图片。
    * **双击背景**: 还原大小。
    * **复制按钮**: 获取识别结果。

![动画](https://github.com/user-attachments/assets/0b56ea8b-940b-4c6a-a476-0a0341ea527f)


---

**Made with ❤️ by [zhywjml](https://github.com/zhywjml)**
