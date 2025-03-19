// @charset UTF-8
// docx.js - 通过CDN引入docx库

// 创建一个模块对象
const docxModule = {
    // 动态加载docx库
    loadDocxLibrary: async function() {
        return new Promise((resolve, reject) => {
            // 检查是否已经加载
            if (window.docx) {
                resolve(window.docx);
                return;
            }
            
            // 创建script元素
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/docx@7.8.2/build/index.js';
            script.async = true;
            
            // 加载成功回调
            script.onload = () => {
                // 将全局docx对象的内容复制到模块导出对象
                if (window.docx) {
                    resolve(window.docx);
                } else {
                    reject(new Error('docx库加载成功但未找到全局docx对象'));
                }
            };
            
            // 加载失败回调
            script.onerror = () => {
                reject(new Error('无法加载docx库'));
            };
            
            // 添加到文档
            document.head.appendChild(script);
        });
    },
    
    // 获取docx组件
    getDocxComponents: async function() {
        try {
            const docx = await this.loadDocxLibrary();
            return {
                Document: docx.Document,
                Paragraph: docx.Paragraph,
                TextRun: docx.TextRun,
                Table: docx.Table,
                TableRow: docx.TableRow,
                TableCell: docx.TableCell,
                BorderStyle: docx.BorderStyle,
                AlignmentType: docx.AlignmentType,
                HeadingLevel: docx.HeadingLevel,
                WidthType: docx.WidthType,
                Packer: docx.Packer
            };
        } catch (error) {
            console.error('获取docx组件时出错:', error);
            throw error;
        }
    }
};

// 预加载docx库
document.addEventListener('DOMContentLoaded', function() {
    docxModule.loadDocxLibrary().catch(error => {
        console.error('预加载docx库时出错:', error);
    });
});

// 将模块对象暴露给全局作用域
window.docxModule = docxModule;

// 导出默认模块
export default {
    async getDocxComponents() {
        return await getDocxComponents();
    }
};

// 导出具体的类和方法，与docx库保持一致
export const Document = async () => (await loadDocxLibrary()).Document;
export const Paragraph = async () => (await loadDocxLibrary()).Paragraph;
export const TextRun = async () => (await loadDocxLibrary()).TextRun;
export const Table = async () => (await loadDocxLibrary()).Table;
export const TableRow = async () => (await loadDocxLibrary()).TableRow;
export const TableCell = async () => (await loadDocxLibrary()).TableCell;
export const BorderStyle = async () => (await loadDocxLibrary()).BorderStyle;
export const AlignmentType = async () => (await loadDocxLibrary()).AlignmentType;
export const HeadingLevel = async () => (await loadDocxLibrary()).HeadingLevel;
export const WidthType = async () => (await loadDocxLibrary()).WidthType;

// 提供一个统一的导入方法，返回所有需要的组件
export async function getDocxComponents() {
    const docx = await loadDocxLibrary();
    return {
        Document: docx.Document,
        Paragraph: docx.Paragraph,
        TextRun: docx.TextRun,
        Table: docx.Table,
        TableRow: docx.TableRow,
        TableCell: docx.TableCell,
        BorderStyle: docx.BorderStyle,
        AlignmentType: docx.AlignmentType,
        HeadingLevel: docx.HeadingLevel,
        WidthType: docx.WidthType,
        Packer: docx.Packer  // 添加Packer组件，用于生成Word文档
    };
}