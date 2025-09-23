document.addEventListener('DOMContentLoaded', function () {
    const orderSummary = document.getElementById('orderSummary');
    const form = document.getElementById('paymentForm');
    const cardInput = document.getElementById('cardNumber');
    const expiryInput = document.getElementById('expiry');
    const cvcInput = document.getElementById('cvc');
    const paidMessage = document.getElementById('paidMessage');
    const openReceiptBtn = document.getElementById('openReceipt');

    // Получаем данные заказа
    const params = new URLSearchParams(window.location.search);
    const orderData = JSON.parse(params.get('data') || '{}');

    orderSummary.innerHTML = `
        <p><b>Дата:</b> ${orderData.date}</p>
        <p><b>Время:</b> ${orderData.time}</p>
        <p><b>Длительность:</b> ${orderData.duration}</p>
        <p><b>Место:</b> ${orderData.place}</p>
        <p><b>Тариф:</b> ${orderData.tariff}</p>
        <p><b>Комментарий:</b> ${orderData.comment}</p>
        <p><b>Сумма заказа:</b> ${orderData.total || '0 ₽'}</p>
    `;

    // Подсветка ошибок
    function showError(input, message) {
        input.classList.add('is-invalid');
        let err = input.nextElementSibling;
        if (!err || !err.classList.contains('invalid-feedback')) {
            err = document.createElement('div');
            err.className = 'invalid-feedback';
            input.parentNode.appendChild(err);
        }
        err.textContent = message;
    }

    function clearError(input) {
        input.classList.remove('is-invalid');
        const err = input.nextElementSibling;
        if (err && err.classList.contains('invalid-feedback')) err.remove();
    }

    // Форматирование карты
    cardInput.addEventListener('input', function () {
        let value = this.value.replace(/\D/g, '').slice(0, 16);
        this.value = value.match(/.{1,4}/g)?.join(' ') || '';
        clearError(this);
    });

    // Форматирование срока действия
    expiryInput.addEventListener('input', function () {
        let val = this.value.replace(/\D/g, '').slice(0, 4);
        const month = val.slice(0, 2);
        const year = val.slice(2);
        if (month.length === 2) this.value = month + (year ? '/' + year : '');
        else this.value = month;
        clearError(this);
    });

    // Ограничение CVC
    cvcInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 3);
        clearError(this);
    });

    // Сабмит формы
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        let valid = true;

        const cardDigits = cardInput.value.replace(/\s/g, '');
        if (cardDigits.length !== 16) {
            showError(cardInput, 'Номер карты должен содержать 16 цифр');
            valid = false;
        }

        if (cvcInput.value.length !== 3) {
            showError(cvcInput, 'CVC должен содержать 3 цифры');
            valid = false;
        }

        if (!expiryInput.value.match(/^\d{2}\/\d{2}$/)) {
            showError(expiryInput, 'Введите срок действия в формате MM/YY');
            valid = false;
        } else {
            const monthNum = parseInt(expiryInput.value.slice(0, 2), 10);
            if (monthNum < 1 || monthNum > 12) {
                showError(expiryInput, 'Месяц должен быть от 01 до 12');
                valid = false;
            }
        }

        if (!valid) return;

        form.style.display = 'none';
        paidMessage.style.display = 'block';
    });

    openReceiptBtn.addEventListener('click', function () {
        window.open(`/receipt?data=${encodeURIComponent(JSON.stringify(orderData))}`, '_blank', 'width=400,height=600');
    });

    // Сообщаем родительскому окну, что заказ оплачен
    window.addEventListener('beforeunload', function () {
        if (paidMessage.style.display === 'block') {
            window.opener.postMessage('paid', '*');
        }
    });
});