import json

def load_notifications():
    try:
        with open('notifications_db.json', 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return []

def save_notifications(notifications):
    with open('notifications_db.json', 'w') as file:
        json.dump(notifications, file, indent=4)

# Initialize an empty notifications database
notifications_db = load_notifications()
