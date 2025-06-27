// Пошаговая форма оформления заказа

document.addEventListener('DOMContentLoaded', function() {
    const steps = Array.from(document.querySelectorAll('.checkout-steps .step'));
    const formSteps = Array.from(document.querySelectorAll('.form-step'));
    const nextBtns = document.querySelectorAll('.next-step');
    const prevBtns = document.querySelectorAll('.prev-step');
    const orderForm = document.getElementById('orderForm');

    let currentStep = 0;

    // --- Промокоды ---
    const PROMO_CODES = { 'SALE5000': 5000, 'NEON2025': 2025 };
    let appliedPromo = { code: '', discount: 0 };
    let deliveryPrice = 350;

    function showStep(index) {
        formSteps.forEach((step, i) => {
            step.classList.toggle('active', i === index);
        });
        steps.forEach((step, i) => {
            step.classList.toggle('active', i === index);
        });
        currentStep = index;
        // Автофокус на первом поле шага
        const firstInput = formSteps[index].querySelector('input:not([type="checkbox"]):not([type="radio"])');
        if (firstInput) firstInput.focus();
        // Прокрутка к форме на мобильных
        if (window.innerWidth < 700) {
            formSteps[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Переключение шагов по кнопкам
    nextBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const next = parseInt(this.dataset.next) - 1;
            if (validateStep(currentStep)) {
                showStep(next);
            }
        });
    });
    prevBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const prev = parseInt(this.dataset.prev) - 1;
            showStep(prev);
        });
    });

    // Переключение шагов по клику на шаг
    steps.forEach((step, i) => {
        step.addEventListener('click', function() {
            if (i <= currentStep) showStep(i);
        });
    });

    // Валидация текущего шага
    function validateStep(stepIdx) {
        const step = formSteps[stepIdx];
        let valid = true;
        const requiredFields = step.querySelectorAll('input[required], select[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim() || (field.type === 'checkbox' && !field.checked)) {
                field.classList.add('invalid');
                valid = false;
            } else {
                field.classList.remove('invalid');
            }
        });
        if (!valid) {
            // Прокрутка к первому невалидному полю
            const firstInvalid = step.querySelector('.invalid');
            if (firstInvalid) firstInvalid.focus();
        }
        return valid;
    }

    // Убираем ошибку при вводе
    orderForm.addEventListener('input', function(e) {
        if (e.target.classList.contains('invalid')) {
            e.target.classList.remove('invalid');
        }
    });

    // Новый обработчик оформления заказа по кнопке
    document.getElementById('placeOrderBtn')?.addEventListener('click', function() {
        localStorage.removeItem('fastOrder');
        // Сохраняем заказ в историю пользователя
        const user = JSON.parse(localStorage.getItem('currentUser')||'null');
        let cart = JSON.parse(localStorage.getItem('cart')||'[]');
        if (user && cart.length) {
            let orders = user.orders || [];
            let total = cart.reduce((sum, i) => sum + i.price * (i.qty||1), 0);
            let order = {
                id: Date.now(),
                date: new Date().toLocaleString('ru-RU', {day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit'}),
                items: cart.map(i => ({name: i.name, price: i.price, qty: i.qty||1, image: i.image})),
                total,
                status: 'Оформлен'
            };
            orders.unshift(order);
            user.orders = orders;
            localStorage.setItem('currentUser', JSON.stringify(user));
        }
        // Очищаем корзину
        localStorage.setItem('cart', '[]');
        showNotification('Заказ успешно оформлен!');
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 1200);
    });

    // --- Всплывающее уведомление ---
    function showNotification(message) {
        let n = document.createElement('div');
        n.className = 'notification';
        n.textContent = message;
        n.style.position = 'fixed';
        n.style.bottom = '40px';
        n.style.left = '50%';
        n.style.transform = 'translateX(-50%)';
        n.style.background = 'rgba(0,0,0,0.92)';
        n.style.color = '#fff';
        n.style.padding = '16px 32px';
        n.style.borderRadius = '12px';
        n.style.fontSize = '1.1rem';
        n.style.zIndex = '9999';
        n.style.boxShadow = '0 4px 24px #00eaff55';
        document.body.appendChild(n);
        setTimeout(()=>n.classList.add('show'), 50);
        setTimeout(()=>{n.classList.remove('show'); setTimeout(()=>n.remove(), 300);}, 2200);
    }

    // Выводим товары из корзины в сайдбар заказа
    function getOrderItems() {
        const fastOrder = JSON.parse(localStorage.getItem('fastOrder') || 'null');
        if (fastOrder && Array.isArray(fastOrder) && fastOrder.length) {
            return fastOrder;
        }
        return JSON.parse(localStorage.getItem('cart') || '[]');
    }

    function renderOrderSidebar() {
        const sidebarItems = document.querySelector('.order-summary-sidebar .order-items');
        if (!sidebarItems) return;
        let items = getOrderItems();
        if (items.length === 0) {
            sidebarItems.innerHTML = '<div style="color:#b8eaff;opacity:0.7;padding:16px 0;">Корзина пуста</div>';
            return;
        }
        sidebarItems.innerHTML = items.map((item, index) => `
            <div class="order-item">
                <span class="order-item-title">${item.name}</span>
                <span class="order-item-qty">${item.qty || 1} шт.</span>
                <span class="order-item-price">${item.price} ₽</span>
                <button class="remove-item-btn" data-index="${index}" style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:1.2rem;margin-left:8px;" title="Удалить">&times;</button>
            </div>
        `).join('');
        
        // Добавляем обработчики для удаления товаров
        sidebarItems.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-item-btn')) {
                const index = parseInt(e.target.dataset.index);
                const itemName = items[index]?.name || 'товар';
                
                // Добавляем диалог подтверждения при удалении
                if (confirm(`Вы уверены? ${itemName} плакал, когда его добавляли в заказ 😢`)) {
                    // Удаляем товар из быстрого заказа или корзины
                    const fastOrder = JSON.parse(localStorage.getItem('fastOrder') || 'null');
                    if (fastOrder && Array.isArray(fastOrder) && fastOrder.length) {
                        fastOrder.splice(index, 1);
                        localStorage.setItem('fastOrder', JSON.stringify(fastOrder));
                    } else {
                        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
                        cart.splice(index, 1);
                        localStorage.setItem('cart', JSON.stringify(cart));
                    }
                    
                    // Перерисовываем сайдбар и итоги
                    renderOrderSidebar();
                    renderOrderTotals();
                    showNotification('Товар удален из заказа!');
                }
            }
        });
    }
    renderOrderSidebar();

    // --- Рендер итогов заказа ---
    function renderOrderTotals() {
        const items = getOrderItems();
        const orderTotals = document.querySelectorAll('.order-totals');
        let total = items.reduce((sum, i) => sum + i.price * (i.qty||1), 0);
        let delivery = document.getElementById('pickup')?.checked ? 0 : deliveryPrice;
        let discount = appliedPromo.discount && total > 0 ? Math.min(appliedPromo.discount, total) : 0;
        let grandTotal = total + delivery - discount;
        orderTotals.forEach(block => {
            block.innerHTML = `
                <div class="total-row"><span>Товары (${items.length})</span><span>${total.toLocaleString()} ₽</span></div>
                <div class="total-row"><span>Доставка</span><span>${delivery ? delivery + ' ₽' : 'Бесплатно'}</span></div>
                ${appliedPromo.code && discount > 0 ? `<div class="total-row promo"><span>Промокод</span><span>- ${discount.toLocaleString()} ₽</span></div>` : ''}
                <div class="total-row grand-total"><span>Итого</span><span>${grandTotal.toLocaleString()} ₽</span></div>
            `;
        });
    }

    // --- Применение промокода ---
    const promoInput = document.getElementById('promo');
    const applyPromoBtn = document.getElementById('applyPromo');
    const promoMessage = document.getElementById('promoMessage');
    if (applyPromoBtn && promoInput) {
        applyPromoBtn.addEventListener('click', function() {
            const val = promoInput.value.trim().toUpperCase();
            if (PROMO_CODES[val]) {
                appliedPromo = { code: val, discount: PROMO_CODES[val] };
                promoMessage.textContent = `Промокод ${val} применён: -${PROMO_CODES[val].toLocaleString()} ₽`;
                promoMessage.style.color = '#00eaff';
            } else {
                appliedPromo = { code: val, discount: 0 };
                promoMessage.textContent = 'Промокод не найден или неактивен';
                promoMessage.style.color = '#e74c3c';
            }
            renderOrderTotals();
        });
    }

    // --- Пересчёт итогов при смене доставки ---
    document.querySelectorAll('input[name="delivery"]').forEach(radio => {
        radio.addEventListener('change', renderOrderTotals);
    });

    // --- Пересчёт итогов при переходе по шагам ---
    nextBtns.forEach(btn => {
        btn.addEventListener('click', renderOrderTotals);
    });
    prevBtns.forEach(btn => {
        btn.addEventListener('click', renderOrderTotals);
    });

    // --- Пересчёт итогов при загрузке ---
    renderOrderTotals();

    // Инициализация
    showStep(0);

    // Очищаем fastOrder после оформления заказа или ухода со страницы
    window.addEventListener('beforeunload', function() {
        localStorage.removeItem('fastOrder');
    });
}); 