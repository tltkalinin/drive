document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('paymentForm');
    const cardInput = document.getElementById('cardNumber');
    const expiryInput = document.getElementById('expiry');
    const cvcInput = document.getElementById('cvc');
    const paidMessage = document.getElementById('paidMessage');
    const openReceiptBtn = document.getElementById('openReceipt');

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
        if (val.length >= 2) {
            this.value = val.slice(0, 2) + '/' + val.slice(2);
        } else {
            this.value = val;
        }
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

        // Проверка срока действия
        const expiry = expiryInput.value;
        if (!expiry.match(/^\d{2}\/\d{2}$/)) {
            showError(expiryInput, 'Введите срок действия в формате MM/YY');
            valid = false;
        } else {
            const [month, year] = expiry.split('/').map(Number);
            const currentYear = new Date().getFullYear() % 100;
            const currentMonth = new Date().getMonth() + 1;

            if (month < 1 || month > 12) {
                showError(expiryInput, 'Месяц должен быть от 01 до 12');
                valid = false;
            } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
                showError(expiryInput, 'Срок действия карты истек');
                valid = false;
            } else if (year > 99) {
                showError(expiryInput, 'Год не может быть больше 99');
                valid = false;
            }
        }

        if (cvcInput.value.length !== 3) {
            showError(cvcInput, 'CVC должен содержать 3 цифры');
            valid = false;
        }

        if (!valid) return;

        form.style.display = 'none';
        paidMessage.style.display = 'block';
    });

    openReceiptBtn.addEventListener('click', function () {
        // Открываем квитанцию без данных
        window.open('/receipt', '_blank', 'width=400,height=600');
    });

    // Сообщаем родительскому окну, что заказ оплачен
    window.addEventListener('beforeunload', function () {
        if (paidMessage.style.display === 'block') {
            window.opener.postMessage('paid', '*');
        }
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const paymentForm = document.getElementById("paymentForm");
    const paidMessage = document.getElementById("paidMessage");
    const bookBtn = document.getElementById("bookBtn");
    const bookingSuccess = document.getElementById("bookingSuccess");

    // Нажатие кнопки "Забронировать"
    bookBtn.addEventListener("click", () => {
        bookingSuccess.style.display = "block";

        // Через 3 секунды отправляем на главную
        setTimeout(() => {
            window.location.href = "/";
        }, 3000);
    });
});