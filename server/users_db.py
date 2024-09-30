import json


def load_users():
    try:
        with open('users_db.json', 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return []


def save_users(users):
    with open('users_db.json', 'w') as file:
        json.dump(users, file, indent=4)

users_db = load_users()
