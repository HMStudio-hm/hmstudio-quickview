// src/scripts/quickView.js v1.1.4

(function() {
  console.log('Quick View script initialized');

  const storeId = new URL(document.currentScript.src).searchParams.get('storeId');
  if (!storeId) {
    console.error('Store ID not found in script URL');
    return;
  }

  async function fetchConfig() {
    try {
      const response = await fetch(`https://europe-west3-hmstudio-85f42.cloudfunctions.net/getQuickViewConfig?storeId=${storeId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const config = await response.json();
      console.log('Fetched config:', config);
      applyConfig(config);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  }

  function applyConfig(config) {
    if (config.quickViewEnabled) {
      addQuickViewButtons(config.quickViewStyle);
    } else {
      removeQuickViewButtons();
    }
  }

  function addQuickViewButtons(style) {
    const productCards = document.querySelectorAll('.product-item'); // Adjust this selector
    productCards.forEach(card => {
      if (card.querySelector('.quick-view-btn')) return;
      
      const button = document.createElement('button');
      button.className = 'quick-view-btn';
      button.textContent = 'Quick View';
      button.onclick = () => openQuickView(card.dataset.productId);

      const addToCartBtn = card.querySelector('.add-to-cart-btn, .product-card-add-to-cart, .product-item a.product-card-add-to-cart, .product-item a.btn-product-card-out-of-stock, .product-item a.btn-product-card-select-variant, .product-item a.product-card-add-to-cart'); // Adjust this selector
      if (addToCartBtn) {
        if (style === 'left') {
          addToCartBtn.parentNode.insertBefore(button, addToCartBtn);
        } else {
          addToCartBtn.parentNode.insertBefore(button, addToCartBtn.nextSibling);
        }
      }
    });
  }

  function removeQuickViewButtons() {
    document.querySelectorAll('.quick-view-btn').forEach(btn => btn.remove());
  }

  function openQuickView(productId) {
    console.log('Opening quick view for product:', productId);
    // Implement your quick view logic here
  }

  // Initial setup
  fetchConfig();

  // Re-apply on page content changes
  new MutationObserver(fetchConfig).observe(document.body, { childList: true, subtree: true });
})();
