document.addEventListener('DOMContentLoaded', function () {
    const durationSelect = document.querySelector('select[name="duration"]');
    const timeSelect = document.querySelector('select[name="time"]');
    const autoExtendCheckbox = document.querySelector('input[name="auto_extend"]');
    const zoneSelect = document.getElementById('zone');
    const subzoneSelect = document.getElementById('subzone');
    const placeWrapper = document.getElementById('placeWrapper');
    const placeLabel = document.getElementById('placeLabel');
    const placeSelect = document.getElementById('placeSelect');
    const paymentSelect = document.getElementById('payment');
    const payButtonWrapper = document.getElementById('payButtonWrapper');
    const paidLabelWrapper = document.getElementById('paidLabelWrapper');
    const orderTotalWrapper = document.getElementById('orderTotalWrapper');
    const orderTotal = document.getElementById('orderTotal');
    const form = document.getElementById('bookingForm');
    // --- минимальная дата для бронирования (сегодня) ---
    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        dateInput.setAttribute('min', todayStr);
    }
    
    // --- тарифы ---
    const tariffs = {
        pc: {
            common: { hour: 500, '12h': 5500, night: 4800, '24h': 10000 },
            room: { hour: 900, '12h': 9500, night: 8500, '24h': 18000 }
        },
        ps: {
            common: { hour: 400, '12h': 4200, night: 3800, '24h': 7800 },
            room: { hour: 700, '12h': 7200, night: 6500, '24h': 14000 }
        },
        xbox: {
            common: { hour: 450, '12h': 4700, night: 4200, '24h': 8500 },
            room: { hour: 800, '12h': 8200, night: 7600, '24h': 15500 }
        },
        vr: {
            vrstation: { hour: 900, '12h': 9200, night: 8800, '24h': 17000 }
        }
    };

    // --- расчёт суммы ---
    function updateOrderTotal() {
        const zone = zoneSelect.value;
        const subzone = subzoneSelect.value;
        const duration = durationSelect.value;
        if (!zone || !subzone || !duration) {
            orderTotalWrapper.style.display = 'none';
            return;
        }

        const selectedPlaces = placeSelect.value ? placeSelect.value.split(',') : [];
        const count = selectedPlaces.length || 1;

        let price = 0;
        const tariff = tariffs[zone]?.[subzone];
        if (!tariff) {
            orderTotalWrapper.style.display = 'none';
            return;
        }

        if (['night', '12h', '24h'].includes(duration)) {
            price = tariff[duration] || 0;
        } else {
            price = (tariff.hour || 0) * Number(duration);
        }

        price = price * count;

        if (price > 0) {
            orderTotal.textContent = price + ' ₽';
            orderTotalWrapper.style.display = 'block';
        } else {
            orderTotalWrapper.style.display = 'none';
        }
    }

    // --- автопродление ---
    function updateAutoExtend() {
        const allowedDurations = ['1', '2', '3', '4', '5', '6'];
        if (allowedDurations.includes(durationSelect.value)) {
            autoExtendCheckbox.disabled = false;
        } else {
            autoExtendCheckbox.checked = false;
            autoExtendCheckbox.disabled = true;
        }
    }

    durationSelect.addEventListener('change', function () {
        if (this.value === 'night') {
            timeSelect.value = '22:00';
        }
        updateAutoExtend();
        updateOrderTotal();
    });

    // --- подзоны ---
    function updateSubzones() {
        subzoneSelect.innerHTML = '';
        const zone = zoneSelect.value;

        if (zone === 'pc' || zone === 'ps' || zone === 'xbox') {
            subzoneSelect.append(new Option('Общий зал (стол)', 'common'));
            subzoneSelect.append(new Option('Отдельная комната', 'room'));
        }
        if (zone === 'vr') {
            subzoneSelect.append(new Option('VR-станция', 'vrstation'));
        }
        updatePlaces();
        updateOrderTotal();
    }

    // --- места ---
    function updatePlaces() {
        const placeGrid = document.getElementById('placeGrid');
        placeGrid.innerHTML = '';
        placeWrapper.style.display = 'none';
        const zone = zoneSelect.value;
        const subzone = subzoneSelect.value;
        if (!zone || !subzone) return;

        let count = 0;
        let label = '';

        if (zone === 'pc' && subzone === 'common') { count = 24; label = 'Номер стола PC'; }
        if (zone === 'pc' && subzone === 'room') { count = 6; label = 'Номер комнаты PC'; }
        if (zone === 'ps' && subzone === 'common') { count = 8; label = 'Номер стола PlayStation'; }
        if (zone === 'ps' && subzone === 'room') { count = 6; label = 'Номер комнаты PlayStation'; }
        if (zone === 'xbox' && subzone === 'common') { count = 8; label = 'Номер стола X-box'; }
        if (zone === 'xbox' && subzone === 'room') { count = 6; label = 'Номер комнаты X-box'; }
        if (zone === 'vr' && subzone === 'vrstation') { count = 7; label = 'Номер VR-станции'; }

        if (count > 0) {
            placeLabel.textContent = label;
            placeWrapper.style.display = 'block';
            placeSelect.value = '';
            const selectedPlaces = new Set();
            for (let i = 1; i <= count; i++) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-outline-light btn-sm';
                btn.textContent = i;
                btn.addEventListener('click', () => {
                    if (selectedPlaces.has(i)) {
                        selectedPlaces.delete(i);
                        btn.classList.remove('active');
                    } else {
                        selectedPlaces.add(i);
                        btn.classList.add('active');
                    }
                    placeSelect.value = Array.from(selectedPlaces).sort((a, b) => a - b).join(',');
                    updateOrderTotal();
                });
                placeGrid.appendChild(btn);
            }
        }
    }

    zoneSelect.addEventListener('change', updateSubzones);
    subzoneSelect.addEventListener('change', updatePlaces);
    durationSelect.addEventListener('change', updateOrderTotal);

    paymentSelect.addEventListener('change', function () {
        payButtonWrapper.style.display = (this.value === 'online') ? 'block' : 'none';
    });

    // --- онлайн оплата ---
    let paymentWindowOpened = false;
    document.getElementById('openPaymentBtn').addEventListener('click', function () {
        if (paymentWindowOpened) return;
        const orderData = {
            date: form.date.value,
            time: form.time.value,
            duration: form.duration.options[form.duration.selectedIndex].text,
            place: placeSelect.value,
            tariff: ['night', '12h', '24h'].includes(form.duration.value) ?
                form.duration.options[form.duration.selectedIndex].text : 'Стандартный',
            comment: form.comment.value || '—',
            total: orderTotal.textContent
        };
        const paymentWindow = window.open(
            `/payment?data=${encodeURIComponent(JSON.stringify(orderData))}`,
            '_blank',
            `width=${screen.width},height=${screen.height},top=0,left=0`
        );
        paymentWindowOpened = true;

        window.addEventListener('message', function handler(e) {
            if (e.data === 'paid') {
                payButtonWrapper.style.display = 'none';
                paidLabelWrapper.style.display = 'block';
                paymentWindowOpened = false;
                window.removeEventListener('message', handler);
            }
        });
    });

    // --- сабмит бронирования ---
    // --- Сабмит бронирования ---
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        let valid = true;

        // Вспомогательная функция для проверки обязательного поля
        function validateRequired(el) {
            if (!el.value || el.value.trim() === '') {
                el.classList.add('is-invalid');
                valid = false;
            } else {
                el.classList.remove('is-invalid');
            }
        }

        // Проверяем обязательные поля
        validateRequired(form.date);
        validateRequired(form.time);
        validateRequired(form.duration);
        validateRequired(zoneSelect);
        validateRequired(subzoneSelect);
        validateRequired(placeSelect);
        validateRequired(paymentSelect);

        if (!valid) return; // если что-то не заполнено, выходим

        // --- заполняем данные модалки ---
        const modal = document.getElementById('confirmModal');
        if (!modal) return;

        const dateParts = form.date.value.split('-');
        document.getElementById('confDate').textContent = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
        document.getElementById('confTime').textContent = form.time.value;
        document.getElementById('confDuration').textContent = form.duration.options[form.duration.selectedIndex].text;
        document.getElementById('confPlace').textContent = placeWrapper.style.display === 'block'
            ? (placeLabel.textContent + ' ' + placeSelect.value)
            : '—';
        document.getElementById('confExtend').textContent = autoExtendCheckbox.checked ? 'Активировано' : 'Нет';
        document.getElementById('confTariff').textContent = ['night', '12h', '24h'].includes(form.duration.value)
            ? form.duration.options[form.duration.selectedIndex].text
            : 'Стандартный';
        document.getElementById('confComment').textContent = form.comment.value || '—';

        // Статус оплаты
        const paidLabel = document.getElementById('paidLabelWrapper');
        document.getElementById('confPaymentStatus').textContent = paidLabel.style.display === 'block'
            ? 'Заказ оплачен'
            : 'Не оплачен';

        // сумма в модалке
        document.getElementById('confTotal').textContent = orderTotal.textContent;

        // Показываем модалку
        new bootstrap.Modal(modal).show();
    });

    updateAutoExtend();
});