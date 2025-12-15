// static/js/account.js
document.addEventListener('DOMContentLoaded', () => {
    // Toggle заказов
    document.querySelector('.orders-toggle').addEventListener('click', toggleOrders);
    
    // Редактирование профиля
    document.getElementById('editBtn').addEventListener('click', editProfile);
});

function toggleOrders() {
    const ordersDiv = document.getElementById('ordersList');
    ordersDiv.classList.toggle('hidden');
}

function editProfile() {
    document.getElementById('nameDiv').classList.add('hidden');
    document.getElementById('phoneDiv').classList.add('hidden');
    document.getElementById('nameInput').classList.remove('hidden');
    document.getElementById('phoneInput').classList.remove('hidden');
    document.getElementById('editBtn').classList.add('hidden');
    document.getElementById('saveBtn').classList.remove('hidden');
}
