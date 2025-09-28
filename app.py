from flask import Flask, render_template, request, redirect, url_for, g
import sqlite3
from datetime import datetime, timedelta

app = Flask(__name__)
DATABASE = 'database.db'

# --- Работа с базой данных ---
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row  # чтобы возвращались словари
    return g.db

@app.teardown_appcontext
def close_db(error):
    db = g.pop('db', None)
    if db is not None:
        db.close()

# --- Маршруты ---
@app.route("/")
@app.route("/index")
def index():
    db = get_db()
    prices = db.execute("SELECT service, price_1h, price_12h, price_night FROM prices").fetchall()
    return render_template("index.html", prices=prices)

@app.route("/account")
def account():
    return render_template("account.html")

@app.route("/admin")
def admin():
    return render_template("admin.html")

@app.route("/auth")
def auth():
    return render_template("auth.html")

@app.route("/payment")
def payment():
    return render_template("payment.html")

@app.route("/receipt")
def receipt():
    return render_template("receipt.html")

@app.route("/register")
def register():
    return render_template("register.html")

@app.route("/register_user", methods=["POST"])
def register_user():
    username = request.form.get("username")
    password = request.form.get("password")
    confirm_password = request.form.get("confirm_password")
    # Здесь можно добавить проверку совпадения паролей и сохранение в БД
    print(username, password, confirm_password)
    return redirect(url_for("auth"))

@app.route("/booking", methods=["GET", "POST"])
def booking():
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

    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    return render_template("booking.html", tomorrow=tomorrow)

if __name__ == '__main__':
    app.run(debug=True)