// docsify-tag-search.js

// === 第一部分：配置 $docsify（必须提前执行）===
window.$docsify = window.$docsify || {};

(function () {
  let allTags = new Map(); // 全局标签索引: tagName -> [{path, title}]

  // 提取 #标签（支持中文、字母、数字、下划线）
  function extractTags(html) {
    const regex = /(?:^|\s)#([\u4e00-\u9fa5_a-zA-Z0-9]+)/g;
    const tags = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      tags.push(match[1]);
    }
    return [...new Set(tags)];
  }

  // 将 #标签 替换为可点击链接
  function renderTagLinks(html) {
    return html.replace(
      /(?:^|\s)#([\u4e00-\u9fa5_a-zA-Z0-9]+)/g,
      (match, tagName) => {
        const prefixSpace = match.startsWith(' ') ? ' ' : '';
        return `${prefixSpace}<a href="#" class="docsify-tag-link" data-tag="${tagName}">#${tagName}</a>`;
      }
    );
  }

  // 注册 afterEach 钩子（关键！必须在 Docsify 启动前设置）
  const originalAfterEach = window.$docsify.afterEach;
  window.$docsify.afterEach = function (html, next) {
    const currentPath = this.route.path;
    const pageTitle = document.title || currentPath;

    // 提取并记录标签
    const tags = extractTags(html);
    tags.forEach(tag => {
      if (!allTags.has(tag)) allTags.set(tag, []);
      // 避免重复添加同一页
      const exists = allTags.get(tag).some(p => p.path === currentPath);
      if (!exists) {
        allTags.get(tag).push({ path: currentPath, title: pageTitle });
      }
    });

    // 渲染为可点击链接
    const newHtml = renderTagLinks(html);
    next(newHtml);
  };

  // 暴露 allTags 到全局（供后续 DOM 脚本使用）
  window.__DOCSIFY_TAGS__ = allTags;

})();