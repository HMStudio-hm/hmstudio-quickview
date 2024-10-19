// src/scripts/quickView.js v1.1.0

(function() {
  console.log('Quick View script initialized');

  let config = {
    quickViewEnabled: false,
    quickViewStyle: 'right'
  };

  function fetchConfig() {
    console.log('Fetching config...');
    const storeId = document.body.getAttribute('data-store-id');
    console.log('Store ID from attribute:', storeId);
    console.log('Body attributes:', Array.from(document.body.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', '));
    
    if (!storeId) {
      console.error('Store ID not found');
      return;
    }

    fetch(`https://europe-west3-hmstudio-85f42.cloudfunctions.net/getQuickViewConfig?storeId=${storeId}`)
      .then(response => {
        console.log('Config response status:', response.status);
        return response.json();
      })
      .then(newConfig => {
        console.log('Received config:', newConfig);
        config = newConfig;
        applyConfig();
      })
      .catch(error => console.error('Failed to fetch quick view config:', error));
  }

  function applyConfig() {
    console.log('Applying config:', config);
    if (!config.quickViewEnabled) {
      console.log('Quick View is disabled, removing buttons');
      removeQuickViewButtons();
      return;
    }
    console.log('Quick View is enabled, adding buttons');
    addQuickViewButtons();
  }

  function addQuickViewButtons() {
    console.log('Adding Quick View buttons');
    const productCards = document.querySelectorAll('.product-card'); // Adjust selector based on Zid's HTML structure
    console.log('Found product cards:', productCards.length);
    productCards.forEach(card => {
      if (card.querySelector('.quick-view-btn')) {
        console.log('Quick View button already exists for a product, skipping');
        return;
      }

      const button = document.createElement('button');
      button.className = 'quick-view-btn';
      button.textContent = 'Quick View';
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = card.dataset.productId;
        console.log('Quick View button clicked for product ID:', productId);
        openQuickView(productId);
      });

      const addToCartBtn = card.querySelector('.add-to-cart-btn'); // Adjust selector based on Zid's HTML structure
      if (addToCartBtn) {
        console.log('Inserting Quick View button');
        if (config.quickViewStyle === 'left') {
          addToCartBtn.parentNode.insertBefore(button, addToCartBtn);
        } else {
          addToCartBtn.parentNode.insertBefore(button, addToCartBtn.nextSibling);
        }
      } else {
        console.error('Add to Cart button not found in product card');
      }
    });
  }

  function removeQuickViewButtons() {
    console.log('Removing Quick View buttons');
    const quickViewButtons = document.querySelectorAll('.quick-view-btn');
    quickViewButtons.forEach(button => button.remove());
    console.log('Removed Quick View buttons:', quickViewButtons.length);
  }

  async function openQuickView(productId) {
    console.log('Opening Quick View for product ID:', productId);
    try {
      const productData = await fetchProductData(productId);
      displayQuickViewModal(productData);
    } catch (error) {
      console.error('Failed to open quick view:', error);
    }
  }

  async function fetchProductData(productId) {
    console.log('Fetching product data for ID:', productId);
    const response = await fetch(`https://api.zid.sa/v1/products/${productId}`);
    if (!response.ok) {
      console.error('Failed to fetch product data. Status:', response.status);
      throw new Error('Failed to fetch product data');
    }
    const data = await response.json();
    console.log('Received product data:', data);
    return data;
  }

  function displayQuickViewModal(productData) {
    console.log('Displaying Quick View modal for product:', productData.name);
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

    modal.querySelector('.add-to-cart-btn').addEventListener('click', () => {
      console.log('Add to Cart clicked in Quick View modal');
      addToCart(productData.id);
    });
    modal.querySelector('.close-modal-btn').addEventListener('click', () => {
      console.log('Closing Quick View modal');
      modal.remove();
    });

    document.body.appendChild(modal);
    console.log('Quick View modal added to DOM');
  }

  function addToCart(productId) {
    console.log('Adding product to cart:', productId);
    // TODO: Implement actual add to cart functionality
  }

  // Initial setup
  console.log('Running initial setup');
  fetchConfig();

  // Re-apply settings when the page content changes (e.g., infinite scroll)
  const observer = new MutationObserver(() => {
    console.log('Page content changed, re-applying Quick View');
    applyConfig();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  console.log('MutationObserver set up');

  // Expose necessary functions
  window.HMStudioQuickView = {
    refreshConfig: fetchConfig,
    openQuickView: openQuickView
  };
  console.log('HMStudioQuickView object exposed to window');
})();
