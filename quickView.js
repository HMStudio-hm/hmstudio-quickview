// src/scripts/quickView.js

(function() {
  let config = {
    quickViewEnabled: false,
    quickViewStyle: 'right'
  };

  const HARDCODED_MANAGER_ID = '646181'; // Hardcoded manager ID for testing

  function log(message) {
    console.log(`[HMStudio QuickView]: ${message}`);
  }

  function fetchConfig() {
    // Use hardcoded manager ID for testing
    const managerId = HARDCODED_MANAGER_ID;
    log(`Using hardcoded manager ID for testing: ${managerId}`);

    // Keeping the original logic commented out for future use
    // const managerId = document.body.getAttribute('data-manager-id');
    // if (!managerId) {
    //   log('Manager ID not found');
    //   return;
    // }

    log(`Fetching config for manager: ${managerId}`);
    fetch(`https://8f13-41-141-105-37.ngrok-free.app/getQuickViewConfig?managerId=${managerId}`)
      .then(response => response.json())
      .then(newConfig => {
        config = newConfig;
        log(`Config fetched: ${JSON.stringify(config)}`);
        applyConfig();
      })
      .catch(error => log(`Failed to fetch quick view config: ${error}`));
  }

  function applyConfig() {
    if (!config.quickViewEnabled) {
      log('Quick View is disabled. Removing buttons.');
      removeQuickViewButtons();
      return;
    }
    log('Quick View is enabled. Adding buttons.');
    addQuickViewButtons();
  }

  function addQuickViewButtons() {
    log('Starting to add Quick View buttons');
    const productElements = document.querySelectorAll('[data-product-id]');
    log(`Found ${productElements.length} product elements`);

    productElements.forEach((element, index) => {
      log(`Processing product element ${index + 1}`);
      if (element.querySelector('.quick-view-btn')) {
        log('Quick View button already exists for this product. Skipping.');
        return;
      }

      const productId = element.getAttribute('data-product-id');
      log(`Creating Quick View button for product ID: ${productId}`);

      const button = createQuickViewButton(productId);
      
      // Find the best place to insert the button
      const insertionPoint = findInsertionPoint(element);
      if (insertionPoint) {
        log('Inserting Quick View button');
        insertButton(insertionPoint, button);
      } else {
        log('Could not find a suitable insertion point. Appending to product element.');
        element.appendChild(button);
      }
    });
  }

  function createQuickViewButton(productId) {
    const button = document.createElement('button');
    button.className = 'quick-view-btn';
    button.textContent = 'Quick View';
    button.setAttribute('data-product-id', productId);
    button.style.cssText = `
      background-color: #4CAF50;
      border: none;
      color: white;
      padding: 10px 20px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      font-size: 14px;
      margin: 4px 2px;
      cursor: pointer;
      border-radius: 4px;
    `;
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      log(`Quick View button clicked for product ID: ${productId}`);
      openQuickView(productId);
    });

    return button;
  }

  function findInsertionPoint(productElement) {
    // List of possible selectors for the Add to Cart button or other suitable insertion points
    const possibleSelectors = [
      '.add-to-cart-button', 
      '.add-to-cart', 
      '.product-action', 
      '.product-info',
      '.product-details'
    ];

    for (let selector of possibleSelectors) {
      const element = productElement.querySelector(selector);
      if (element) {
        log(`Found insertion point using selector: ${selector}`);
        return element;
      }
    }

    log('Could not find a predefined insertion point');
    return null;
  }

  function insertButton(insertionPoint, button) {
    if (config.quickViewStyle === 'left') {
      insertionPoint.parentNode.insertBefore(button, insertionPoint);
    } else {
      insertionPoint.parentNode.insertBefore(button, insertionPoint.nextSibling);
    }
  }

  function removeQuickViewButtons() {
    const quickViewButtons = document.querySelectorAll('.quick-view-btn');
    log(`Removing ${quickViewButtons.length} Quick View buttons`);
    quickViewButtons.forEach(button => button.remove());
  }

  async function openQuickView(productId) {
    log(`Opening Quick View for product ID: ${productId}`);
    try {
      const productData = await fetchProductData(productId);
      displayQuickViewModal(productData);
    } catch (error) {
      log(`Failed to open quick view: ${error}`);
    }
  }

  async function fetchProductData(productId) {
    log(`Fetching product data for ID: ${productId}`);
    const response = await fetch(`https://api.zid.sa/v1/products/${productId}`);
    if (!response.ok) throw new Error(`Failed to fetch product data: ${response.statusText}`);
    return response.json();
  }

  function displayQuickViewModal(productData) {
    log('Displaying Quick View modal');
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.style.cssText = `
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0,0,0,0.4);
      display: flex;
      justify-content: center;
      align-items: center;
    `;

    modal.innerHTML = `
      <div class="quick-view-content" style="background-color: #fefefe; padding: 20px; border: 1px solid #888; width: 80%; max-width: 600px;">
        <h2>${productData.name}</h2>
        <img src="${productData.image}" alt="${productData.name}" style="max-width: 100%; height: auto;">
        <p>${productData.description}</p>
        <p>Price: ${productData.price}</p>
        <button class="add-to-cart-btn" style="background-color: #4CAF50; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer;">Add to Cart</button>
        <button class="close-modal-btn" style="background-color: #f44336; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer;">Close</button>
      </div>
    `;

    modal.querySelector('.add-to-cart-btn').addEventListener('click', () => addToCart(productData.id));
    modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.remove());

    document.body.appendChild(modal);
  }

  function addToCart(productId) {
    log(`Adding product to cart: ${productId}`);
    // TODO: Implement add to cart functionality
  }

  // Fetch config and apply on page load
  log('Initializing HMStudio QuickView');
  fetchConfig();

  // Reapply config when the page content changes (e.g., for infinite scroll or AJAX updates)
  const observer = new MutationObserver((mutations) => {
    log('Page content changed. Reapplying config.');
    fetchConfig();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Expose necessary functions
  window.HMStudioQuickView = {
    refreshConfig: fetchConfig,
    openQuickView: openQuickView
  };
})();
