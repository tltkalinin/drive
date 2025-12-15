from flask import Flask, render_template, request, redirect, url_for, g, flash, session
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import re
import math

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
    if db:
        db.close()

# --- Инициализация таблиц ---
def init_db():
    db = get_db()
    db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            phone TEXT,
            total INTEGER DEFAULT 0
        )
    """)
    db.execute("""
        CREATE TABLE IF NOT EXISTS prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            zone TEXT NOT NULL,
            subzone TEXT NOT NULL,
            service TEXT DEFAULT '',
            duration TEXT NOT NULL,
            price INTEGER NOT NULL
        )
    """)
    db.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            date TEXT,
            time TEXT,
            zone TEXT,
            subzone TEXT,
            duration TEXT,
            places TEXT,
            comment TEXT,
            payment TEXT,
            total INTEGER,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    db.commit()

# --- Главная ---
@app.route("/")
@app.route("/index")
def index():
    db = get_db()
    user_id = session.get('user_id')
    is_admin = session.get('is_admin', False)
    
    # Берём все цены из БД
    prices = db.execute("SELECT zone, subzone, duration, price FROM prices").fetchall()
    
    # Формируем словарь tariffs[zone][subzone][duration] = price
    tariffs = {}
    for t in prices:
        zone = t['zone']
        subzone = t['subzone']
        duration = t['duration']
        price = t['price']
        tariffs.setdefault(zone, {})
        tariffs[zone].setdefault(subzone, {})
        tariffs[zone][subzone][duration] = price

    return render_template("index.html", tariffs=tariffs, user_id=user_id, is_admin=is_admin, is_account_page=False)
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
            flash("Логин должен быть электронной почтой", "danger")
            return redirect(url_for("register"))
        if len(password) < 8 or not re.search(r'[a-zA-Z]', password) or not re.search(r'\d', password):
            flash("Пароль должен содержать минимум 8 символов, включая буквы и цифры", "danger")
            return redirect(url_for("register"))

        db = get_db()
        if db.execute("SELECT id FROM users WHERE username=?", (username,)).fetchone():
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
    next_page = request.args.get('next') or request.form.get('next') or url_for("account")

    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        db = get_db()
        user = db.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()

        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            session['is_admin'] = username.lower() == "admin@drive.local"

            if session['is_admin']:
                return redirect(url_for("admin_panel"))
            else:
                return redirect(next_page)

        flash("Неверный логин или пароль", "danger")
        return redirect(url_for("auth", next=next_page))

    # GET запрос
    return render_template("auth.html", next=next_page)

# --- Личный кабинет ---
@app.route("/account")
def account():
    user_id = session.get('user_id')
    if not user_id:
        flash("Сначала войдите в систему", "warning")
        return redirect(url_for("auth"))

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    orders = db.execute("SELECT * FROM orders WHERE user_id=?", (user_id,)).fetchall()

    paid_sum_row = db.execute(
        "SELECT COALESCE(SUM(total), 0) AS s FROM orders WHERE user_id=? AND status='paid'",
        (user_id,)
    ).fetchone()
    total_spent = paid_sum_row['s']
    discount = math.floor(total_spent / 1000)
    discount = min(discount, 30)

    return render_template("account.html", user=user, discount=discount, orders=orders, is_account_page=True)



# --- Обновление информации ---
@app.route("/update_account", methods=["POST"])
def update_account():
    user_id = session.get('user_id')
    if not user_id:
        flash("Сначала войдите в систему", "warning")
        return redirect(url_for("auth"))

    name = request.form.get("name")
    phone = request.form.get("phone")
    db = get_db()
    db.execute("UPDATE users SET name=?, phone=? WHERE id=?", (name, phone, user_id))
    db.commit()
    flash("Информация обновлена", "success")
    return redirect(url_for("account"))

# --- Выход ---
@app.route("/logout")
def logout():
    session.pop('user_id', None)
    session.pop('is_admin', None)
    return redirect(url_for("auth"))

@app.route("/payment")
def payment():
    user_id = session.get('user_id')
    if not user_id:
        flash("Сначала войдите в систему", "warning")
        return redirect(url_for("auth"))

    db = get_db()
    # последний заказ этого пользователя
    last_order = db.execute(
        "SELECT id FROM orders WHERE user_id=? ORDER BY id DESC LIMIT 1",
        (user_id,)
    ).fetchone()

    if last_order:
        db.execute("UPDATE orders SET status='paid' WHERE id=?", (last_order['id'],))
        db.commit()

    return render_template("payment.html")

# --- Страница оплаты ---
@app.route("/receipt")
def receipt():
    return render_template("receipt.html")

# --- Бронирование ---
@app.route("/booking", methods=["GET", "POST"])
def booking():
    db = get_db()
    tariffs = db.execute("SELECT zone, subzone, duration, price FROM prices").fetchall()


    # Формируем словарь для JS: tariffs[zone][subzone][duration] = price
    tariffs_dict = {}
    for t in tariffs:
        zone = t['zone']
        subzone = t['subzone']
        duration = t['duration']
        price = t['price']
        tariffs_dict.setdefault(zone, {})
        tariffs_dict[zone].setdefault(subzone, {})
        tariffs_dict[zone][subzone][duration] = price

    if request.method == "POST":
        user_id = session.get('user_id')
        if not user_id:
            flash("Сначала войдите в систему", "warning")
            return redirect(url_for("auth"))

        date = request.form.get("date")
        time = request.form.get("time")
        zone = request.form.get("zone")
        subzone = request.form.get("subzone")
        duration = request.form.get("duration")
        places = request.form.get("place")
        comment = request.form.get("comment")
        payment = request.form.get("payment")

        # Получаем цену
        price_table = tariffs_dict.get(zone, {}).get(subzone, {})

        if duration in ['night', '12h']:
           selected_tariff = int(price_table.get(duration, 0))
        else:
            # почасовой тариф: берём цену за 1 час и умножаем на количество часов
            base = price_table.get('1') or price_table.get('1h') or 0
            selected_tariff = int(base) * int(duration)

        total_price = selected_tariff * (len(places.split(',')) if places else 1)

        initial_status = "pending"

        db.execute("""
            INSERT INTO orders (user_id, date, time, zone, subzone, duration, places, comment, payment, total, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, date, time, zone, subzone, duration, places, comment, payment, total_price, initial_status))
        db.execute("UPDATE users SET total = total + ? WHERE id=?", (total_price, user_id))
        db.commit()

        if payment == "online":
            return redirect(url_for("payment"))
        else:
            return redirect(url_for("booking_success"))

    return render_template("booking.html", tariffs=tariffs_dict)

# --- Подтверждение брони ---
@app.route("/booking_success")
def booking_success():
    return render_template("booking_success.html")

# --- Админка ---
@app.route("/admin", methods=["GET", "POST"])
def admin_panel():
    if not session.get('is_admin'):
        flash("Доступ запрещён", "danger")
        return redirect(url_for("index"))

    db = get_db()

    if request.method == "POST":
        for row in db.execute("SELECT id, zone, subzone, duration FROM prices").fetchall():
            try:
                price = int(request.form.get(f"price_{row['id']}"))
                db.execute("UPDATE prices SET price=? WHERE id=?", (price, row['id']))
            except (ValueError, TypeError):
                continue
        db.commit()

    users = db.execute("SELECT * FROM users").fetchall()
    orders = db.execute("""
        SELECT o.*, u.name AS user_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
    """).fetchall()

    prices = db.execute("SELECT * FROM prices").fetchall()
    return render_template("admin.html", users=users, orders=orders, tariffs=prices, is_admin=True, is_account_page=False)

# --- Инициализация ---
if __name__ == "__main__":
    with app.app_context():
        init_db()
    app.run(host="0.0.0.0", port=5001, debug=True)