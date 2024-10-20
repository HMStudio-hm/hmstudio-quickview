// src/scripts/quickView.js v1.2.4

(function() {
  console.log('Quick View script initialized');

  // Retrieve store ID from script URL
  const scriptTag = document.currentScript;
  const scriptSrc = scriptTag.src;
  const urlParams = new URLSearchParams(new URL(scriptSrc).search);
  const storeId = urlParams.get('storeId');

  if (!storeId) {
    console.error('Store ID not found in script URL');
    return;
  }

  console.log('Store ID:', storeId);

  let config = {
    quickViewEnabled: false,
    quickViewStyle: 'right'
  };

  // Function to fetch config from API
  function fetchConfigFromAPI(retries = 3, delay = 2000) {
    console.log(`Fetching config from API... (Attempts left: ${retries})`);
    
    // Replace with your actual API URL
    const apiUrl = 'https://14b3-105-157-83-165.ngrok-free.app/api/quick-view-settings';
    
    fetch(`${apiUrl}?storeId=${storeId}`)
      .then(response => {
        console.log('API response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Received config from API:', data);
        if (data.quickViewEnabled === undefined) {
          throw new Error('Invalid config received');
        }
        config = data;
        applyConfig();
      })
      .catch(error => {
        console.error('Error fetching config from API:', error);
        if (retries > 0) {
          console.log(`Retrying in ${delay}ms...`);
          setTimeout(() => fetchConfigFromAPI(retries - 1, delay), delay);
        }
      });
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
  setTimeout(() => fetchConfigFromAPI(), 1000); // Wait 1 second before first attempt

  // Re-apply settings when the page content changes (e.g., infinite scroll)
  const observer = new MutationObserver(() => {
    console.log('Page content changed, re-applying Quick View');
    applyConfig();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  console.log('MutationObserver set up');

  // Expose necessary functions
  window.HMStudioQuickView = {
    refreshConfig: fetchConfigFromAPI,
    openQuickView: openQuickView
  };
  console.log('HMStudioQuickView object exposed to window');
})();
