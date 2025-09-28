import sqlite3

DATABASE = 'database.db'

# Подключение к базе
conn = sqlite3.connect(DATABASE)
cursor = conn.cursor()

# Создаём таблицу пользователей, если её ещё нет
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
)
''')

# Создаём таблицу цен, если её ещё нет
cursor.execute('''
CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service TEXT NOT NULL UNIQUE,
    price_1h INTEGER NOT NULL,
    price_12h INTEGER NOT NULL,
    price_night INTEGER NOT NULL
)
''')

# Данные прайс-листа
prices_data = [
    ('PC - Общий зал', 500, 5500, 4800),
    ('PS - Общий зал', 400, 4200, 3800),
    ('X-box - Общий зал', 450, 4700, 4200),
    ('VR-станция', 900, 9200, 8800)
]

# Вставляем или обновляем цены (если сервис уже есть, обновим)
for service, price_1h, price_12h, price_night in prices_data:
    cursor.execute('''
    INSERT INTO prices (service, price_1h, price_12h, price_night)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(service) DO UPDATE SET
        price_1h=excluded.price_1h,
        price_12h=excluded.price_12h,
        price_night=excluded.price_night
    ''', (service, price_1h, price_12h, price_night))

# Сохраняем изменения и закрываем соединение
conn.commit()
conn.close()

print("База данных обновлена или создана, таблицы готовы к использованию!")