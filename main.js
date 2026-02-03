/* main.js - 鼠标定点缩放 + 终极体验版 */
const obsidian = require('obsidian');

module.exports = class LocalOCRPlugin extends obsidian.Plugin {
    async onload() {
        console.log('✅ 微信OCR(定点缩放版)已加载');

        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                const ext = file.extension?.toLowerCase();
                if (['png', 'jpg', 'jpeg', 'bmp'].includes(ext)) {
                    menu.addItem((item) => {
                        item
                            .setTitle("🔍 OCR 多选模式")
                            .setIcon("check-square")
                            .onClick(async () => {
                                await this.performOCR(file);
                            });
                    });
                }
            })
        );
        
        this.addStyle();
    }

    addStyle() {
        const css = `
            /* 1. 弹窗容器 */
            .ocr-wide-modal {
                width: 90vw !important;
                max-width: 90vw !important;
                height: 90vh !important;
                display: flex;
                flex-direction: column;
            }

            .ocr-wide-modal .modal-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                padding: 0 !important;
            }

            /* 2. 滚动/操作区域 */
            .ocr-modal-content { 
                position: relative; 
                flex: 1;
                overflow: auto;
                background: #1e1e1e; 
                display: flex;       
                user-select: none; 
                cursor: grab;
            }
            .ocr-modal-content:active { cursor: grabbing; }

            /* 3. 图片包裹层 */
            .ocr-img-wrapper {
                position: relative; 
                display: inline-block; 
                line-height: 0; 
                margin: auto;        
                flex-shrink: 0;
                box-shadow: 0 0 20px rgba(0,0,0,0.5); 
                /* 移除 transition，因为定点缩放需要实时计算，动画会造成位置漂移 */
                /* transition: width 0.05s ease-out; */ 
            }

            .ocr-base-img {
                display: block;
                width: 100%; 
                height: auto;
                -webkit-user-drag: none; 
            }

            /* --- 显示模式控制 --- */

            /* 模式A：全景适应 */
            .ocr-fit-window .ocr-base-img {
                max-height: 82vh; 
                object-fit: contain;
            }

            /* 模式B：自由缩放 */
            .ocr-original-size .ocr-base-img {
                max-height: none; 
            }

            /* --- 框框样式 --- */
            .ocr-box {
                position: absolute;
                box-sizing: border-box; 
                border: 2px solid rgba(65, 105, 225, 0.6);
                background-color: rgba(65, 105, 225, 0.1); 
                cursor: pointer;
                z-index: 10; 
            }
            .ocr-box.selected {
                border-color: #00ffcc !important;
                background-color: rgba(0, 255, 204, 0.4) !important;
                box-shadow: 0 0 8px rgba(0, 255, 204, 0.6);
                z-index: 50;
            }
            .ocr-box:hover {
                border-color: #00ffcc;
                background-color: rgba(0, 255, 204, 0.2);
                z-index: 100 !important; 
            }

            /* 底部操作栏 */
            .ocr-action-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: var(--background-secondary);
                border-top: 1px solid var(--background-modifier-border);
                flex-shrink: 0;
            }
            .ocr-status { font-size: 14px; color: var(--text-muted); }
            .ocr-btn-group { display: flex; gap: 8px; }

            /* ✨ 气泡提示 */
            .ocr-box:hover::after {
                content: attr(data-text);
                position: absolute;
                bottom: 100%; 
                left: 50%;
                transform: translateX(-50%);
                margin-bottom: 8px; 
                
                background: rgba(0, 0, 0, 0.95);
                color: #fff;
                padding: 8px 12px;
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                font-size: 15px;         
                line-height: 1.4;        
                font-family: monospace; 
                
                white-space: pre-wrap;   
                width: max-content;      
                min-width: 100px;        
                max-width: 600px;        
                
                pointer-events: none;
                z-index: 9999;           
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            }
            
            .ocr-box:hover::before {
                content: "";
                position: absolute;
                bottom: 100%;
                left: 50%;
                margin-left: -6px;
                margin-bottom: 2px;
                border-width: 6px;
                border-style: solid;
                border-color: rgba(0, 0, 0, 0.95) transparent transparent transparent;
                z-index: 9999;
                pointer-events: none;
            }
        `;
        const style = document.createElement('style');
        style.id = 'ocr-final-ultimate-style';
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    async performOCR(file) {
        new obsidian.Notice(`正在识别: ${file.name}...`);
        try {
            const adapter = this.app.vault.adapter;
            let fullPath = adapter.getFullPath(file.path);
            let resourcePath = this.app.vault.getResourcePath(file);

            const response = await fetch("http://127.0.0.1:12345/ocr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "image_path": fullPath })
            });

            if (!response.ok) throw new Error(`Server Error: ${response.status}`);
            const data = await response.json();

            if (data.code === 200 && data.items) {
                new OCRModal(this.app, resourcePath, data).open();
            } else {
                new obsidian.Notice("❌ 识别失败");
            }
        } catch (error) {
            console.error(error);
            new obsidian.Notice(`❌ 连接错误: 请确保 ocr_server.py 正在运行`);
        }
    }

    onunload() {
        const style = document.getElementById('ocr-final-ultimate-style');
        if (style) style.remove();
    }
};

class OCRModal extends obsidian.Modal {
    constructor(app, imgSrc, ocrData) {
        super(app);
        this.imgSrc = imgSrc;
        this.ocrData = ocrData;
        this.selectedItems = new Set();
        this.resizeObserver = null;
        
        this.isDragging = false; 
        this.dragMode = true; 
        this.isZoomed = false; 
    }

    onOpen() {
        this.modalEl.addClass("ocr-wide-modal");
        const { contentEl } = this;
        contentEl.empty();
        
        const container = contentEl.createDiv({ cls: "ocr-modal-content ocr-fit-window" });
        const wrapper = container.createDiv({ cls: "ocr-img-wrapper" });
        wrapper.style.width = ""; 
        
        const img = wrapper.createEl("img", { cls: "ocr-base-img" });
        img.src = this.imgSrc;

        const naturalW = this.ocrData.width;
        const naturalH = this.ocrData.height;

        let zoomBtn = null;

        // --- 🖱️ 鼠标定点缩放逻辑 (核心算法) ---
        container.addEventListener("wheel", (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                
                // 1. 获取缩放前的几何信息
                const containerRect = container.getBoundingClientRect();
                const wrapperRect = wrapper.getBoundingClientRect();

                // 2. 如果还在全景模式，先切到自由模式
                if (container.classList.contains("ocr-fit-window")) {
                    container.removeClass("ocr-fit-window");
                    container.addClass("ocr-original-size");
                    wrapper.style.width = `${img.clientWidth}px`; // 锁定当前宽度
                    this.isZoomed = true;
                    if (zoomBtn) zoomBtn.setText("🔍 适应窗口");
                }

                // 3. 计算鼠标在图片上的相对坐标 (缩放中心点)
                // 相对于图片的左上角 (包含被卷去的部分)
                const mouseXOnImage = e.clientX - wrapperRect.left;
                const mouseYOnImage = e.clientY - wrapperRect.top;

                // 4. 计算鼠标在屏幕视口中的坐标
                const mouseXOnScreen = e.clientX - containerRect.left;
                const mouseYOnScreen = e.clientY - containerRect.top;

                // 5. 计算新宽度
                const currentWidth = wrapperRect.width;
                const delta = e.deltaY > 0 ? 0.9 : 1.1; // 滚轮向下缩小，向上放大
                let newWidth = currentWidth * delta;
                
                // 限制范围
                if (newWidth < 200) newWidth = 200;
                if (naturalW && newWidth > naturalW * 10) newWidth = naturalW * 10;

                // 6. 应用新宽度
                wrapper.style.width = `${newWidth}px`;

                // 7. 计算缩放比例
                const scale = newWidth / currentWidth;

                // 8. 调整滚动条 (核心魔法)
                // 原理：新位置 - 鼠标屏幕偏移 = 新的滚动条位置
                // 确保缩放后，鼠标指着的那个点，依然在鼠标底下
                container.scrollLeft = (mouseXOnImage * scale) - mouseXOnScreen;
                container.scrollTop = (mouseYOnImage * scale) - mouseYOnScreen;
            }
        }, { passive: false });

        // --- 双击还原 ---
        container.addEventListener("dblclick", (e) => {
            if (e.target === container || e.target === img) {
                container.removeClass("ocr-original-size");
                container.addClass("ocr-fit-window");
                wrapper.style.width = ""; 
                
                this.isZoomed = false;
                if (zoomBtn) zoomBtn.setText("🔍 原始尺寸");
                new obsidian.Notice("已还原大小");
            }
        });

        container.addEventListener("mouseup", () => { this.isDragging = false; });
        container.addEventListener("mouseleave", () => { this.isDragging = false; });

        const updateStatus = () => {
            statusEl.setText(` | 已选中: ${this.selectedItems.size}`);
        };

        const setItemState = (box, item, isSelected) => {
            if (isSelected) {
                if (!this.selectedItems.has(item)) {
                    box.classList.add('selected');
                    this.selectedItems.add(item);
                }
            } else {
                if (this.selectedItems.has(item)) {
                    box.classList.remove('selected');
                    this.selectedItems.delete(item);
                }
            }
        };

        const updateBoxes = () => {
            const currentW = img.clientWidth;
            const currentH = img.clientHeight;

            if (!currentW || !currentH || !naturalW || !naturalH) return;

            const scaleX = currentW / naturalW;
            const scaleY = currentH / naturalH;

            wrapper.querySelectorAll('.ocr-box').forEach(b => b.remove());

            this.ocrData.items.forEach(item => {
                const loc = item.location;
                const left = loc.left * scaleX;
                const top = loc.top * scaleY;
                const width = (loc.right - loc.left) * scaleX;
                const height = (loc.bottom - loc.top) * scaleY;

                const box = wrapper.createEl("div", { cls: "ocr-box" });
                
                box.style.left = `${left}px`;
                box.style.top = `${top}px`;
                box.style.width = `${width}px`;
                box.style.height = `${height}px`;
                box.dataset.text = item.text; 

                if (this.selectedItems.has(item)) box.classList.add('selected');

                box.onmousedown = (e) => {
                    e.preventDefault(); 
                    e.stopPropagation();
                    this.isDragging = true;
                    const isCurrentlySelected = this.selectedItems.has(item);
                    this.dragMode = !isCurrentlySelected;
                    setItemState(box, item, this.dragMode);
                    updateStatus();
                };

                box.onmouseenter = (e) => {
                    if (this.isDragging) {
                        setItemState(box, item, this.dragMode);
                        updateStatus();
                    }
                };
            });
        };

        img.onload = updateBoxes;
        this.resizeObserver = new ResizeObserver(() => {
            updateBoxes();
        });
        this.resizeObserver.observe(wrapper);

        // 3. 底部操作栏
        const actionBar = contentEl.createDiv({ cls: "ocr-action-bar" });
        const leftGroup = actionBar.createDiv({ cls: "ocr-btn-group" });
        
        zoomBtn = leftGroup.createEl("button", { text: "🔍 原始尺寸" });
        zoomBtn.onclick = () => {
            this.isZoomed = !this.isZoomed;
            if (this.isZoomed) {
                container.removeClass("ocr-fit-window");
                container.addClass("ocr-original-size");
                wrapper.style.width = ""; 
                zoomBtn.setText("🔍 适应窗口");
            } else {
                container.removeClass("ocr-original-size");
                container.addClass("ocr-fit-window");
                wrapper.style.width = "";
                zoomBtn.setText("🔍 原始尺寸");
            }
        };

        leftGroup.createSpan({ text: "💡 Ctrl+滚轮缩放 / 双击还原", style: "font-size: 12px; color: #666; margin-left:8px;" });

        const statusEl = actionBar.createSpan({ cls: "ocr-status", text: " | 已选中: 0", style: "margin-left: 10px;" });

        const rightGroup = actionBar.createDiv({ cls: "ocr-btn-group" });

        const selectAllBtn = rightGroup.createEl("button", { text: "全选" });
        selectAllBtn.onclick = () => {
            wrapper.querySelectorAll('.ocr-box').forEach(b => b.classList.add('selected'));
            this.ocrData.items.forEach(i => this.selectedItems.add(i));
            updateStatus();
        };

        const clearBtn = rightGroup.createEl("button", { text: "清空" });
        clearBtn.onclick = () => {
            wrapper.querySelectorAll('.ocr-box').forEach(b => b.classList.remove('selected'));
            this.selectedItems.clear();
            updateStatus();
        };

        const copyBtn = rightGroup.createEl("button", { text: "复制选中内容", cls: "mod-cta" });
        copyBtn.onclick = () => {
            if (this.selectedItems.size === 0) {
                new obsidian.Notice("⚠️ 请至少选择一个框");
                return;
            }
            const sortedItems = Array.from(this.selectedItems).sort((a, b) => {
                if (Math.abs(a.location.top - b.location.top) < 15) {
                    return a.location.left - b.location.left;
                }
                return a.location.top - b.location.top;
            });

            const fullText = sortedItems.map(i => i.text).join("\n");
            navigator.clipboard.writeText(fullText);
            new obsidian.Notice(`✅ 已复制 ${sortedItems.length} 段文字`);
            this.close();
        };
    }

    onClose() {
        if (this.resizeObserver) this.resizeObserver.disconnect();
        this.contentEl.empty();
    }
}