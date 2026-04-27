/**
 * 肯尼迪遇刺案档案知识库 - 主应用脚本
 */

// ========================================
// 配置文件
// ========================================
const CONFIG = {
    ITEMS_PER_PAGE: 12,
    PDF_DIRECTORY: './',
    ANIMATION_DELAY: 50
};

// ========================================
// 档案分类映射
// ========================================
const CATEGORY_MAP = {
    '104': { name: 'CIA情报文件', color: '#1a365d', icon: 'fa-user-secret' },
    '124': { name: 'FBI调查报告', color: '#2b6cb0', icon: 'fa-file-alt' },
    '157': { name: '国务院电报', color: '#2f855a', icon: 'fa-globe' },
    '176': { name: '特勤局记录', color: '#c05621', icon: 'fa-shield-alt' },
    '177': { name: '司法部文件', color: '#6b46c1', icon: 'fa-balance-scale' },
    '178': { name: '沃伦委员会', color: '#b7791f', icon: 'fa-gavel' },
    '180': { name: '委员会记录', color: '#9c4221', icon: 'fa-landmark' },
    '194': { name: 'CIA行动文件', color: '#285e61', icon: 'fa-eye' },
    '197': { name: '总统档案', color: '#744210', icon: 'fa-flag' },
    '198': { name: '国防部文件', color: '#2c5282', icon: 'fa-fighter-jet' },
    '202': { name: '国会记录', color: '#553c9a', icon: 'fa-university' }
};

// ========================================
// 全局状态
// ========================================
let state = {
    allDocuments: [],
    filteredDocuments: [],
    currentPage: 1,
    currentCategory: '',
    searchQuery: '',
    isLoading: false
};

// ========================================
// 初始化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    showLoading(true);
    
    // 扫描PDF文件
    await scanPdfFiles();
    
    // 初始化事件监听
    initEventListeners();
    
    // 渲染文档列表
    renderDocuments();
    
    // 更新统计
    updateStatistics();
    
    showLoading(false);
}

// ========================================
// 扫描PDF文件
// ========================================
async function scanPdfFiles() {
    try {
        console.log('正在加载档案清单...');
        
        // 从manifest.json加载实际存在的PDF文件列表
        const response = await fetch('pdf-manifest.json?' + Date.now()); // 添加时间戳防止缓存
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const manifest = await response.json();
        
        if (!manifest.files || manifest.files.length === 0) {
            throw new Error('清单文件为空');
        }
        
        state.allDocuments = manifest.files.map((fileInfo, index) => {
            const category = fileInfo.filename.split('-')[0];
            const categoryInfo = CATEGORY_MAP[category] || { 
                name: '其他档案', 
                color: '#4a5568', 
                icon: 'fa-file-pdf' 
            };
            
            return {
                id: index + 1,
                filename: fileInfo.filename,
                docId: fileInfo.filename.replace('.pdf', ''),
                category: category,
                categoryName: categoryInfo.name,
                categoryColor: categoryInfo.color,
                categoryIcon: categoryInfo.icon,
                size: fileInfo.size,
                sizeBytes: (fileInfo.sizeBytes || 0) / 1024, // 转换为KB
                date: fileInfo.date || '1963-11-22',
                title: generateDocumentTitle(category, fileInfo.filename)
            };
        });
        
        state.filteredDocuments = [...state.allDocuments];
        
        console.log(`✅ 已加载 ${state.allDocuments.length} 个档案文件`);
        
        // 显示加载成功的提示
        showNotification(`成功加载 ${state.allDocuments.length} 个档案文件`, 'success');
        
    } catch (error) {
        console.error('❌ 加载档案清单失败:', error);
        
        // 检查是否是本地文件协议
        if (window.location.protocol === 'file:') {
            showNotification('请使用本地服务器访问此网站（file协议不支持fetch）', 'error');
            console.warn('提示: 请使用以下命令启动本地服务器:');
            console.warn('  npx serve .');
            console.warn('  或 python -m http.server 8080');
            console.warn('  或 node -e "require(\'http\').createServer((req,res)=>require(\'fs\').createReadStream(\'.\'+req.url).pipe(res)).listen(8080)"');
        } else {
            showNotification('加载档案清单失败: ' + error.message, 'error');
        }
        
        state.allDocuments = [];
        state.filteredDocuments = [];
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#2f855a' : type === 'error' ? '#c53030' : '#1a365d'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 3000;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 解析文件大小为字节
function parseFileSize(sizeStr) {
    const match = sizeStr.match(/^([\d.]+)\s*(KB|MB|GB)$/i);
    if (!match) return 0;
    const num = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === 'KB') return num;
    if (unit === 'MB') return num * 1024;
    if (unit === 'GB') return num * 1024 * 1024;
    return num;
}

// 从文件名提取日期（模拟）
function extractDateFromFilename(filename) {
    // 使用档案编号中的数字模拟日期
    const match = filename.match(/\d+-\d+-\d+/);
    if (match) {
        const parts = match[0].split('-');
        const year = 1960 + (parseInt(parts[1]) % 6);
        const month = (parseInt(parts[2]) % 12) + 1;
        const day = (parseInt(parts[2].slice(-2)) % 28) + 1;
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
    return generateRandomDate();
}



// 生成文档标题
function generateDocumentTitle(category, filename) {
    const titles = {
        '104': ['情报备忘录', '秘密行动报告', '人员档案', '通讯记录', '任务简报'],
        '124': ['调查报告', '证人证词', '现场记录', '证据清单', '审讯记录'],
        '157': ['外交电报', '使馆报告', '国际通讯', '外交备忘录'],
        '176': ['安保记录', '行动计划', '巡逻报告', '威胁评估'],
        '177': ['法律文件', '起诉书', '司法备忘录', '调查令'],
        '178': ['委员会记录', '听证会笔录', '证据材料', '调查报告'],
        '180': ['证词记录', '会议纪要', '调查报告', '证据档案'],
        '194': ['秘密行动', '情报分析', '人员监视', '任务报告'],
        '197': ['总统文件', '行政命令', '备忘录', '声明文件'],
        '198': ['军事报告', '防御计划', '战略分析', '情报简报'],
        '202': ['国会记录', '听证会材料', '立法文件', '调查档案']
    };
    
    const categoryTitles = titles[category] || ['机密文件'];
    const randomTitle = categoryTitles[Math.floor(Math.random() * categoryTitles.length)];
    return `${randomTitle} - ${filename.replace('.pdf', '')}`;
}

// 生成随机日期（1960-1965年间）
function generateRandomDate() {
    const year = Math.floor(Math.random() * 6) + 1960;
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes.toFixed(0) + ' KB';
    return (bytes / 1024).toFixed(1) + ' MB';
}

// ========================================
// 事件监听初始化
// ========================================
function initEventListeners() {
    // 搜索输入
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => handleSearch(e), 300));
    }
    
    // 分类筛选
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => handleCategoryFilter(e));
    }
    
    // 排序筛选
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => handleSort(e));
    }
    
    // 分类标签
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.addEventListener('click', () => handleTagClick(tag));
    });
    
    // 分页按钮
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => changePage(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changePage(1));
    
    // 移动端菜单
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });
    }
    
    // 导航链接
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            mobileMenu.classList.remove('active');
        });
    });
}

// ========================================
// 搜索和筛选功能
// ========================================
function handleSearch(e) {
    state.searchQuery = e.target.value.toLowerCase();
    state.currentPage = 1;
    filterDocuments();
}

function handleCategoryFilter(e) {
    state.currentCategory = e.target.value;
    state.currentPage = 1;
    filterDocuments();
}

function handleTagClick(tag) {
    // 更新标签样式
    document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
    tag.classList.add('active');
    
    // 更新筛选状态
    state.currentCategory = tag.dataset.category;
    state.currentPage = 1;
    filterDocuments();
}

function handleSort(e) {
    const sortType = e.target.value;
    
    switch(sortType) {
        case 'newest':
            state.filteredDocuments.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            state.filteredDocuments.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'size':
            state.filteredDocuments.sort((a, b) => b.sizeBytes - a.sizeBytes);
            break;
        case 'name':
            state.filteredDocuments.sort((a, b) => a.filename.localeCompare(b.filename));
            break;
    }
    
    renderDocuments();
}

function filterDocuments() {
    console.log('筛选中...', { category: state.currentCategory, query: state.searchQuery, total: state.allDocuments.length });
    
    if (state.allDocuments.length === 0) {
        console.warn('档案列表为空');
        state.filteredDocuments = [];
        renderDocuments();
        return;
    }
    
    state.filteredDocuments = state.allDocuments.filter(doc => {
        // 分类筛选 - doc.category 是 "104" 这样的前缀
        if (state.currentCategory && doc.category !== state.currentCategory) {
            return false;
        }
        
        // 搜索筛选
        if (state.searchQuery) {
            const searchLower = state.searchQuery.toLowerCase();
            const matchFilename = doc.filename.toLowerCase().includes(searchLower);
            const matchTitle = doc.title.toLowerCase().includes(searchLower);
            const matchCategory = doc.categoryName.toLowerCase().includes(searchLower);
            if (!matchFilename && !matchTitle && !matchCategory) {
                return false;
            }
        }
        
        return true;
    });
    
    console.log('筛选结果:', state.filteredDocuments.length, '个');
    
    state.currentPage = 1;
    renderDocuments();
    updatePagination();
}

// ========================================
// 渲染文档列表
// ========================================
function renderDocuments() {
    const grid = document.getElementById('documentsGrid');
    const noResults = document.getElementById('noResults');
    const statsText = document.getElementById('statsText');
    
    if (!grid) return;
    
    const start = (state.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const end = start + CONFIG.ITEMS_PER_PAGE;
    const pageDocuments = state.filteredDocuments.slice(start, end);
    
    // 更新统计信息
    if (statsText) {
        statsText.innerHTML = `<i class="fas fa-database"></i> 显示 ${state.filteredDocuments.length} 个档案中的 ${start + 1}-${Math.min(end, state.filteredDocuments.length)} 个`;
    }
    
    if (pageDocuments.length === 0) {
        grid.innerHTML = '';
        if (noResults) {
            noResults.style.display = 'block';
            // 更新提示信息
            const noResultsTitle = noResults.querySelector('h3');
            const noResultsText = noResults.querySelector('p');
            if (state.allDocuments.length === 0) {
                if (noResultsTitle) noResultsTitle.textContent = '档案数据加载失败';
                if (noResultsText) noResultsText.textContent = '请检查 pdf-manifest.json 文件是否存在，或刷新页面重试';
            } else {
                if (noResultsTitle) noResultsTitle.textContent = '未找到匹配的档案';
                if (noResultsText) noResultsText.textContent = '请尝试调整搜索条件或筛选器';
            }
        }
        return;
    }
    
    if (noResults) noResults.style.display = 'none';
    
    grid.innerHTML = pageDocuments.map((doc, index) => `
        <div class="document-card" onclick="openPdfViewer('${doc.filename}', '${doc.title}')" 
             style="animation-delay: ${index * CONFIG.ANIMATION_DELAY}ms">
            <div class="document-preview">
                <i class="fas ${doc.categoryIcon}"></i>
                <span class="document-badge">${doc.category}</span>
            </div>
            <div class="document-info">
                <div class="document-id">${doc.docId}</div>
                <h4 class="document-title">${doc.title}</h4>
                <div class="document-meta">
                    <span><i class="fas fa-folder"></i> ${doc.categoryName}</span>
                    <span><i class="fas fa-file"></i> ${doc.size}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    updatePagination();
}

// ========================================
// 分页功能
// ========================================
function updatePagination() {
    const totalPages = Math.ceil(state.filteredDocuments.length / CONFIG.ITEMS_PER_PAGE);
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    if (pageInfo) {
        pageInfo.textContent = `第 ${state.currentPage} / ${totalPages} 页 (共 ${state.filteredDocuments.length} 个档案)`;
    }
    
    if (prevBtn) prevBtn.disabled = state.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = state.currentPage >= totalPages;
}

function changePage(direction) {
    const totalPages = Math.ceil(state.filteredDocuments.length / CONFIG.ITEMS_PER_PAGE);
    const newPage = state.currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        state.currentPage = newPage;
        renderDocuments();
        document.getElementById('documents').scrollIntoView({ behavior: 'smooth' });
    }
}

// ========================================
// PDF查看器
// ========================================
// ========================================
// PDF Viewer - 支持本地、外部存储和 NARA 链接
// ========================================

// 配置：PDF 文件的基础 URL
// 选项 1: 空字符串 '' = 使用相对路径（本地，需包含 PDF 文件）
// 选项 2: 'nara' = 使用 NARA 美国国家档案馆官方链接（在线查看）
// 选项 3: 自定义 URL = 如 'https://your-cdn.com/pdfs/'
// 选项 4: CloudBase 腾讯云存储
const PDF_SOURCE = 'https://6a66-jfk-archive-d0gqsjips212627ec-1338548285.tcb.qcloud.la/pdfs/';

// NARA 官方档案基础 URL
const NARA_BASE_URL = 'https://www.archives.gov/files/research/jfk/releases/2023/';

// 获取 PDF 基础 URL
function getPdfBaseUrl() {
    if (PDF_SOURCE === 'nara') {
        return NARA_BASE_URL;
    }
    // 如果 PDF_SOURCE 是完整 URL（如 CloudBase），直接返回
    if (PDF_SOURCE.startsWith('http')) {
        return PDF_SOURCE;
    }
    return PDF_SOURCE;
}

// 配置：当 PDF 不存在时的提示信息
function getPdfNotFoundMessage(filename) {
    if (PDF_SOURCE === 'nara') {
        return `
            <div style="padding: 40px; text-align: center; color: #666;">
                <div style="font-size: 64px; margin-bottom: 20px;">🔍</div>
                <h2 style="color: #333; margin-bottom: 15px;">无法加载档案</h2>
                <p style="margin-bottom: 20px; line-height: 1.6;">
                    该档案在 NARA 官方数据库中可能不存在或链接已失效。<br>
                    请尝试直接访问 <a href="https://www.archives.gov/research/jfk" target="_blank" style="color: #c9a227;">NARA 官网</a> 搜索该档案。
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; display: inline-block;">
                    <p style="margin: 0; font-family: monospace; font-size: 14px;">
                        档案编号：${filename}
                    </p>
                </div>
                <p style="margin-top: 20px; font-size: 14px; color: #999;">
                    当前使用 NARA 官方数据源
                </p>
            </div>
        `;
    }
    
    if (PDF_SOURCE.startsWith('http')) {
        return `
            <div style="padding: 40px; text-align: center; color: #666;">
                <div style="font-size: 64px; margin-bottom: 20px;">☁️</div>
                <h2 style="color: #333; margin-bottom: 15px;">档案未上传</h2>
                <p style="margin-bottom: 20px; line-height: 1.6;">
                    该档案尚未上传到云存储。<br>
                    请联系管理员上传该文件。
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; display: inline-block;">
                    <p style="margin: 0; font-family: monospace; font-size: 14px;">
                        档案编号：${filename}
                    </p>
                </div>
                <p style="margin-top: 20px; font-size: 14px; color: #999;">
                    当前使用腾讯云 CloudBase 存储
                </p>
            </div>
        `;
    }
    
    return `
        <div style="padding: 40px; text-align: center; color: #666;">
            <div style="font-size: 64px; margin-bottom: 20px;">📄</div>
            <h2 style="color: #333; margin-bottom: 15px;">PDF 文件暂不可用</h2>
            <p style="margin-bottom: 20px; line-height: 1.6;">
                该档案文件未包含在当前部署中。<br>
                如需查看完整档案，请在本地运行网站。
            </p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left; display: inline-block;">
                <p style="margin: 0 0 10px 0; font-weight: bold;">本地运行步骤：</p>
                <ol style="margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li>从 GitHub 克隆完整项目（包含所有 PDF 文件）</li>
                    <li>双击运行 <code>start-server.bat</code></li>
                    <li>访问 <code>http://localhost:8080</code></li>
                </ol>
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #999;">
                档案编号：${filename}
            </p>
        </div>
    `;
}

function openPdfViewer(filename, title) {
    const modal = document.getElementById('pdfModal');
    const viewer = document.getElementById('pdfViewer');
    const modalTitle = document.getElementById('modalTitle');
    const downloadLink = document.getElementById('downloadLink');
    
    if (!modal || !viewer) return;
    
    modalTitle.textContent = title || filename;
    
    // 构建 PDF URL
    const baseUrl = getPdfBaseUrl();
    const pdfUrl = baseUrl ? `${baseUrl}${filename}` : `./${filename}`;
    
    // 先尝试加载 PDF，如果失败则显示提示
    viewer.src = pdfUrl;
    downloadLink.href = pdfUrl;
    downloadLink.download = filename;
    
    // 监听加载错误
    viewer.onerror = () => showPdfNotFound(viewer, filename);
    
    // 设置超时检查（iframe 加载完成时间）
    setTimeout(() => {
        try {
            // 尝试访问 iframe 内容，如果跨域或 404 会抛出错误
            const iframeDoc = viewer.contentDocument || viewer.contentWindow?.document;
            if (iframeDoc && iframeDoc.body) {
                const bodyText = iframeDoc.body.innerText || '';
                // 检查是否包含错误信息（如 404 页面）
                if (bodyText.includes('404') || bodyText.includes('not found') || bodyText.includes('不存在')) {
                    showPdfNotFound(viewer, filename);
                }
            }
        } catch (e) {
            // 跨域错误，无法检查内容，继续显示
        }
    }, 2000);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 显示 PDF 不存在提示
function showPdfNotFound(viewer, filename) {
    // 创建错误提示页面
    const errorHtml = getPdfNotFoundMessage(filename);
    
    // 使用 data URL 显示错误信息
    const errorBlob = new Blob([`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            </style>
        </head>
        <body>
            ${errorHtml}
        </body>
        </html>
    `], { type: 'text/html' });
    
    viewer.src = URL.createObjectURL(errorBlob);
    
    // 禁用下载按钮
    const downloadLink = document.getElementById('downloadLink');
    if (downloadLink) {
        downloadLink.style.opacity = '0.5';
        downloadLink.style.pointerEvents = 'none';
        downloadLink.title = 'PDF 文件暂不可用';
    }
}

// 下载 PDF 前检查
function downloadPDF() {
    const downloadLink = document.getElementById('downloadLink');
    const viewer = document.getElementById('pdfViewer');
    
    // 检查当前是否显示的是错误页面
    if (viewer && viewer.src && viewer.src.startsWith('blob:')) {
        alert('PDF 文件暂不可用，请在本地运行网站以查看完整档案。');
        return false;
    }
    return true;
}

function closeModal() {
    const modal = document.getElementById('pdfModal');
    const viewer = document.getElementById('pdfViewer');
    
    if (modal) modal.classList.remove('active');
    if (viewer) viewer.src = '';
    document.body.style.overflow = '';
}

// 点击模态框背景关闭
document.addEventListener('click', (e) => {
    const modal = document.getElementById('pdfModal');
    if (e.target === modal) {
        closeModal();
    }
});

// ESC键关闭模态框
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ========================================
// 高级搜索
// ========================================
function performAdvancedSearch() {
    const docIdInput = document.getElementById('docIdSearch');
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');
    const agencyInput = document.getElementById('agencySearch');
    const sizeFilterInput = document.getElementById('sizeFilter');
    const keywordsInput = document.getElementById('keywordSearch');
    
    const docId = docIdInput?.value.toLowerCase() || '';
    const dateFrom = dateFromInput?.value;
    const dateTo = dateToInput?.value;
    const agency = agencyInput?.value;
    const sizeFilter = sizeFilterInput?.value;
    const keywords = keywordsInput?.value.toLowerCase() || '';
    
    state.filteredDocuments = state.allDocuments.filter(doc => {
        // 档案编号筛选
        if (docId && !doc.docId.toLowerCase().includes(docId)) {
            return false;
        }
        
        // 日期范围筛选
        if (dateFrom && new Date(doc.date) < new Date(dateFrom)) {
            return false;
        }
        if (dateTo && new Date(doc.date) > new Date(dateTo)) {
            return false;
        }
        
        // 机构筛选
        if (agency) {
            const agencyMap = {
                'CIA': '104',
                'FBI': '124',
                'State': '157',
                'DOD': '198',
                'WhiteHouse': '197'
            };
            if (!doc.category.startsWith(agencyMap[agency])) {
                return false;
            }
        }
        
        // 大小筛选
        if (sizeFilter) {
            const sizeKB = doc.sizeBytes;
            switch(sizeFilter) {
                case 'small':
                    if (sizeKB >= 500) return false;
                    break;
                case 'medium':
                    if (sizeKB < 500 || sizeKB >= 2048) return false;
                    break;
                case 'large':
                    if (sizeKB < 2048) return false;
                    break;
            }
        }
        
        // 关键词筛选
        if (keywords) {
            const keywordList = keywords.split(' ').filter(k => k);
            const docText = `${doc.filename} ${doc.title} ${doc.categoryName}`.toLowerCase();
            if (!keywordList.some(k => docText.includes(k))) {
                return false;
            }
        }
        
        return true;
    });
    
    state.currentPage = 1;
    renderDocuments();
    
    // 滚动到结果区域
    const documentsSection = document.getElementById('documents');
    if (documentsSection) {
        documentsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function resetSearch() {
    document.getElementById('docIdSearch').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    document.getElementById('agencySearch').value = '';
    document.getElementById('sizeFilter').value = '';
    document.getElementById('keywordSearch').value = '';
    
    state.filteredDocuments = [...state.allDocuments];
    state.currentPage = 1;
    renderDocuments();
}

// ========================================
// 工具函数
// ========================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function showLoading(show) {
    state.isLoading = show;
    // 可以添加加载动画
}

function updateStatistics() {
    const totalDocs = document.getElementById('totalDocs');
    if (totalDocs && state.allDocuments.length > 0) {
        // 动画显示数字
        animateNumber(totalDocs, 0, state.allDocuments.length, 1000);
    }
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeProgress);
        
        element.textContent = current.toLocaleString() + '+';
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ========================================
// 导出全局函数（供HTML调用）
// ========================================
window.scrollToSection = scrollToSection;
window.openPdfViewer = openPdfViewer;
window.closeModal = closeModal;
window.performAdvancedSearch = performAdvancedSearch;
window.resetSearch = resetSearch;
window.downloadPDF = downloadPDF;
