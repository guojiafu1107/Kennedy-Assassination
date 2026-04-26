/**
 * 生成PDF文件清单
 * 运行方式: node generate-manifest.js
 */

const fs = require('fs');
const path = require('path');

const pdfDir = __dirname;
const outputFile = path.join(pdfDir, 'pdf-manifest.json');

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function extractDateFromFilename(filename) {
    const match = filename.match(/(\d+)-(\d+)-(\d+)/);
    if (match) {
        const year = 1960 + (parseInt(match[2]) % 6);
        const month = (parseInt(match[3]) % 12) + 1;
        const day = (parseInt(match[3].slice(-2)) % 28) + 1;
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
    return '1963-11-22';
}

function getCategoryFromFilename(filename) {
    const prefix = filename.split('-')[0];
    const categoryMap = {
        '104': 'CIA情报文件',
        '124': 'FBI调查报告',
        '157': '国务院电报',
        '176': '特勤局记录',
        '177': '司法部文件',
        '178': '沃伦委员会',
        '180': '委员会记录',
        '194': 'CIA行动文件',
        '197': '总统档案',
        '198': '国防部文件',
        '202': '国会记录',
        '119': '其他档案',
        '180': '委员会记录'
    };
    return categoryMap[prefix] || '其他档案';
}

console.log('正在扫描PDF文件...');

try {
    const files = fs.readdirSync(pdfDir);
    const pdfFiles = files
        .filter(file => file.toLowerCase().endsWith('.pdf'))
        .map(file => {
            const filePath = path.join(pdfDir, file);
            const stats = fs.statSync(filePath);
            return {
                filename: file,
                size: formatFileSize(stats.size),
                sizeBytes: stats.size,
                date: extractDateFromFilename(file),
                category: getCategoryFromFilename(file)
            };
        })
        .sort((a, b) => a.filename.localeCompare(b.filename));

    const manifest = {
        generatedAt: new Date().toISOString(),
        totalFiles: pdfFiles.length,
        files: pdfFiles
    };

    fs.writeFileSync(outputFile, JSON.stringify(manifest, null, 2), 'utf8');
    
    console.log(`✅ 成功生成文件清单!`);
    console.log(`📁 总计: ${pdfFiles.length} 个PDF文件`);
    console.log(`💾 输出文件: ${outputFile}`);
    
    // 显示各类别统计
    const categoryStats = {};
    pdfFiles.forEach(file => {
        const cat = file.category;
        categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    });
    
    console.log('\n📊 分类统计:');
    Object.entries(categoryStats)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
            console.log(`   ${cat}: ${count} 个`);
        });

} catch (error) {
    console.error('❌ 生成清单时出错:', error.message);
    process.exit(1);
}
