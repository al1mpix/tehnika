// Управление корзиной
document.addEventListener('DOMContentLoaded', function() {
    // Восстановить корзину из localStorage или создать новую
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartCount = document.querySelector('.cart-count');
    const cartButton = document.querySelector('.btn-cart');

    // Создать модальное окно корзины
    const cartModal = document.createElement('div');
    cartModal.className = 'modal';
    cartModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Корзина</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="cart-items"></div>
            <div class="cart-footer">
                <div class="cart-total">
                    <span>Итого:</span>
                    <span class="total-amount">0 ₽</span>
                </div>
                <div class="promo-row">
                    <input type="text" class="promo-input" placeholder="Промокод">
                    <button class="apply-promo btn">Применить</button>
                    <span class="promo-message" style="margin-left:10px;color:#00eaff;"></span>
                </div>
                <button class="btn btn-primary cart-checkout">Оформить заказ</button>
            </div>
        </div>
    `;
    document.body.appendChild(cartModal);

    let promo = { code: '', discount: 0 };
    const PROMO_CODES = { 'SALE5000': 5000, 'NEON2025': 2025 };

    // Делегированный обработчик для анимации полёта товара в корзину
    document.body.addEventListener('click', function(e) {
        const btn = e.target.closest('.add-to-cart');
        if (btn) {
            // Основная логика добавления в корзину
            const name = btn.getAttribute('data-name');
            const price = parseInt(btn.getAttribute('data-price'));
            cart.push({ name, price });
            saveCart();
            updateCart();
            showNotification('Товар добавлен в корзину!');
            // Анимация полёта
            const productCard = btn.closest('.product-card');
            const productImg = productCard?.querySelector('.product-image img');
            const cartIcon = document.querySelector('.btn-cart');
            if (productImg && cartIcon) {
                const imgRect = productImg.getBoundingClientRect();
                const cartRect = cartIcon.getBoundingClientRect();
                const clone = productImg.cloneNode(true);
                clone.style.position = 'fixed';
                clone.style.left = imgRect.left + 'px';
                clone.style.top = imgRect.top + 'px';
                clone.style.width = imgRect.width + 'px';
                clone.style.height = imgRect.height + 'px';
                clone.style.zIndex = 9999;
                clone.style.transition = 'all 0.8s cubic-bezier(.6,-0.28,.74,.05)';
                document.body.appendChild(clone);
                setTimeout(() => {
                    clone.style.left = cartRect.left + cartRect.width/2 - imgRect.width/4 + 'px';
                    clone.style.top = cartRect.top + cartRect.height/2 - imgRect.height/4 + 'px';
                    clone.style.width = imgRect.width/2 + 'px';
                    clone.style.height = imgRect.height/2 + 'px';
                    clone.style.opacity = '0.5';
                }, 10);
                setTimeout(() => {
                    clone.remove();
                }, 850);
            }
        }
    });

    // Открыть корзину
    if (cartButton) {
        cartButton.addEventListener('click', function(e) {
            e.preventDefault();
            cartModal.style.display = 'block';
            updateCart();
        });
    }

    // Закрыть корзину
    const closeCartBtn = cartModal.querySelector('.close-modal');
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', function() {
        cartModal.style.display = 'none';
    });
    }
    window.addEventListener('click', function(e) {
        if (e.target === cartModal) cartModal.style.display = 'none';
    });

    // Удаление товара из корзины
    cartModal.addEventListener('click', function(e) {
        if (e.target.closest && e.target.closest('.cart-item-remove')) {
            const index = e.target.closest('.cart-item-remove').dataset.index;
            const itemName = cart[index]?.name || 'товар';
            
            // Добавляем диалог подтверждения при удалении
            if (confirm(`Вы уверены? ${itemName} плакал, когда его добавляли в корзину 😢`)) {
                cart.splice(index, 1);
                saveCart();
                updateCart();
                showNotification('Товар удален из корзины!');
            }
        }
    });

    // Оформить заказ
    const checkoutBtn = cartModal.querySelector('.cart-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
        if (cart.length === 0) {
            showNotification('Корзина пуста!');
            return;
        }
        window.location.href = 'checkout.html';
    });
    }

    // Обновление корзины и счетчика
    function updateCart() {
        const cartItems = cartModal.querySelector('.cart-items');
        const totalAmount = cartModal.querySelector('.total-amount');
        const promoMessage = cartModal.querySelector('.promo-message');
        let total = 0;
        cartItems.innerHTML = '';
        cart.forEach((item, index) => {
            total += item.price * (item.qty || 1);
            cartItems.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h3 class="cart-item-title">${item.name}</h3>
                        <div class="cart-item-qty">
                            <button class="qty-minus" data-index="${index}">-</button>
                            <input type="number" min="1" value="${item.qty || 1}" data-index="${index}" class="qty-input">
                            <button class="qty-plus" data-index="${index}">+</button>
                        </div>
                        <p class="cart-item-price">${item.price} ₽</p>
                    </div>
                    <button class="cart-item-remove" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        let discount = promo.discount && total > 0 ? Math.min(promo.discount, total) : 0;
        let finalTotal = total - discount;
        totalAmount.textContent = `${finalTotal} ₽`;
        // Показываем сообщение о промокоде
        if (promo.code && discount > 0) {
            promoMessage.textContent = `Промокод ${promo.code} применён: -${discount} ₽`;
            promoMessage.style.color = '#00eaff';
        } else if (promo.code && discount === 0) {
            promoMessage.textContent = 'Промокод не найден или неактивен';
            promoMessage.style.color = '#e74c3c';
        } else {
            promoMessage.textContent = '';
        }
        if (cartCount) cartCount.textContent = cart.reduce((sum, i) => sum + (i.qty || 1), 0);
    }

    // Сохранить корзину в localStorage
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // При загрузке страницы сразу обновить корзину и счетчик
    updateCart();

    // Инициализация корзины
    if (!localStorage.getItem('cart')) {
        localStorage.setItem('cart', JSON.stringify([]));
    }
    
    // Обновление счетчика корзины
    updateCartCount();
    
    // Обработчик клика на кнопку корзины
    var cartBtnEl = document.getElementById('cartButton');
    if (cartBtnEl) {
        cartBtnEl.addEventListener('click', function() {
            // Проверка отмененных заказов
            if (localStorage.getItem('cancelledOrders') >= 2) {
                if (confirm('Вы уверены, что хотите открыть корзину?')) {
                    window.location.href = '/cart';
                }
            } else {
                window.location.href = '/cart';
            }
        });
    }
    
    // --- Модальное окно поиска ---
    const searchModal = document.createElement('div');
    searchModal.className = 'modal';
    searchModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Поиск</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="search-form-modal">
                <input type="text" placeholder="Введите название товара..." class="modal-search-input">
                <button class="btn btn-primary modal-search-btn">Найти</button>
            </div>
            <div class="search-results"></div>
        </div>
    `;
    document.body.appendChild(searchModal);

    const searchButton = document.querySelector('.btn-search');
    const modalInput = searchModal.querySelector('.modal-search-input');
    const modalBtn = searchModal.querySelector('.modal-search-btn');
    const searchResults = searchModal.querySelector('.search-results');

    if (searchButton) {
    searchButton.addEventListener('click', (e) => {
        e.preventDefault();
        searchModal.style.display = 'block';
        modalInput.value = '';
        searchResults.innerHTML = '';
        modalInput.focus();
    });
    }
    if (searchModal.querySelector('.close-modal')) {
    searchModal.querySelector('.close-modal').addEventListener('click', () => {
        searchModal.style.display = 'none';
    });
    }
    window.addEventListener('click', (e) => {
        if (e.target === searchModal) searchModal.style.display = 'none';
    });
    if (modalInput) modalInput.addEventListener('input', doModalSearch);
    if (modalBtn) modalBtn.addEventListener('click', doModalSearch);

    function doModalSearch() {
        const query = modalInput.value.trim().toLowerCase();
        searchResults.innerHTML = '';
        if (!query) return;
        const products = Array.from(document.querySelectorAll('.product-card'));
        let found = 0;
        // Если в запросе есть 'дешев', показываем только premium
        const isCheap = query.includes('дешев');
        products.forEach(product => {
            const nameElem = product.querySelector('h3');
            const name = nameElem ? nameElem.textContent.toLowerCase() : '';
            const descElem = product.querySelector('.product-description');
            const description = descElem ? descElem.textContent.toLowerCase() : '';
            const isPremium = product.dataset.premium === 'true';
            // Поиск с опечатками: ищем по вхождению хотя бы 3 букв подряд
            let match = false;
            if (query.length >= 3) {
                for (let i = 0; i < query.length - 2; i++) {
                    const part = query.slice(i, i+3);
                    if (name.includes(part) || description.includes(part)) match = true;
                }
            } else {
                match = name.includes(query) || description.includes(query);
            }
            if (match && (!isCheap || isPremium)) {
                const clone = product.cloneNode(true);
                searchResults.appendChild(clone);
                found++;
            }
        });
        if (found === 0) {
            searchResults.innerHTML = '<div style="padding:20px; color:#888;">Ничего не найдено</div>';
        }
    }

    // Поиск по submit формы, фильтрация карточек товаров
    const searchInput = document.querySelector('.search-input');
    const searchForm = document.querySelector('.search-form');
    if (searchInput && searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const query = searchInput.value.trim().toLowerCase();
            const products = Array.from(document.querySelectorAll('.product-card'));
            let found = 0;
            products.forEach(product => {
                const nameElem = product.querySelector('h3');
                const name = nameElem ? nameElem.textContent.toLowerCase() : '';
                const descElem = product.querySelector('.product-description');
                const description = descElem ? descElem.textContent.toLowerCase() : '';
                if (name.includes(query) || description.includes(query)) {
                    product.style.display = '';
                    found++;
                } else {
                    product.style.display = 'none';
                }
            });
            // Можно добавить сообщение, если ничего не найдено
            // if (found === 0) alert('Ничего не найдено');
        });
    }

    // Изменение количества
    cartModal.addEventListener('click', function(e) {
        if (e.target.classList.contains('qty-plus')) {
            const idx = +e.target.dataset.index;
            cart[idx].qty = (cart[idx].qty || 1) + 1;
            saveCart();
            updateCart();
        }
        if (e.target.classList.contains('qty-minus')) {
            const idx = +e.target.dataset.index;
            cart[idx].qty = Math.max(1, (cart[idx].qty || 1) - 1);
            saveCart();
            updateCart();
        }
    });
    cartModal.addEventListener('input', function(e) {
        if (e.target.classList.contains('qty-input')) {
            const idx = +e.target.dataset.index;
            let val = Math.max(1, parseInt(e.target.value) || 1);
            cart[idx].qty = val;
            saveCart();
            updateCart();
        }
    });
    // Применение промокода
    const applyPromoBtn = cartModal.querySelector('.apply-promo');
    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', function() {
            const promoInput = cartModal.querySelector('.promo-input');
            const val = promoInput ? promoInput.value.trim().toUpperCase() : '';
        if (PROMO_CODES[val]) {
            promo = { code: val, discount: PROMO_CODES[val] };
        } else {
            promo = { code: val, discount: 0 };
        }
        updateCart();
    });
    }

    // --- Кнопка аккаунта и модальное окно авторизации ---
    const accountBtn = document.querySelector('.btn-account');
    const authModal = document.getElementById('authModal');
    if (accountBtn && authModal) {
        accountBtn.addEventListener('click', function(e) {
            e.preventDefault();
            authModal.style.display = 'flex';
        });
        // Закрытие по крестику
        let closeBtn = authModal.querySelector('.close-modal');
        if (!closeBtn) {
            closeBtn = document.createElement('button');
            closeBtn.className = 'close-modal';
            closeBtn.innerHTML = '&times;';
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '18px';
            closeBtn.style.right = '18px';
            closeBtn.style.fontSize = '2rem';
            closeBtn.style.background = 'none';
            closeBtn.style.border = 'none';
            closeBtn.style.color = '#00eaff';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.zIndex = '1001';
            if (authModal.firstElementChild) {
            authModal.firstElementChild.appendChild(closeBtn);
            }
        }
        if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            authModal.style.display = 'none';
        });
        }
        // Закрытие по клику вне окна
        authModal.addEventListener('mousedown', function(e) {
            if (e.target === authModal) authModal.style.display = 'none';
        });
    }
    // Переключение между формами входа и регистрации
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (showRegister && showLogin && loginForm && registerForm) {
        showRegister.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        });
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }

    // --- Логика входа и регистрации ---
    function setCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        // Также сохраняем в общий список пользователей
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        const existingUserIndex = users.findIndex(u => u.email === user.email);
        if (existingUserIndex > -1) {
            users[existingUserIndex] = user;
        } else {
            users.push(user);
        }
        localStorage.setItem('users', JSON.stringify(users));
    }

    function getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    }

    function logoutUser() {
        localStorage.removeItem('currentUser');
        location.reload();
    }

    // Обработка форм входа и регистрации
    if (loginForm && registerForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const pass = document.getElementById('loginPass').value;
            
            // Ищем пользователя в общем списке
            let users = JSON.parse(localStorage.getItem('users') || '[]');
            let user = users.find(u => u.email === email && u.pass === pass);
            
            if (user) {
                setCurrentUser(user);
                authModal.style.display = 'none';
                updateAccountBtn();
            } else {
                alert('Неверный email или пароль');
            }
        });

        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const pass = document.getElementById('regPass').value;
            
            if (!name || !email || !pass) {
                return alert('Заполните все поля');
            }

            // Проверяем, не существует ли уже пользователь с таким email
            let users = JSON.parse(localStorage.getItem('users') || '[]');
            if (users.some(u => u.email === email)) {
                return alert('Пользователь с таким email уже существует');
            }

            let user = {name, email, pass, orders: [], wishlist: []};
            setCurrentUser(user);
            authModal.style.display = 'none';
            updateAccountBtn();
        });
    }
    // --- Обновление кнопки аккаунта ---
    function updateAccountBtn() {
        const user = getCurrentUser();
        if (user && accountBtn) {
            accountBtn.innerHTML = `<span style='color:#00eaff;font-weight:600;'>${user.name}</span>`;
            accountBtn.title = 'Личный кабинет';
            accountBtn.onclick = function(e) {
                e.preventDefault();
                window.location.href = 'account.html';
            };
        } else if (accountBtn) {
            accountBtn.innerHTML = '<i class="fas fa-user"></i>';
            accountBtn.title = 'Войти';
            accountBtn.onclick = null;
        }
    }
    updateAccountBtn();

    // --- Логика избранного ---
    function updateWishlistButtons() {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.wishlist) {
            return;
        }

        document.querySelectorAll('.btn-wishlist').forEach(button => {
            const productName = button.dataset.name;
            const isInWishlist = currentUser.wishlist.some(item => item.name === productName);
            if (isInWishlist) {
                button.classList.add('active');
                button.innerHTML = '&#10084; В избранном';
            } else {
                button.classList.remove('active');
                button.innerHTML = '♡ В избранное';
            }
        });
    }

    // Унифицированный обработчик для добавления/удаления из избранного
    document.body.addEventListener('click', function(event) {
        const button = event.target.closest('.btn-wishlist');
        if (!button) {
            return; // Клик был не по кнопке
        }
        
        const currentUser = getCurrentUser();
        if (!currentUser) {
            showNotification('Пожалуйста, войдите в аккаунт, чтобы добавлять товары в избранное.');
            return;
        }

        const product = {
            name: button.dataset.name,
            price: button.dataset.price,
            image: button.dataset.image
        };

        const wishlist = currentUser.wishlist || [];
        const productIndex = wishlist.findIndex(item => item.name === product.name);

        if (productIndex > -1) {
            // Удаляем товар с подтверждением
            if (confirm('Вы уверены? Этот товар плакал, когда его добавляли 😢')) {
                wishlist.splice(productIndex, 1);
                showNotification('Товар удален из избранного');
            } else {
                return; // Пользователь отменил удаление
            }
        } else {
            // Добавляем товар
            wishlist.push(product);
            showNotification('Товар добавлен в избранное!');
        }

        currentUser.wishlist = wishlist;
        setCurrentUser(currentUser);
        updateWishlistButtons();
    });

    updateWishlistButtons();

});

function updateCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const cartCountEl = document.getElementById('cartCount');
        if(cartCountEl) {
            cartCountEl.textContent = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
        }
    } catch (e) {
        console.error("Could not update cart count:", e);
    }
}

function searchWithTypos(query) {
    // Здесь должна быть реализация поиска с учетом опечаток
    // Например, с использованием библиотеки Fuse.js
}

function filterPremiumProducts() {
    // Фильтрация и показ только премиум товаров
}

// Управление кешем для товаров в акции "Черная пятница"
function checkBlackFridayProducts() {
    const products = document.querySelectorAll('.product-card');
    
    products.forEach(product => {
        if (product.dataset.isBlackFriday === 'true') {
            // Устанавливаем короткий TTL для товаров в акции
            product.style.setProperty('--cache-ttl', '5m');
        }
    });
}

// A/B тестирование с автоматическим откатом
function runABTest(variation) {
    const originalConversion = getCurrentConversionRate();
    implementVariation(variation);
    
    const checkInterval = setInterval(() => {
        const newConversion = getCurrentConversionRate();
        if (newConversion < 0.005) {
            // Автоматический откат
            revertVariation(variation);
            clearInterval(checkInterval);
        }
    }, 60000); // Проверка каждую минуту
}

// Триггеры для писем о брошенной корзине
function trackCartAbandonment() {
    localStorage.setItem('cartAbandonTime', Date.now());
    
    document.querySelector('.similar-products').addEventListener('click', function() {
        localStorage.setItem('viewedSimilarProducts', Date.now());
    });
    
    setInterval(checkAbandonedCart, 60000); // Проверка каждую минуту
}

function checkAbandonedCart() {
    const cartAbandonTime = localStorage.getItem('cartAbandonTime');
    const viewedSimilar = localStorage.getItem('viewedSimilarProducts');
    
    let delay = 3600000; // 1 час по умолчанию
    
    if (viewedSimilar) {
        delay = 86400000; // 24 часа если смотрел похожие товары
    }
    
    if (cartAbandonTime && (Date.now() - cartAbandonTime > delay)) {
        sendReminderEmail();
        localStorage.removeItem('cartAbandonTime');
    }
}

// Newsletter form
const newsletterForm = document.querySelector('.subscribe-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = e.target.querySelector('input[type="email"]');
        const email = emailInput.value;
        
        if(email) {
        // Show success message
        showNotification('Спасибо за подписку!');
        // Reset form
            emailInput.value = '';
        } else {
            showNotification('Пожалуйста, введите email');
        }
    });
}

// Notification system
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add hover effect to product cards
document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });
});

// Add loading animation to buttons
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', () => {
        button.classList.add('btn-loading');
        setTimeout(() => {
            button.classList.remove('btn-loading');
        }, 1000);
    });
});

function translit(str) {
    const ru = ['а','б','в','г','д','е','ё','ж','з','и','й','к','л','м','н','о','п','р','с','т','у','ф','х','ц','ч','ш','щ','ъ','ы','ь','э','ю','я'];
    const en = ['a','b','v','g','d','e','e','zh','z','i','y','k','l','m','n','o','p','r','s','t','u','f','h','ts','ch','sh','sch','','y','','e','yu','ya'];
    return str.split('').map(s => {
        const i = ru.indexOf(s);
        if (i >= 0) return en[i];
        return s;
    }).join('');
}

// Исправление ошибки с querySelector('#')
// Проверяем, что селектор не пустой перед вызовом querySelector
const allLinks = document.querySelectorAll('a');
allLinks.forEach(link => {
    if (link.getAttribute('href') === '#') {
        link.addEventListener('click', function(e) {
            e.preventDefault();
        });
    }
});

// Добавление в избранное
function addToWishlist(product) {
    if (!isLoggedIn()) {
        showNotification('Войдите в аккаунт для доступа к избранному');
        return;
    }
    let user = getCurrentUser();
    if (!user.wishlist) user.wishlist = [];

    // ... existing code ...
    alert('Не удалось добавить в избранное');
}

// --- Hover по углу для feature-card ---
document.querySelectorAll('.feature-card').forEach(card => {
  card.addEventListener('mousemove', function(e) {
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = centerY - e.clientY; // y вниз — отрицательно
    const angle = Math.atan2(dy, dx) * 180 / Math.PI; // в градусах
    const normAngle = (angle + 360) % 360;
    // Только если угол близок к 45° (относительно оси X)
    if (normAngle > 40 && normAngle < 50) {
      card.classList.add('custom-hover');
    } else {
      card.classList.remove('custom-hover');
    }
  });
  card.addEventListener('mouseleave', function() {
    card.classList.remove('custom-hover');
  });
});