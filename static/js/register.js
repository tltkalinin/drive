document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById("registerForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirm_password");
    const submitBtn = form.querySelector("button[type='submit']");

    // --- Создаем элементы для сообщений об ошибках ---
    const usernameError = document.createElement("div");
    usernameError.style.color = "red";
    usernameError.style.fontSize = "0.9rem";
    usernameError.style.marginTop = "4px";
    usernameError.style.fontFamily = "'Jost', sans-serif";
    usernameInput.parentNode.appendChild(usernameError);

    const passwordError = document.createElement("div");
    passwordError.style.color = "red";
    passwordError.style.fontSize = "0.9rem";
    passwordError.style.marginTop = "4px";
    passwordError.style.fontFamily = "'Jost', sans-serif";
    passwordInput.parentNode.appendChild(passwordError);

    const confirmError = document.createElement("div");
    confirmError.style.color = "red";
    confirmError.style.fontSize = "0.9rem";
    confirmError.style.marginTop = "4px";
    confirmError.style.fontFamily = "'Jost', sans-serif";
    confirmInput.parentNode.appendChild(confirmError);

    // --- Функция проверки всех условий ---
    function validateForm() {
        let valid = true;

        // Проверка логина
        if (!usernameInput.value.includes("@")) {
            usernameError.textContent = "Логин должен быть электронной почтой и содержать '@'";
            valid = false;
        } else {
            usernameError.textContent = "";
        }

        // Проверка пароля
        const val = passwordInput.value;
        const hasLetter = /[a-zA-Z]/.test(val);
        const hasNumber = /\d/.test(val);
        if (val.length < 8 || !hasLetter || !hasNumber) {
            passwordError.textContent = "Пароль должен содержать минимум 8 символов и включать буквы и цифры";
            valid = false;
        } else {
            passwordError.textContent = "";
        }

        // Проверка совпадения пароля
        if (passwordInput.value !== confirmInput.value) {
            confirmError.textContent = "Пароли не совпадают!";
            valid = false;
        } else {
            confirmError.textContent = "";
        }

        // Блокировка кнопки
        submitBtn.disabled = !valid;
    }

    // --- Проверка на blur и input для динамического обновления ---
    usernameInput.addEventListener("blur", validateForm);
    usernameInput.addEventListener("input", validateForm);

    passwordInput.addEventListener("blur", validateForm);
    passwordInput.addEventListener("input", validateForm);

    confirmInput.addEventListener("blur", validateForm);
    confirmInput.addEventListener("input", validateForm);

    // --- Изначально заблокируем кнопку ---
    submitBtn.disabled = true;

    // --- Финальная проверка при submit ---
    form.addEventListener("submit", function(e) {
        validateForm();
        if (submitBtn.disabled) e.preventDefault();
    });
});