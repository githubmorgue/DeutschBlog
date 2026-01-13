// docsify-tag-search.js

(function () {
  let allTags = new Map(); // { tagName: [page1, page2, ...] }

  // 工具函数：从文本中提取 #标签（仅限字母、数字、中文、下划线）
  function extractTags(text) {
    const tagRegex = /(?:^|\s)#([\u4e00-\u9fa5_a-zA-Z0-9]+)/g;
    const tags = [];
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
      tags.push(match[1]);
    }
    return [...new Set(tags)]; // 去重
  }

  // 将 #标签 转为可点击链接
  function renderTagLinks(html) {
    return html.replace(
      /(?:^|\s)#([\u4e00-\u9fa5_a-zA-Z0-9]+)/g,
      (match, tagName) => {
        const space = match.startsWith(' ') ? ' ' : '';
        return `${space}<a href="javascript:void(0)" class="docsify-tag" data-tag="${tagName}">#${tagName}</a>`;
      }
    );
  }

  // 触发侧边栏搜索（模拟用户输入）
  function triggerSearch(query) {
    const searchInput = document.querySelector('.search input[type="search"]');
    if (searchInput) {
      searchInput.value = query;
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
    }
  }

  // 自定义搜索逻辑
  function customSearch(query) {
    if (!query.startsWith('#')) return null; // 不是标签查询，交给默认搜索

    const tagName = query.slice(1).trim();
    if (!tagName) return [];

    const results = [];
    for (const [name, pages] of allTags.entries()) {
      if (name.includes(tagName)) {
        pages.forEach(page => {
          results.push({
            title: page.title,
            path: page.path,
            body: `#${name}`
          });
        });
      }
    }
    return results;
  }

  // 初始化插件
  window.$docsify = window.$docsify || {};
  const originalAfterEach = window.$docsify.afterEach;
  const originalSearch = window.$docsify.search;

  // 1. 提取当前页标签，并渲染为可点击链接
  window.$docsify.afterEach = function (html, next) {
    const currentPath = this.route.path;
    const currentPageTitle = document.title || currentPath;

    const tags = extractTags(html);
    tags.forEach(tag => {
      if (!allTags.has(tag)) allTags.set(tag, []);
      allTags.get(tag).push({ path: currentPath, title: currentPageTitle });
    });

    const newHtml = renderTagLinks(html);
    next(newHtml);
  };

  // 2. 拦截点击 .docsify-tag
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('docsify-tag')) {
      const tag = e.target.dataset.tag;
      triggerSearch(`#${tag}`);
      e.preventDefault();
    }
  });

  // 3. 自定义搜索（需配合 docsify-plugin-search）
  window.$docsify.search = {
    ...originalSearch,
    placeholder: '输入关键词或 #标签',
    noData: '无结果',
    paths: 'auto',
    depth: 6,
    hideOtherSidebarContent: false,
    // 关键：替换搜索函数
    search: function (query, strings) {
      const customResults = customSearch(query);
      if (customResults !== null) {
        return customResults;
      }
      // 否则走默认逻辑（需手动实现或保留原逻辑）
      // Docsify 默认搜索较复杂，这里我们 fallback 到原插件
      return []; // 实际上我们无法轻易复用原搜索，所以建议：仅当非标签时才用原搜索
    }
  };

  // 💡 替代方案：不覆盖 search.search，而是监听输入框
  // 因为完全接管搜索逻辑较复杂，我们改用“劫持输入”方式

  // 4. 劫持搜索输入框（更可靠）
  setTimeout(() => {
    const searchInput = document.querySelector('.search input[type="search"]');
    if (searchInput) {
      let originalHandler = null;

      // 找到 Docsify 绑定的 input 事件处理器（比较 tricky）
      // 更简单做法：覆盖 oninput
      const originalOnInput = searchInput.oninput;
      searchInput.oninput = function (e) {
        const query = this.value.trim();
        if (query.startsWith('#')) {
          // 执行自定义标签搜索
          const tagName = query.slice(1);
          const resultsContainer = document.querySelector('.search .results');
          if (resultsContainer) {
            if (!tagName) {
              resultsContainer.innerHTML = '<li>请输入标签名</li>';
              return;
            }

            const matched = [];
            for (const [name, pages] of allTags.entries()) {
              if (name.includes(tagName)) {
                pages.forEach(p => {
                  if (!matched.some(m => m.path === p.path)) {
                    matched.push(p);
                  }
                });
              }
            }

            if (matched.length === 0) {
              resultsContainer.innerHTML = '<li>未找到相关标签</li>';
            } else {
              resultsContainer.innerHTML = matched.map(p =>
                `<li><a href="${p.path}">${p.title}</a></li>`
              ).join('');
            }
          }
          return;
        }

        // 非标签查询，恢复默认行为
        if (originalOnInput) originalOnInput.call(this, e);
      };
    }
  }, 1000); // 等待 Docsify 加载完成

})();