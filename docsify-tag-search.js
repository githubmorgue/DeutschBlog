// docsify-tag-search.js
// 提供一个工厂函数，返回 afterEach 钩子
function createTagAfterEachHook() {
  const allTags = new Map();

  return function(html, next) {
    // 安全获取当前路径和标题
    const currentPath = this.route.path;
    const pageTitle = document.title || currentPath;

    // 提取标签：支持中文、字母、数字、下划线
    const tagRegex = /(?:^|\s)#([\u4e00-\u9fa5_a-zA-Z0-9]+)/g;
    let match;
    const tags = [];
    while ((match = tagRegex.exec(html)) !== null) {
      tags.push(match[1]);
    }

    // 去重并记录
    [...new Set(tags)].forEach(tag => {
      if (!allTags.has(tag)) allTags.set(tag, []);
      const exists = allTags.get(tag).some(p => p.path === currentPath);
      if (!exists) {
        allTags.get(tag).push({ path: currentPath, title: pageTitle });
      }
    });

    // 渲染为可点击链接
    const newHtml = html.replace(
      /(?:^|\s)#([\u4e00-\u9fa5_a-zA-Z0-9]+)/g,
      (match, tagName) => {
        const prefixSpace = match.startsWith(' ') ? ' ' : '';
        return `${prefixSpace}<a href="#" class="docsify-tag-link" data-tag="${tagName}">#${tagName}</a>`;
      }
    );

    // 暴露全局标签索引（供 DOM 脚本使用）
    window.__DOCSIFY_TAGS__ = allTags;

    next(newHtml);
  };
}