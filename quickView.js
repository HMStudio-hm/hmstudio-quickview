// src/scripts/quickView.js v1.3.6

(function() {
  console.log('Quick View script initialized');

  const config = window.HMStudioQuickViewConfig || { 
    quickViewStyle: 'right',
    storeId: '',
    firebaseConfig: null
  };
  console.log('Quick View config:', config);

  function loadFirebase(callback) {
    if (typeof firebase === 'undefined' && config.firebaseConfig) {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js';
      script.onload = function() {
        const functionsScript = document.createElement('script');
        functionsScript.src = 'https://www.gstatic.com/firebasejs/8.10.0/firebase-functions.js';
        functionsScript.onload = function() {
          firebase.initializeApp(config.firebaseConfig);
          console.log('Firebase initialized');
          callback();
        };
        document.head.appendChild(functionsScript);
      };
      document.head.appendChild(script);
    } else {
      callback();
    }
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
    }
  }

  async function fetchProductData(productId) {
    console.log('Fetching product data for ID:', productId);
    try {
      if (typeof firebase !== 'undefined' && firebase.functions) {
        const getProductDataFunction = firebase.functions().httpsCallable('getProductData');
        const result = await getProductDataFunction({ productId, storeId: config.storeId });
        console.log('Received product data:', result.data);
        return result.data;
      } else {
        console.warn('Firebase not available, falling back to direct API call');
        // Implement a fallback method here if needed
        throw new Error('Firebase is not available and no fallback method is implemented');
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
      throw error;
    }
  }

  function displayQuickViewModal(productData) {
    console.log('Displaying Quick View modal for product:', productData.name);
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.innerHTML = `
      <div class="quick-view-content">
        <h2>${productData.name.en}</h2>
        <img src="${productData.image}" alt="${productData.name.en}">
        <p>${productData.description.en}</p>
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

  function initQuickView() {
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
  }

  // Start the initialization process
  loadFirebase(initQuickView);
})();
