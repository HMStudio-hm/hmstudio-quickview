// src/scripts/quickView.js v1.9.1

(function() {
  console.log('Quick View script initialized');

  function getStoreIdFromUrl() {
    const scriptTag = document.currentScript;
    const scriptUrl = new URL(scriptTag.src);
    const storeId = scriptUrl.searchParams.get('storeId');
    return storeId ? storeId.split('?')[0] : null;
  }

  function getCurrentLanguage() {
    return document.documentElement.lang || 'ar'; // Default to Arabic if not found
  }

  const storeId = getStoreIdFromUrl();
  if (!storeId) {
    console.error('Store ID not found in script URL');
    return;
  }

  const config = {
    ...window.HMStudioQuickViewConfig,
    storeId: storeId
  };

  console.log('Quick View config:', config);

  async function fetchProductData(productId) {
    console.log('Fetching product data for ID:', productId);
    const url = `https://europe-west3-hmstudio-85f42.cloudfunctions.net/getProductData?storeId=${config.storeId}&productId=${productId}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
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

  function createImageGallery(images) {
    console.log('Creating gallery with images:', images);
    const galleryContainer = document.createElement('div');
    galleryContainer.className = 'quick-view-gallery';
    galleryContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    `;

    // Main image display
    const mainImageContainer = document.createElement('div');
    mainImageContainer.style.cssText = `
      width: 100%;
      height: 300px;
      overflow: hidden;
      border-radius: 8px;
      position: relative;
    `;

    const mainImage = document.createElement('img');
    if (images && images.length > 0) {
      mainImage.src = images[0].url;
      mainImage.alt = images[0].alt_text || 'Product Image';
    } else {
      mainImage.src = 'https://via.placeholder.com/400x400?text=No+Image+Available';
      mainImage.alt = 'No Image Available';
    }
    mainImage.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
    `;
    mainImageContainer.appendChild(mainImage);

    if (images && images.length > 1) {
      const thumbnailsContainer = document.createElement('div');
      thumbnailsContainer.style.cssText = `
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding: 5px 0;
      `;

      images.forEach((image, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = image.thumbnail;
        thumbnail.alt = image.alt_text || `Product Image ${index + 1}`;
        thumbnail.style.cssText = `
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 4px;
          cursor: pointer;
          border: 2px solid ${index === 0 ? '#4CAF50' : 'transparent'};
        `;

        thumbnail.addEventListener('click', () => {
          mainImage.src = image.url;
          thumbnailsContainer.querySelectorAll('img').forEach(thumb => {
            thumb.style.border = '2px solid transparent';
          });
          thumbnail.style.border = '2px solid #4CAF50';
        });

        thumbnailsContainer.appendChild(thumbnail);
      });

      galleryContainer.appendChild(thumbnailsContainer);
    }

    galleryContainer.insertBefore(mainImageContainer, galleryContainer.firstChild);
    return galleryContainer;
  }

  function createVariantsSection(productData) {
    const currentLang = getCurrentLanguage();
    const variantsContainer = document.createElement('div');
    variantsContainer.className = 'quick-view-variants';
    variantsContainer.style.cssText = `
      margin-top: 15px;
      padding: 10px 0;
    `;

    if (productData.variants && productData.variants.length > 0) {
      // Get unique variants and their values
      const variantAttributes = new Map();
      
      productData.variants.forEach(variant => {
        if (variant.attributes && variant.attributes.length > 0) {
          variant.attributes.forEach(attr => {
            if (!variantAttributes.has(attr.name)) {
              variantAttributes.set(attr.name, {
                name: attr.name,
                slug: attr.slug,
                values: new Set()
              });
            }
            variantAttributes.get(attr.name).values.add(attr.value[currentLang]);
          });
        }
      });

      // Create dropdowns for each attribute type
      variantAttributes.forEach(attr => {
        const select = document.createElement('select');
        select.className = 'variant-select';
        select.style.cssText = `
          margin: 5px 0;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 100%;
        `;

        const labelText = currentLang === 'ar' ? attr.slug : attr.name;
        
        const label = document.createElement('label');
        label.textContent = labelText;
        label.style.cssText = `
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        `;

        const placeholderText = currentLang === 'ar' ? `اختر ${labelText}` : `Select ${labelText}`;
        
        let optionsHTML = `<option value="">${placeholderText}</option>`;
        
        Array.from(attr.values).forEach(value => {
          optionsHTML += `<option value="${value}">${value}</option>`;
        });
        
        select.innerHTML = optionsHTML;

        select.addEventListener('change', () => {
          console.log('Selected:', attr.name, select.value);
          updateSelectedVariant(productData);
        });

        variantsContainer.appendChild(label);
        variantsContainer.appendChild(select);
      });
    }

    return variantsContainer;
  }

  function updateSelectedVariant(productData) {
    const form = document.getElementById('product-form');
    if (!form) {
      console.error('Product form not found');
      return;
    }

    const currentLang = getCurrentLanguage();
    const selectedValues = {};

    // Get all selected values
    form.querySelectorAll('.variant-select').forEach(select => {
      if (select.value) {
        const labelText = select.previousElementSibling.textContent;
        selectedValues[labelText] = select.value;
      }
    });

    console.log('Selected values:', selectedValues);

    // Find matching variant
    const selectedVariant = productData.variants.find(variant => {
      return variant.attributes.every(attr => {
        const attrLabel = currentLang === 'ar' ? attr.slug : attr.name;
        return selectedValues[attrLabel] === attr.value[currentLang];
      });
    });

    console.log('Found variant:', selectedVariant);

    if (selectedVariant) {
      // Update product ID input
      let productIdInput = form.querySelector('input[name="product_id"]');
      if (!productIdInput) {
        productIdInput = document.createElement('input');
        productIdInput.type = 'hidden';
        productIdInput.name = 'product_id';
        form.appendChild(productIdInput);
      }
      productIdInput.value = selectedVariant.id;
      console.log('Updated product ID to:', selectedVariant.id);

      // Update price display
      const priceElement = form.querySelector('#product-price');
      const oldPriceElement = form.querySelector('#product-old-price');
      
      if (priceElement) {
        if (selectedVariant.formatted_sale_price) {
          priceElement.textContent = selectedVariant.formatted_sale_price;
          if (oldPriceElement) {
            oldPriceElement.textContent = selectedVariant.formatted_price;
            oldPriceElement.style.display = 'block';
          }
        } else {
          priceElement.textContent = selectedVariant.formatted_price;
          if (oldPriceElement) {
            oldPriceElement.style.display = 'none';
          }
        }
      }

      // Update add to cart button
      const addToCartBtn = form.querySelector('.add-to-cart-btn');
      if (addToCartBtn) {
        if (!selectedVariant.unavailable) {
          addToCartBtn.disabled = false;
          addToCartBtn.classList.remove('disabled');
          addToCartBtn.style.opacity = '1';
        } else {
          addToCartBtn.disabled = true;
          addToCartBtn.classList.add('disabled');
          addToCartBtn.style.opacity = '0.5';
        }
      }
    }
  }

  function handleAddToCart(productData) {
    const currentLang = getCurrentLanguage();
    const form = document.getElementById('product-form');
    
    // Get the quantity from the visible input
    const quantityInput = form.querySelector('#product-quantity-input');
    const quantity = parseInt(quantityInput ? quantityInput.value : '1');
    
    console.log('Selected quantity:', quantity);
    
    if (isNaN(quantity) || quantity < 1) {
      const message = currentLang === 'ar' 
        ? 'الرجاء إدخال كمية صحيحة'
        : 'Please enter a valid quantity';
      alert(message);
      return;
    }
    
    // Check if product has variants
    if (productData.variants && productData.variants.length > 0) {
      console.log('Product has variants:', productData.variants);
      
      // Get all variant selections
      const selectedVariants = {};
      const missingSelections = [];
      
      form.querySelectorAll('.variant-select').forEach(select => {
        const labelText = select.previousElementSibling.textContent;
        if (!select.value) {
          missingSelections.push(labelText);
        }
        selectedVariants[labelText] = select.value;
      });
  
      // Check if all variants are selected
      if (missingSelections.length > 0) {
        const message = currentLang === 'ar' 
          ? `الرجاء اختيار ${missingSelections.join(', ')}`
          : `Please select ${missingSelections.join(', ')}`;
        alert(message);
        return;
      }
  
      console.log('Selected variants:', selectedVariants);
  
      // Find the matching variant
      const selectedVariant = productData.variants.find(variant => {
        return variant.attributes.every(attr => {
          const attrLabel = currentLang === 'ar' ? attr.slug : attr.name;
          return selectedVariants[attrLabel] === attr.value[currentLang];
        });
      });
  
      if (!selectedVariant) {
        console.error('No matching variant found');
        console.log('Selected combinations:', selectedVariants);
        const message = currentLang === 'ar' 
          ? 'هذا المنتج غير متوفر بالمواصفات المختارة'
          : 'This product variant is not available';
        alert(message);
        return;
      }
  
      console.log('Found matching variant:', selectedVariant);
      
      // Update product ID for variant
      const productIdInput = form.querySelector('input[name="product_id"]');
      if (productIdInput) {
        productIdInput.value = selectedVariant.id;
        console.log('Updated product ID to variant ID:', selectedVariant.id);
      }
    }
  
    // Update the hidden quantity input before form submission
    const hiddenQuantityInput = form.querySelector('input[name="quantity"]');
    if (hiddenQuantityInput) {
      hiddenQuantityInput.value = quantity.toString();
    }
  
    // Show loading spinner
    const loadingSpinners = document.querySelectorAll('.add-to-cart-progress');
    loadingSpinners.forEach(spinner => spinner.classList.remove('d-none'));
  
    // Call Zid's cart function
    try {
      zid.store.cart.addProduct({
        formId: 'product-form',
        afterAddCallback: function(response) {
          console.log('Add to cart response:', response);
          if (response.status === 'success') {
            // Update cart display using Zid's cartProductsHtmlChanged
            if (typeof cartProductsHtmlChanged === 'function') {
              const cartHtml = response.data.cart_html || '';
              cartProductsHtmlChanged(cartHtml, response.data.cart);
            }
            
            // Update cart badge if the function exists
            if (typeof setCartBadge === 'function') {
              setCartBadge(response.data.cart.products_count);
            }
  
            // Update cart template if it exists
            const cartTemplate = document.querySelector('.template_for_cart_products_list');
            if (cartTemplate && response.data.cart_html) {
              cartTemplate.innerHTML = response.data.cart_html;
            }
  
            // Close modal
            const modal = document.querySelector('.quick-view-modal');
            if (modal) {
              modal.remove();
            }
          } else {
            console.error('Add to cart failed:', response);
            const errorMessage = currentLang === 'ar' 
              ? response.data.message || 'فشل إضافة المنتج إلى السلة'
              : response.data.message || 'Failed to add product to cart';
            alert(errorMessage);
          }
  
          // Hide loading spinner
          loadingSpinners.forEach(spinner => spinner.classList.add('d-none'));
        }
      });
    } catch (error) {
      console.error('Critical error in add to cart:', error);
      loadingSpinners.forEach(spinner => spinner.classList.add('d-none'));
    }
  }
  
  function createQuantitySelector() {
    const currentLang = getCurrentLanguage();
    
    const quantityContainer = document.createElement('div');
    quantityContainer.style.cssText = `
      margin-top: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
  
    const quantityLabel = document.createElement('label');
    quantityLabel.htmlFor = 'product-quantity-input';
    quantityLabel.textContent = currentLang === 'ar' ? 'الكمية:' : 'Quantity:';
    quantityLabel.style.cssText = `
      font-weight: bold;
      min-width: 70px;
    `;
  
    const quantityWrapper = document.createElement('div');
    quantityWrapper.style.cssText = `
      display: flex;
      align-items: center;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    `;
  
    const decreaseBtn = document.createElement('button');
    decreaseBtn.type = 'button';
    decreaseBtn.textContent = '-';
    decreaseBtn.style.cssText = `
      width: 36px;
      height: 36px;
      border: none;
      background: #f5f5f5;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
  
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.id = 'product-quantity-input';
    quantityInput.name = 'quantity';
    quantityInput.value = '1';
    quantityInput.min = '1';
    quantityInput.style.cssText = `
      width: 50px;
      height: 36px;
      border: none;
      border-left: 1px solid #ddd;
      border-right: 1px solid #ddd;
      text-align: center;
      -moz-appearance: textfield;
    `;
  
    // Remove spinner arrows for number input
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      #product-quantity-input::-webkit-outer-spin-button,
      #product-quantity-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    `;
    document.head.appendChild(styleSheet);
  
    const increaseBtn = document.createElement('button');
    increaseBtn.type = 'button';
    increaseBtn.textContent = '+';
    increaseBtn.style.cssText = `
      width: 36px;
      height: 36px;
      border: none;
      background: #f5f5f5;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
  
    // Add event listeners
    decreaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(quantityInput.value);
      if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
        updateHiddenQuantityInput();
      }
    });
  
    increaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(quantityInput.value);
      quantityInput.value = currentValue + 1;
      updateHiddenQuantityInput();
    });
  
    quantityInput.addEventListener('change', () => {
      let value = parseInt(quantityInput.value);
      if (isNaN(value) || value < 1) {
        value = 1;
      }
      quantityInput.value = value;
      updateHiddenQuantityInput();
    });
  
    function updateHiddenQuantityInput() {
      const hiddenQuantityInput = form.querySelector('input[name="quantity"]');
      if (hiddenQuantityInput) {
        hiddenQuantityInput.value = quantityInput.value;
      }
    }
  
    quantityWrapper.appendChild(decreaseBtn);
    quantityWrapper.appendChild(quantityInput);
    quantityWrapper.appendChild(increaseBtn);
  
    quantityContainer.appendChild(quantityLabel);
    quantityContainer.appendChild(quantityWrapper);
  
    return quantityContainer;
  }


  function displayQuickViewModal(productData) {
    const currentLang = getCurrentLanguage();
    console.log('Displaying Quick View modal for product:', productData);
    
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
      padding: 25px;
      border-radius: 8px;
      max-width: 800px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      text-align: ${currentLang === 'ar' ? 'right' : 'left'};
      direction: ${currentLang === 'ar' ? 'rtl' : 'ltr'};
    `;

    // Create form
    const form = document.createElement('form');
    form.id = 'product-form';
    content.appendChild(form);

    // Create and append the title
    const title = document.createElement('h2');
    title.textContent = productData.name[currentLang] || productData.name;
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 1.5em;
      color: #333;
    `;
    form.appendChild(title);

    // Create and append the image gallery
    if (productData.images && productData.images.length > 0) {
      const gallery = createImageGallery(productData.images);
      form.appendChild(gallery);
    }

    // Create product details section
    const details = document.createElement('div');
    details.style.cssText = `
      margin-top: 20px;
    `;

    // Add price display elements
    const priceContainer = document.createElement('div');
    const currentPrice = document.createElement('span');
    currentPrice.id = 'product-price';
    currentPrice.style.cssText = `
      font-size: 1.3em;
      font-weight: bold;
      color: #4CAF50;
      margin-right: 10px;
    `;
    const oldPrice = document.createElement('span');
    oldPrice.id = 'product-old-price';
    oldPrice.style.cssText = `
      text-decoration: line-through;
      color: #999;
      display: none;
    `;

    priceContainer.appendChild(currentPrice);
    priceContainer.appendChild(oldPrice);
    details.appendChild(priceContainer);

    // Add variants section if product has variants
    if (productData.variants && productData.variants.length > 0) {
      const variantsSection = createVariantsSection(productData);
      details.appendChild(variantsSection);
    }
    const quantitySelector = createQuantitySelector();
    details.appendChild(quantitySelector);
    
    // Add description
    if (productData.description && productData.description[currentLang]) {
      const description = document.createElement('p');
      description.style.cssText = `
        margin: 15px 0;
        line-height: 1.5;
        color: #666;
      `;
      description.textContent = productData.description[currentLang];
      details.appendChild(description);
    }

    form.appendChild(details);

    // Add hidden inputs
    const productIdInput = document.createElement('input');
    productIdInput.type = 'hidden';
    productIdInput.id = 'product-id';
    productIdInput.name = 'product_id';
    productIdInput.value = productData.id;
    form.appendChild(productIdInput);

    const quantityInput = document.createElement('input');
    quantityInput.type = 'hidden';
    quantityInput.id = 'product-quantity';
    quantityInput.name = 'quantity';
    quantityInput.value = '1';
    form.appendChild(quantityInput);

// Add quantity selector
function createQuantitySelector() {
  const currentLang = getCurrentLanguage();
  
  const quantityContainer = document.createElement('div');
  quantityContainer.style.cssText = `
    margin-top: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
  `;

  const quantityLabel = document.createElement('label');
  quantityLabel.htmlFor = 'product-quantity-input';
  quantityLabel.textContent = currentLang === 'ar' ? 'الكمية:' : 'Quantity:';
  quantityLabel.style.cssText = `
    font-weight: bold;
    min-width: 70px;
  `;

  const quantityWrapper = document.createElement('div');
  quantityWrapper.style.cssText = `
    display: flex;
    align-items: center;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  `;

  const decreaseBtn = document.createElement('button');
  decreaseBtn.type = 'button';
  decreaseBtn.textContent = '-';
  decreaseBtn.style.cssText = `
    width: 36px;
    height: 36px;
    border: none;
    background: #f5f5f5;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const quantityInput = document.createElement('input');
  quantityInput.type = 'number';
  quantityInput.id = 'product-quantity-input';
  quantityInput.name = 'quantity';
  quantityInput.value = '1';
  quantityInput.min = '1';
  quantityInput.style.cssText = `
    width: 50px;
    height: 36px;
    border: none;
    border-left: 1px solid #ddd;
    border-right: 1px solid #ddd;
    text-align: center;
    -moz-appearance: textfield;
  `;
  // Remove spinner arrows for number input
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    #product-quantity-input::-webkit-outer-spin-button,
    #product-quantity-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `;
  document.head.appendChild(styleSheet);

  const increaseBtn = document.createElement('button');
  increaseBtn.type = 'button';
  increaseBtn.textContent = '+';
  increaseBtn.style.cssText = `
    width: 36px;
    height: 36px;
    border: none;
    background: #f5f5f5;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Add event listeners
  decreaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(quantityInput.value);
    if (currentValue > 1) {
      quantityInput.value = currentValue - 1;
      updateHiddenQuantityInput();
    }
  });

  increaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(quantityInput.value);
    quantityInput.value = currentValue + 1;
    updateHiddenQuantityInput();
  });

  quantityInput.addEventListener('change', () => {
    let value = parseInt(quantityInput.value);
    if (isNaN(value) || value < 1) {
      value = 1;
    }
    quantityInput.value = value;
    updateHiddenQuantityInput();
  });

  function updateHiddenQuantityInput() {
    const hiddenQuantityInput = form.querySelector('input[name="quantity"]');
    if (hiddenQuantityInput) {
      hiddenQuantityInput.value = quantityInput.value;
    }
  }

  quantityWrapper.appendChild(decreaseBtn);
  quantityWrapper.appendChild(quantityInput);
  quantityWrapper.appendChild(increaseBtn);

  quantityContainer.appendChild(quantityLabel);
  quantityContainer.appendChild(quantityWrapper);

  return quantityContainer;
}

    // Add buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    `;

    // Add to Cart button
    const addToCartBtn = document.createElement('button');
    addToCartBtn.textContent = currentLang === 'ar' ? 'أضف إلى السلة' : 'Add to Cart';
    addToCartBtn.className = 'btn btn-primary add-to-cart-btn';
    addToCartBtn.type = 'button';
    addToCartBtn.style.cssText = `
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.3s ease;
    `;

    // Add loading spinner
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'add-to-cart-progress d-none';
    loadingSpinner.style.cssText = `
      display: inline-block;
      width: 20px;
      height: 20px;
      margin-left: 10px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;
    addToCartBtn.appendChild(loadingSpinner);

    // Add keyframe animation for spinner
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);

    addToCartBtn.addEventListener('click', () => {
      handleAddToCart(productData);
    });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = currentLang === 'ar' ? 'إغلاق' : 'Close';
    closeBtn.type = 'button';
    closeBtn.style.cssText = `
      padding: 10px 20px;
      background-color: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.3s ease;
    `;

    closeBtn.addEventListener('mouseover', () => {
      closeBtn.style.backgroundColor = '#da190b';
    });
    closeBtn.addEventListener('mouseout', () => {
      closeBtn.style.backgroundColor = '#f44336';
    });
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    buttonsContainer.appendChild(closeBtn);
    buttonsContainer.appendChild(addToCartBtn);
    form.appendChild(buttonsContainer);

    modal.appendChild(content);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
    
    // Initialize price display
    if (productData.selected_product) {
      updateSelectedVariant(productData);
    } else {
      currentPrice.textContent = productData.formatted_price || productData.price;
    }

    console.log('Quick View modal added to DOM');
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

  function addQuickViewButtons() {
    console.log('Adding Quick View buttons');
    const productCards = document.querySelectorAll('.product-item.position-relative');
    console.log('Found product cards:', productCards.length);
    
    productCards.forEach(card => {
      if (card.querySelector('.quick-view-btn')) {
        console.log('Quick View button already exists for a product, skipping');
        return;
      }

      // Get product ID from data-wishlist-id
      const productId = card.querySelector('[data-wishlist-id]')?.getAttribute('data-wishlist-id');
      
      if (productId) {
        console.log('Found product ID:', productId);
        
        // Find the button container - it's the div with text-align: center
        const buttonContainer = card.querySelector('div[style*="text-align: center"]');
        
        if (buttonContainer) {
          const button = document.createElement('button');
          button.className = 'quick-view-btn';
          button.style.cssText = `
            width: 35px;
            height: 35px;
            padding: 0;
            margin: 0 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: #ffffff;
            cursor: pointer;
            transition: background-color 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          `;

          // Add eye icon using SVG
          button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          `;

          button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#f0f0f0';
          });

          button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#ffffff';
          });

          button.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Quick View button clicked for product ID:', productId);
            openQuickView(productId);
          });

          // Insert before the first button in the container
          const firstButton = buttonContainer.querySelector('a, button');
          if (firstButton) {
            if (config.quickViewStyle === 'left') {
              buttonContainer.insertBefore(button, firstButton);
            } else {
              buttonContainer.insertBefore(button, firstButton.nextSibling);
            }
          } else {
            buttonContainer.appendChild(button);
          }
        }
      }
    });
  }

  // Initial setup
  console.log('Running initial setup');
  addQuickViewButtons();

  // Re-apply Quick View buttons when the page content changes
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
