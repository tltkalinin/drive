document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const orderData = JSON.parse(params.get('data'));

    document.getElementById('receiptContent').innerHTML = `
        <p>Номер заказа: 526356</p>
        <p>Дата: ${orderData.date}</p>
        <p>Время: ${orderData.time}</p>
        <p>Длительность: ${orderData.duration}</p>
        <p>Место: ${orderData.place}</p>
        <p>Тариф: ${orderData.tariff}</p>
        <p>Комментарий: ${orderData.comment}</p>
    `;
});