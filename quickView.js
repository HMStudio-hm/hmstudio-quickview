// src/scripts/quickView.js v1.4.1

(function() {
  console.log('Quick View script initialized');

  const config = window.HMStudioQuickViewConfig || { 
    quickViewStyle: 'right',
    storeId: '',
    authorization: '',
    accessToken: ''
  };
  console.log('Quick View config:', config);

  if (!config.storeId) {
    console.error('Store ID is missing in the configuration');
    return;
  }

  function addQuickViewButtons() {
    console.log('Adding Quick View buttons');
    const productCards = document.querySelectorAll('.product-item.position-relative');
    console.log('Found product cards:', productCards.length);
    
    productCards.forEach(card => {
      if (card.querySelector('.quick-view-btn')) {
        console.log('Quick View button already exists for a product, skipping');
        return;
      }

      const addToCartBtn = card.querySelector('.product-card-add-to-cart');
      if (addToCartBtn) {
        const onClickAttr = addToCartBtn.getAttribute('onClick');
        const match = onClickAttr.match(/'([^']+)'/);
        if (match) {
          const productId = match[1];

          const button = document.createElement('button');
          button.className = 'quick-view-btn';
          button.textContent = 'Quick View';
          button.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Quick View button clicked for product ID:', productId);
            openQuickView(productId);
          });

          console.log('Inserting Quick View button');
          if (config.quickViewStyle === 'left') {
            addToCartBtn.parentNode.insertBefore(button, addToCartBtn);
          } else {
            addToCartBtn.parentNode.insertBefore(button, addToCartBtn.nextSibling);
          }
        } else {
          console.error('Could not extract product ID from Add to Cart button');
        }
      } else {
        console.error('Add to Cart button not found in product card');
      }
    });
  }

  async function openQuickView(productId) {
    console.log('Opening Quick View for product ID:', productId);
    try {
      const productData = await fetchProductData(productId);
      displayQuickViewModal(productData);
    } catch (error) {
      console.error('Failed to open quick view:', error);
      // You might want to display an error message to the user here
    }
  }
  async function fetchProductData(productId) {
    console.log('Fetching product data for ID:', productId);
    const url = `https://api.zid.sa/v1/products/${productId}/`;
    
    const headers = {
      'Store-Id': config.storeId,
      'Role': 'Manager',
      'Authorization': `Bearer ${config.authorization}`,
      'Access-Token': config.accessToken,
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch(url, { 
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        console.error('Failed to fetch product data. Status:', response.status);
        const responseText = await response.text();
        console.error('Response text:', responseText);
        throw new Error(`Failed to fetch product data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received product data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching product data:', error);
      throw error;
    }
  }

  function displayQuickViewModal(productData) {
    console.log('Displaying Quick View modal for product:', productData.name);
    
    // Remove any existing modal
    const existingModal = document.querySelector('.quick-view-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;

    const content = document.createElement('div');
    content.className = 'quick-view-content';
    content.style.cssText = `
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      max-width: 80%;
      max-height: 80%;
      overflow-y: auto;
    `;

    content.innerHTML = `
      <h2>${productData.name.en || productData.name}</h2>
      <img src="${productData.image}" alt="${productData.name.en || productData.name}" style="max-width: 100%; height: auto;">
      <p>${productData.description.en || productData.description}</p>
      <p>Price: ${productData.price}</p>
      <button class="add-to-cart-btn">Add to Cart</button>
      <button class="close-modal-btn">Close</button>
    `;

    modal.appendChild(content);

    content.querySelector('.add-to-cart-btn').addEventListener('click', () => {
      console.log('Add to Cart clicked in Quick View modal');
      addToCart(productData.id);
    });

    content.querySelector('.close-modal-btn').addEventListener('click', () => {
      console.log('Closing Quick View modal');
      modal.remove();
    });

    document.body.appendChild(modal);
    console.log('Quick View modal added to DOM');
  }

  function addToCart(productId) {
    console.log('Adding product to cart:', productId);
    // TODO: Implement actual add to cart functionality
    // This might involve calling a Zid API or triggering an existing add to cart function
  }

  // Initial setup
  console.log('Running initial setup');
  addQuickViewButtons();

  // Re-apply Quick View buttons when the page content changes (e.g., infinite scroll)
  const observer = new MutationObserver(() => {
    console.log('Page content changed, re-applying Quick View buttons');
    addQuickViewButtons();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  console.log('MutationObserver set up');

  // Expose necessary functions
  window.HMStudioQuickView = {
    openQuickView: openQuickView
  };
  console.log('HMStudioQuickView object exposed to window');
})();
