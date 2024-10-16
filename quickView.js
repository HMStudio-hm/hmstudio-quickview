// src/scripts/quickView.js

(function() {
  // Check if the script has already been initialized
  if (window.HMStudioQuickViewInitialized) return;
  window.HMStudioQuickViewInitialized = true;

  let currentSettings = {
    quickViewEnabled: false,
    quickViewStyle: 'right'
  };

  function getStoreId() {
    return document.body.getAttribute('data-store-id');
  }

  function fetchSettings() {
    const storeId = getStoreId();
    if (!storeId) {
      console.error('Store ID not found');
      return;
    }
    fetch(`https://ca5c-105-156-116-5.ngrok-free.app/api/quick-view-settings?storeId=${storeId}`)
      .then(response => response.json())
      .then(settings => {
        currentSettings = settings;
        applySettings();
      })
      .catch(error => console.error('Failed to fetch quick view settings:', error));
  }

  function applySettings() {
    if (!currentSettings.quickViewEnabled) {
      removeQuickViewButtons();
      return;
    }
    addQuickViewButtons();
  }

  function addQuickViewButtons() {
    const productCards = document.querySelectorAll('.product-card'); // Adjust selector based on Zid's HTML structure
    productCards.forEach(card => {
      if (card.querySelector('.quick-view-btn')) return; // Skip if button already exists

      const button = document.createElement('button');
      button.className = 'quick-view-btn';
      button.textContent = 'Quick View';
      button.addEventListener('click', (e) => {
        e.preventDefault();
        openQuickView(card.dataset.productId); // Assume product ID is stored in data attribute
      });

      const addToCartBtn = card.querySelector('.add-to-cart-btn'); // Adjust selector based on Zid's HTML structure
      if (currentSettings.quickViewStyle === 'left') {
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
    const response = await fetch(`https://api.zid.sa/v1/products/${productId}`);
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
    // TODO: Implement add to cart functionality
    console.log('Adding product to cart:', productId);
  }

  // Fetch settings and apply them on page load
  fetchSettings();

  // Re-apply settings when the page content changes (e.g., infinite scroll)
  const observer = new MutationObserver(() => {
    fetchSettings();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Expose public methods
  window.HMStudioQuickView = {
    openQuickView: openQuickView,
    refreshSettings: fetchSettings
  };
})();
