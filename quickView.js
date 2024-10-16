// src/scripts/quickView.js

(function() {
  let config = {
    quickViewEnabled: false,
    quickViewStyle: 'right'
  };

  function fetchConfig() {
  const storeId = document.body.getAttribute('data-store-id');
  if (!storeId) {
    console.error('Store ID not found');
    return;
  }

  fetch(`https://europe-west3-hmstudio-85f42.cloudfunctions.net/getQuickViewConfig?storeId=${storeId}`)
    .then(response => response.json())
    .then(newConfig => {
      config = newConfig;
      applyConfig();
    })
    .catch(error => console.error('Failed to fetch quick view config:', error));
}

  function applyConfig() {
    if (!config.quickViewEnabled) {
      removeQuickViewButtons();
      return;
    }
    addQuickViewButtons();
  }

  function addQuickViewButtons() {
    const productCards = document.querySelectorAll('.product-card, .product-item, .product-item position-relative, .product-item .position-relative  '); // Adjust selector based on Zid's HTML structure
    productCards.forEach(card => {
      if (card.querySelector('.quick-view-btn')) return; // Skip if button already exists

      const button = document.createElement('button');
      button.className = 'quick-view-btn';
      button.textContent = 'Quick View';
      button.addEventListener('click', (e) => {
        e.preventDefault();
        openQuickView(card.dataset.productId); // Assume product ID is stored in data attribute
      });

      const addToCartBtn = card.querySelector('.add-to-cart-btn, .d-flex flex-column justify-content-start, .d-flex flex-column, .btn btn-primary product-card-add-to-cart, .btn btn-primary .product-card-add-to-cart, .btn btn-primary'); // Adjust selector based on Zid's HTML structure
      if (config.quickViewStyle === 'left') {
        addToCartBtn.parentNode.insertBefore(button, addToCartBtn);
      } else {
        addToCartBtn.parentNode.insertBefore(button, addToCartBtn.nextSibling);
      }
    });
  }

  function removeQuickViewButtons() {
    const quickViewButtons = document.querySelectorAll('.quick-view-btn');
    quickViewButtons.forEach(button => button.remove());
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
    const storeId = document.body.getAttribute('data-store-id');
    if (!storeId) {
      throw new Error('Store ID not found');
    }
    const response = await fetch(`https://api.zid.sa/v1/products/${productId}?store_id=${storeId}`);
    if (!response.ok) throw new Error('Failed to fetch product data');
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
    const storeId = document.body.getAttribute('data-store-id');
    if (!storeId) {
      console.error('Store ID not found');
      return;
    }
    // TODO: Implement add to cart functionality
    console.log('Adding product to cart:', productId, 'for store:', storeId);
  }

  // Fetch config and apply on page load
  fetchConfig();

  // Expose necessary functions
  window.HMStudioQuickView = {
    refreshConfig: fetchConfig,
    openQuickView: openQuickView
  };
})();
