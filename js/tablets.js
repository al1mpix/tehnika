// Генерация массива планшетов
const brands = ["Apple", "Samsung", "Xiaomi", "Lenovo", "Huawei", "Honor", "Acer", "Asus"];
const tablets = Array.from({length: 80}, (_, i) => {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    let image = 'images/ipad.png';
    return {
        id: i+1,
        name: `${brand} Tablet ${2025 - (i % 5)} (${i+1})`,
        brand,
        price: Math.floor(24990 + Math.random() * 90000),
        image,
        desc: `Современный планшет ${brand} для работы, учёбы и развлечений.`
    };
});

// --- Универсальный рендер товаров, фильтрация, поиск, пагинация ---
window.addEventListener('DOMContentLoaded', function() {
    const products = tablets;
    const productsGrid = document.getElementById('productsGrid');
    const searchInput = document.getElementById('searchInput');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const brandList = document.getElementById('brandList');
    const applyFiltersBtn = document.querySelector('.apply-filters');
    const resetFiltersBtn = document.querySelector('.reset-filters');
    const pagination = document.getElementById('pagination');

    let filtered = [...products];
    let currentPage = 1;
    const perPage = 16;

    function renderBrands() {
        const uniqueBrands = [...new Set(products.map(p => p.brand))];
        brandList.innerHTML = uniqueBrands.map(brand => `
            <li><label><input type="checkbox" value="${brand}"> ${brand}</label></li>
        `).join('');
    }

    function renderProducts() {
        const start = (currentPage-1)*perPage;
        const end = start+perPage;
        const pageProducts = filtered.slice(start, end);
        productsGrid.innerHTML = pageProducts.map(p => `
            <div class="product-card">
                <div class="product-image"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <div class="product-price">${p.price.toLocaleString()} ₽</div>
                    <button class="btn btn-primary add-to-cart" data-id="${p.id}">В корзину</button>
                    <button class="btn quick-order-btn" style="background:#C0FFEE;color:#222;margin-top:8px;" data-id="${p.id}">Оформить быстрый заказ</button>
                    <button class="btn btn-wishlist" data-id="${p.id}">♡ В избранное</button>
                </div>
            </div>
        `).join('');
        renderPagination();
        updateWishlistButtonsState();
    }

    function renderPagination() {
        const pages = Math.ceil(filtered.length/perPage);
        let html = '';
        for(let i=1;i<=pages;i++) {
            html += `<a href="#" class="page${i===currentPage?' active':''}" data-page="${i}">${i}</a>`;
        }
        pagination.innerHTML = html;
    }

    function updateWishlistButtonsState() {
        document.querySelectorAll('.btn-wishlist').forEach(btn => {
            const id = btn.getAttribute('data-id');
            if (isInWishlist(id)) {
                btn.classList.add('active');
                btn.innerHTML = '&#10084; В избранном';
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '♡ В избранное';
            }
        });
    }

    function applyFilters() {
        let brandsChecked = Array.from(brandList.querySelectorAll('input:checked')).map(i=>i.value);
        let min = parseInt(minPriceInput.value)||0;
        let max = parseInt(maxPriceInput.value)||Infinity;
        let search = (searchInput.value||'').toLowerCase();
        filtered = products.filter(p =>
            (brandsChecked.length===0 || brandsChecked.includes(p.brand)) &&
            p.price >= min && p.price <= max &&
            (p.name.toLowerCase().includes(search) || p.desc.toLowerCase().includes(search))
        );
        currentPage = 1;
        renderProducts();
    }

    searchInput.addEventListener('input', applyFilters);
    applyFiltersBtn.addEventListener('click', applyFilters);
    resetFiltersBtn.addEventListener('click', ()=>{
        minPriceInput.value = '';
        maxPriceInput.value = '';
        brandList.querySelectorAll('input').forEach(i=>i.checked=false);
        searchInput.value = '';
        applyFilters();
    });
    brandList.addEventListener('change', applyFilters);
    pagination.addEventListener('click', e=>{
        if(e.target.classList.contains('page')) {
            e.preventDefault();
            currentPage = +e.target.dataset.page;
            renderProducts();
        }
    });

    // --- Модальное окно для подробной информации о товаре ---
    function createModal() {
        let modal = document.getElementById('productModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'productModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class=\"modal-content\">
                    <span class=\"close-modal\">&times;</span>
                    <div class=\"modal-body\"></div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
            modal.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };
        }
        return modal;
    }

    function getTabletSpecs(product) {
        // Примерные характеристики для планшета
        return [
            ['Экран', '12.9\" IPS, 120 Гц'],
            ['Процессор', '8-ядерный, 2.8 ГГц'],
            ['Память', '8 ГБ ОЗУ, 256 ГБ ПЗУ'],
            ['Камера', '48 Мп + 12 Мп'],
            ['Батарея', '10000 мАч'],
            ['SIM', 'nanoSIM + eSIM'],
            ['ОС', 'Android 14 / iPadOS 18'],
            ['Вес', '600 г'],
            ['Бренд', product.brand],
        ];
    }

    function showProductModal(product) {
        const modal = createModal();
        const specs = getTabletSpecs(product);
        
        // Создаем хайку описание для планшета
        const haikuDesc = generateTabletHaiku(product);
        
        modal.querySelector('.modal-body').innerHTML = `
            <div class="modal-product">
                <div class="modal-product-image"><img src="${product.image}" alt="${product.name}"></div>
                <div class="modal-product-info">
                    <h2>${product.name}</h2>
                    <div class="modal-product-price">${product.price.toLocaleString()} ₽</div>
                    <div class="modal-product-desc haiku-desc">
                        ${haikuDesc}
                    </div>
                    <h4>Характеристики</h4>
                    <table class="modal-specs-table">
                        ${specs.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`).join('')}
                    </table>
                    <button class="btn btn-primary add-to-cart-modal">В корзину</button>
                </div>
            </div>
        `;
        modal.style.display = 'block';
        modal.querySelector('.add-to-cart-modal').onclick = () => {
            alert('Товар добавлен в корзину (демо)');
            modal.style.display = 'none';
        };
    }

    function generateTabletHaiku(product) {
        const haikus = [
            'Лунный свет — отражение в черном стекле.<br>Экран 12.9" IPS, память 256 ГБ, срок доставки — 2 луны.',
            'Тихий шелест — касание пальца по экрану.<br>Процессор 8-ядерный, камера 48 Мп, срок доставки — 3 луны.',
            'Утренний свет — тени на алюминиевом корпусе.<br>Батарея 10000 мАч, вес 600 г, срок доставки — 1 луна.',
            'Вечерний покой — тишина в спящем режиме.<br>Экран OLED, память 512 ГБ, срок доставки — 2 луны.',
            'Капля росы — конденсат на стеклянной поверхности.<br>Процессор M2, камера 12 Мп, срок доставки — 3 луны.'
        ];
        
        // Выбираем случайное хайку или используем индекс на основе ID товара
        const index = (product.id || 0) % haikus.length;
        return haikus[index];
    }

    // Единый обработчик для сетки товаров
    productsGrid.addEventListener('click', function(e) {
        const target = e.target;
        // Быстрый заказ
        if (target.classList.contains('quick-order-btn')) {
            const card = target.closest('.product-card');
            const name = card.querySelector('h3').textContent;
            const price = card.querySelector('.product-price')?.textContent?.replace(/\D/g, '') || '';
            const image = card.querySelector('img')?.getAttribute('src') || '';
            const fastOrder = [{ name, price: parseInt(price), image, qty: 1 }];
            localStorage.setItem('fastOrder', JSON.stringify(fastOrder));
            window.location.href = 'checkout.html';
            return;
        }
        // Клик по кнопке "В корзину"
        if (target.classList.contains('add-to-cart')) {
            const id = target.getAttribute('data-id');
            const product = filtered.find(p => p.id == id);
            if (product) addToCart(product);
            return;
        }

        // Клик по кнопке "В избранное"
        if (target.classList.contains('btn-wishlist')) {
            const id = target.getAttribute('data-id');
            const product = filtered.find(p => p.id == id);
            if (!product) return;

            const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!user) {
                showNotification && showNotification('Пожалуйста, войдите в аккаунт.');
                return;
            }

            if (isInWishlist(id)) {
                // Добавляем диалог подтверждения при удалении
                if (confirm('Вы уверены? Этот товар плакал, когда его добавляли 😢')) {
                    removeFromWishlist(id);
                    target.classList.remove('active');
                    target.innerHTML = '♡ В избранное';
                    showNotification && showNotification('Товар удален из избранного');
                }
            } else {
                addToWishlist(product);
                target.classList.add('active');
                target.innerHTML = '&#10084; В избранном';
                showNotification && showNotification('Товар добавлен в избранное');
            }
            return;
        }

        // Клик по карточке для открытия модального окна
        const card = target.closest('.product-card');
        if (card) {
            const name = card.querySelector('h3').textContent;
            const product = filtered.find(p => p.name === name);
            if (product) showProductModal(product);
        }
    });

    // --- Функции для работы с избранным ---
    function getWishlist() {
        const user = JSON.parse(localStorage.getItem('currentUser')||'null');
        return (user && user.wishlist) ? user.wishlist : [];
    }
    function setWishlist(wishlist) {
        const user = JSON.parse(localStorage.getItem('currentUser')||'null');
        if (user) {
            user.wishlist = wishlist;
            localStorage.setItem('currentUser', JSON.stringify(user));
        }
    }
    function isInWishlist(id) {
        return getWishlist().some(p => p.id == id);
    }
    function addToWishlist(product) {
        const wishlist = getWishlist();
        if (!wishlist.some(p => p.id == product.id)) {
            wishlist.push(product);
            setWishlist(wishlist);
        }
    }
    function removeFromWishlist(id) {
        let wishlist = getWishlist();
        wishlist = wishlist.filter(p => p.id != id);
        setWishlist(wishlist);
    }

    // --- Добавление товара в корзину ---
    function getCart() {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    }
    function setCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }
    function addToCart(product) {
        let cart = getCart();
        let found = cart.find(i => i.id == product.id);
        if (found) {
            found.qty = (found.qty || 1) + 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                qty: 1
            });
        }
        setCart(cart);
        showNotification && showNotification('Товар добавлен в корзину!');
        if (typeof updateCartCount === 'function') updateCartCount();
    }

    renderBrands();
    applyFilters();
});

// Фильтрация, поиск, пагинация, рендер
// ... (JS код для фильтрации, поиска, пагинации, добавления в корзину) 