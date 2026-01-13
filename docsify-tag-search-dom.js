// docsify-tag-search-dom.js

(function () {
  // 触发搜索框输入
  function triggerSearch(query) {
    const input = document.querySelector('.search input[type="search"]');
    if (input) {
      input.value = query;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // 处理标签点击
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('docsify-tag-link')) {
      const tag = e.target.dataset.tag;
      triggerSearch(`#${tag}`);
      e.preventDefault();
      // 可选：滚动到顶部或聚焦搜索框
      const input = document.querySelector('.search input[type="search"]');
      if (input) input.focus();
    }
  });

  // 劫持搜索框输入（实现 #标签 专用搜索）
  function hijackSearch() {
    const input = document.querySelector('.search input[type="search"]');
    const resultsContainer = document.querySelector('.search .results');
    if (!input || !resultsContainer) return;

    // 保存原始 oninput（如果有的话）
    const originalOnInput = input.oninput;

    input.oninput = function (e) {
      const query = this.value.trim();
      if (query.startsWith('#')) {
        const tagName = query.slice(1);
        if (!tagName) {
          resultsContainer.innerHTML = '<li>请输入标签名</li>';
          return;
        }

        const allTags = window.__DOCSIFY_TAGS__ || new Map();
        const matchedPages = [];

        for (const [name, pages] of allTags.entries()) {
          if (name.includes(tagName)) {
            pages.forEach(p => {
              // 去重
              if (!matchedPages.some(m => m.path === p.path)) {
                matchedPages.push(p);
              }
            });
          }
        }

        if (matchedPages.length === 0) {
          resultsContainer.innerHTML = '<li>未找到相关标签</li>';
        } else {
          resultsContainer.innerHTML = matchedPages
            .map(p => `<li><a href="${p.path}">${p.title}</a></li>`)
            .join('');
        }
        return;
      }

      // 非标签查询：恢复默认行为
      if (originalOnInput) {
        originalOnInput.call(this, e);
      } else {
        // 如果没有原始 handler，至少清空结果（让默认搜索接管）
        resultsContainer.innerHTML = '';
      }
    };
  }

  // 等待 Docsify 加载完成后再劫持
  const checkAndHijack = () => {
    if (document.querySelector('.search input[type="search"]')) {
      hijackSearch();
    } else {
      setTimeout(checkAndHijack, 300);
    }
  };
  checkAndHijack();

})();