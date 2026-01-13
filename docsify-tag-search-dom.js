// docsify-tag-search-dom.js
(function () {
  // 等待 Docsify 搜索功能加载完成
  function waitForSearch() {
    const input = document.querySelector('.search input[type="search"]');
    const resultsContainer = document.querySelector('.search .results');
    
    if (input && resultsContainer) {
      // 添加标签点击处理
      document.addEventListener('click', function (e) {
        if (e.target.classList.contains('docsify-tag-link')) {
          const tag = e.target.dataset.tag;
          const searchInput = document.querySelector('.search input[type="search"]');
          if (searchInput) {
            searchInput.value = `#${tag}`;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.focus();
            e.preventDefault();
          }
        }
      });
      
      // 劫持搜索输入
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
        } else if (originalOnInput) {
          // 非标签查询：恢复默认行为
          originalOnInput.call(this, e);
        }
      };
    } else {
      setTimeout(waitForSearch, 300);
    }
  }
  
  waitForSearch();
})();