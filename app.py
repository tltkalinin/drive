from flask import Flask, render_template, request, redirect, url_for, g, flash, session
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import re

app = Flask(__name__)
app.secret_key = "super-secret-key"
DATABASE = 'database.db'

# --- Работа с базой данных ---
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(error):
    db = g.pop('db', None)
    if db is not None:
        db.close()

# --- Инициализация таблицы users ---
def init_db():
    db = get_db()
    db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            phone TEXT,
            discount INTEGER DEFAULT 0
        )
    """)
    db.commit()

# --- Главная ---
@app.route("/")
@app.route("/index")
def index():
    db = get_db()
    prices = db.execute("SELECT service, price_1h, price_12h, price_night FROM prices").fetchall()
    return render_template("index.html", prices=prices)

# --- Регистрация ---
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")

        if password != confirm_password:
            flash("Пароли не совпадают!", "danger")
            return redirect(url_for("register"))

        if "@" not in username:
            flash("Логин должен быть электронной почтой и содержать '@'", "danger")
            return redirect(url_for("register"))

        if len(password) < 8 or not re.search(r'[a-zA-Z]', password) or not re.search(r'\d', password):
            flash("Пароль должен содержать минимум 8 символов, включая английские буквы и цифры", "danger")
            return redirect(url_for("register"))

        db = get_db()
        user_exists = db.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        if user_exists:
            flash("Пользователь с таким логином уже существует!", "danger")
            return redirect(url_for("register"))

        password_hash = generate_password_hash(password)
        db.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password_hash))
        db.commit()
        flash("Регистрация прошла успешно!", "success")
        return redirect(url_for("auth"))

    return render_template("register.html")

# --- Авторизация ---
@app.route("/auth", methods=["GET", "POST"])
def auth():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        db = get_db()
        user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            flash("Вы успешно вошли!", "success")
            return redirect(url_for("account"))
        else:
            flash("Неверный логин или пароль", "danger")
            return redirect(url_for("auth"))
    return render_template("auth.html")

# --- Личный кабинет ---
@app.route("/account", methods=["GET"])
def account():
    user_id = session.get('user_id')
    if not user_id:
        flash("Сначала войдите в систему", "warning")
        return redirect(url_for("auth"))

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return render_template("account.html", user=user, is_account_page=True)

# --- Обновление информации в ЛК ---
@app.route("/update_account", methods=["POST"])
def update_account():
    user_id = session.get('user_id')
    if not user_id:
        flash("Сначала войдите в систему", "warning")
        return redirect(url_for("auth"))

    name = request.form.get("name")
    phone = request.form.get("phone")

    db = get_db()
    db.execute("UPDATE users SET name = ?, phone = ? WHERE id = ?", (name, phone, user_id))
    db.commit()
    flash("Информация обновлена", "success")
    return redirect(url_for("account"))

# --- Выход ---
@app.route("/logout")
def logout():
    session.pop('user_id', None)
    flash("Вы вышли из системы", "success")
    return redirect(url_for("auth"))

# --- Бронирование ---
@app.route("/booking", methods=["GET", "POST"])
def booking():
    db = get_db()
    if request.method == "POST":
        data = {
            "date": request.form.get("date"),
            "time": request.form.get("time"),
            "duration": request.form.get("duration"),
            "auto_extend": "auto_extend" in request.form,
            "zone": request.form.get("zone"),
            "subzone": request.form.get("subzone"),
            "promocode": request.form.get("promocode"),
            "payment": request.form.get("payment"),
        }
        print(data)
        return redirect(url_for("booking"))

    tomorrow = ""  # без даты
    prices = db.execute("SELECT service, price_1h, price_12h, price_night FROM prices").fetchall()
    return render_template("booking.html", tomorrow=tomorrow, prices=prices)

if __name__ == '__main__':
    with app.app_context():
        init_db()
    app.run(debug=True)