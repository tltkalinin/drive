import sqlite3

DATABASE = 'database.db'

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Создаем таблицы как в app.py
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            phone TEXT,
            total INTEGER DEFAULT 0
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            zone TEXT NOT NULL,
            subzone TEXT NOT NULL,
            service TEXT DEFAULT '',
            duration TEXT NOT NULL,
            price INTEGER NOT NULL
        )
    ''')
    
    cursor.execute('''
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
    ''')
    
    # Добавляем тестовые данные для тарифов
    tariffs_data = [
        ('pc', 'common', '1h', 500),
        ('pc', 'common', '12h', 5500),
        ('pc', 'common', 'night', 4800),
        ('pc', 'vip', '1h', 700),
        ('pc', 'vip', '12h', 7500),
        ('pc', 'vip', 'night', 6500),
        ('ps', 'common', '1h', 400),
        ('ps', 'common', '12h', 4200),
        ('ps', 'common', 'night', 3800),
        ('ps', 'vip', '1h', 600),
        ('ps', 'vip', '12h', 6200),
        ('ps', 'vip', 'night', 5800),
        ('xbox', 'common', '1h', 450),
        ('xbox', 'common', '12h', 4700),
        ('xbox', 'common', 'night', 4200),
        ('xbox', 'vip', '1h', 650),
        ('xbox', 'vip', '12h', 6700),
        ('xbox', 'vip', 'night', 6200),
        ('vr', 'vrstation', '1h', 900),
        ('vr', 'vrstation', '12h', 9200),
        ('vr', 'vrstation', 'night', 8800)
    ]
    
    for zone, subzone, duration, price in tariffs_data:
        cursor.execute('''
            INSERT OR IGNORE INTO prices (zone, subzone, duration, price)
            VALUES (?, ?, ?, ?)
        ''', (zone, subzone, duration, price))
    
    # Создаем тестового пользователя
    cursor.execute('''
        INSERT OR IGNORE INTO users (username, password, name, phone, total)
        VALUES (?, ?, ?, ?, ?)
    ''', ('test@test.com', 'pbkdf2:sha256:test', 'Тестовый пользователь', '+79990000000', 1500))
    
    conn.commit()
    conn.close()
    print("База данных инициализирована!")

if __name__ == '__main__':
    init_db()