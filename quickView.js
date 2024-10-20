// src/scripts/quickView.js v1.3.0

(function() {
  console.log('Quick View script initialized');

  let config = { quickViewStyle: 'right' };

  function fetchConfig() {
    const storeId = document.body.getAttribute('data-store-id');
    if (!storeId) {
      console.error('Store ID not found');
      return;
    }

    fetch(`https://europe-west3-${FIREBASE_PROJECT_ID}.cloudfunctions.net/getQuickViewConfig?storeId=${storeId}`)
      .then(response => response.json())
      .then(data => {
        config = data;
        console.log('Fetched config:', config);
        applyQuickView();
      })
      .catch(error => console.error('Failed to fetch config:', error));
  }

  function applyQuickView() {
    console.log('Applying Quick View with config:', config);
    addQuickViewButtons();
  }

  function addQuickViewButtons() {
    const productCards = document.querySelectorAll('.product-item, .product-item position-relative'); // Adjust selector based on Zid's HTML structure
    productCards.forEach(card => {
      if (card.querySelector('.quick-view-btn')) return;

      const button = document.createElement('button');
      button.className = 'quick-view-btn';
      button.textContent = 'Quick View';
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = card.dataset.productId;
        openQuickView(productId);
      });

      const addToCartBtn = card.querySelector('.add-to-cart-btn, .d-flex flex-column justify-content-start, .product-item a.product-card-add-to-cart, .product-item a.btn-product-card-out-of-stock, .product-item a.btn-product-card-select-variant, .product-item a.product-card-add-to-cart, a.product-card-add-to-cart'); // Adjust selector based on Zid's HTML structure
      if (addToCartBtn) {
        if (config.quickViewStyle === 'left') {
          addToCartBtn.parentNode.insertBefore(button, addToCartBtn);
        } else {
          addToCartBtn.parentNode.insertBefore(button, addToCartBtn.nextSibling);
        }
      }
    });
  }

  async function openQuickView(productId) {
    try {
      const productData = await fetchProductData(productId);
      displayQuickViewModal(productData);
    } catch (error) {
      console.error('Failed to open quick view:', error);
    }
  }

  async function fetchProductData(productId) {
    const response = await fetch(`https://api.zid.sa/v1/products/${productId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch product data');
    }
    return response.json();
  }

  function displayQuickViewModal(productData) {
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.innerHTML = `
      <div class="quick-view-content">
        <h2>${productData.name}</h2>
        <img src="${productData.image}" alt="${productData.name}">
        <p>${productData.description}</p>
        <p>Price: ${productData.price}</p>
        <button class="add-to-cart-btn">Add to Cart</button>
        <button class="close-modal-btn">Close</button>
      </div>
    `;

    modal.querySelector('.add-to-cart-btn').addEventListener('click', () => addToCart(productData.id));
    modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.remove());

    document.body.appendChild(modal);
  }

  function addToCart(productId) {
    console.log('Adding product to cart:', productId);
    // TODO: Implement actual add to cart functionality
  }

  // Initial setup
  fetchConfig();

  // Re-apply Quick View when the page content changes (e.g., infinite scroll)
  const observer = new MutationObserver(() => {
    console.log('Page content changed, re-applying Quick View');
    applyQuickView();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Expose necessary functions
  window.HMStudioQuickView = {
    refreshConfig: fetchConfig,
    openQuickView: openQuickView
  };
})();
