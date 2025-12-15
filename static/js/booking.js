document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('bookingForm');
    const dateInput = document.getElementById('dateInput');
    const timeSelect = form.querySelector('select[name="time"]');
    const durationSelect = document.getElementById('durationSelect');
    const autoExtendCheckbox = document.getElementById('auto_extend');
    const zoneSelect = document.getElementById('zone');
    const subzoneSelect = document.getElementById('subzone');
    const placeWrapper = document.getElementById('placeWrapper');
    const placeLabel = document.getElementById('placeLabel');
    const placeGrid = document.getElementById('placeGrid');
    const placeSelect = document.getElementById('placeSelect');
    const orderTotalWrapper = document.getElementById('orderTotalWrapper');
    const orderTotal = document.getElementById('orderTotal');
    const paymentSelect = document.getElementById('payment');


    const tariffs = window.tariffsFromDB || {};

    // Ограничение даты — нельзя выбрать прошедшую
    const today = new Date();
    dateInput.setAttribute('min', today.toISOString().split('T')[0]);

    // --- Расчёт стоимости ---
    function updateOrderTotal() {
        const zone = zoneSelect.value;
        let subzone = subzoneSelect.value;
        const duration = durationSelect.value;

        if (!zone || !subzone || !duration) {
            orderTotalWrapper.style.display = 'none';
            return;
        }

        let subzoneKey = subzone;
        if (zone === 'vr') subzoneKey = 'vrstation';

        const priceTable = tariffs[zone]?.[subzoneKey];
        if (!priceTable) {
            orderTotalWrapper.style.display = 'none';
            return;
        }

        const selectedPlaces = placeSelect.value ? placeSelect.value.split(',') : ['1'];
        const count = selectedPlaces.length;

        let price = 0;

        if (duration === 'night' || duration === '12h') {
            price = priceTable[duration] || 0;
        } else {
            price = (priceTable['1'] || priceTable['1h'] || 0) * Number(duration);
        }

        price *= count;

        orderTotal.textContent = price + ' ₽';
        orderTotalWrapper.style.display = price > 0 ? 'block' : 'none';
    }

    // --- Автопродление ---
    function updateAutoExtend() {
        const allowed = ['1', '2', '3', '4', '5', '6'];
        if (allowed.includes(durationSelect.value)) {
            autoExtendCheckbox.disabled = false;
        } else {
            autoExtendCheckbox.checked = false;
            autoExtendCheckbox.disabled = true;
        }
    }

    durationSelect.addEventListener('change', function () {
        if (this.value === 'night') timeSelect.value = '22:00';
        updateAutoExtend();
        updateOrderTotal();
    });

    // --- Обновление подзон ---
    function updateSubzones() {
        subzoneSelect.innerHTML = '<option value="">Выберите подзону</option>';
        const zone = zoneSelect.value;
        if (!zone) return;

        if (['pc', 'ps', 'xbox'].includes(zone)) {
            subzoneSelect.append(new Option('Общий зал', 'common'));
            subzoneSelect.append(new Option('VIP', 'vip'));
        }
        if (zone === 'vr') {
            subzoneSelect.append(new Option('VR-станция', 'vrstation'));
        }

        updatePlaces();
        updateOrderTotal();
    }

    // --- Генерация кнопок выбора места ---
    function updatePlaces() {
        placeGrid.innerHTML = '';
        placeWrapper.style.display = 'none';
        const zone = zoneSelect.value;
        const subzone = subzoneSelect.value;

        if (!zone || !subzone) return;

        let count = 0, label = '';

        const zoneMap = {
            pc: { common: [24, 'Номер стола PC'], vip: [6, 'Номер комнаты PC'] },
            ps: { common: [8, 'Номер стола PlayStation'], vip: [6, 'Номер комнаты PlayStation'] },
            xbox: { common: [8, 'Номер стола X-box'], vip: [6, 'Номер комнаты X-box'] },
            vr: { vrstation: [7, 'Номер VR-станции'] }
        };

        const config = zoneMap[zone]?.[subzone];
        if (!config) return;

        count = config[0];
        label = config[1];

        placeLabel.textContent = label;
        placeWrapper.style.display = 'block';
        placeSelect.value = '';

        const selectedPlaces = new Set();

        for (let i = 1; i <= count; i++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'place-item';
            btn.textContent = i;

            btn.addEventListener('click', () => {
                if (selectedPlaces.has(i)) {
                    selectedPlaces.delete(i);
                    btn.classList.remove('selected');
                } else {
                    selectedPlaces.add(i);
                    btn.classList.add('selected');
                }

                placeSelect.value = Array.from(selectedPlaces)
                    .sort((a, b) => a - b)
                    .join(',');

                updateOrderTotal();
            });

            placeGrid.appendChild(btn);
        }

        updateOrderTotal();
    }

    zoneSelect.addEventListener('change', updateSubzones);
    subzoneSelect.addEventListener('change', updatePlaces);

    // --- Смена текста кнопки по способу оплаты ---
    paymentSelect.addEventListener('change', () => {
        const val = paymentSelect.value;
        const submitBtn = document.querySelector('.btn-submit');

        if (val === 'online') {
            submitBtn.textContent = 'Забронировать и оплатить онлайн';
        } else {
            submitBtn.textContent = 'Забронировать';
        }
    });




    // --- ОБРАБОТКА SUBMIT ---
    form.addEventListener('submit', function (e) {
        let valid = true;

        let warningDiv = document.getElementById('formWarning');
        if (!warningDiv) {
            warningDiv = document.createElement('div');
            warningDiv.id = 'formWarning';
            warningDiv.className = 'text-warning mb-3 text-center';
            form.prepend(warningDiv);
        }

        // Проверка обязательных полей
        [dateInput, timeSelect, durationSelect, zoneSelect, subzoneSelect, placeSelect, paymentSelect]
            .forEach(el => {
                if (!el.value) {
                    el.classList.add('is-invalid');
                    valid = false;
                } else {
                    el.classList.remove('is-invalid');
                }
            });

        if (!valid) {
            e.preventDefault();
            warningDiv.textContent = 'Пожалуйста, заполните все обязательные поля';
            return;
        }

    });

    // Инициализация
    updateAutoExtend();
    updateOrderTotal();
});