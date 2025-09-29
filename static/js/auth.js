document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById("loginForm");

    form.addEventListener("submit", (e) => {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        // мягкая проверка пустых полей
        if (!username || !password) {
            e.preventDefault();
            showWarning("Заполните все поля!");
            return;
        }

        if (!username.includes("@")) {
            e.preventDefault();
            showWarning("Логин должен быть электронной почтой и содержать '@'");
            return;
        }
    });

    function showWarning(message) {
        let existing = document.querySelector(".js-warning");
        if (!existing) {
            const div = document.createElement("div");
            div.className = "alert alert-warning js-warning mt-2";
            div.innerText = message;
            form.prepend(div);
        } else {
            existing.innerText = message;
        }
    }
});