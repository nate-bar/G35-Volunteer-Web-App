import json


def load_events():
    try:
        with open('events_data.json', 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return []


def save_events(users):
    with open('events_data.json', 'w') as file:
        json.dump(users, file, indent=4)

events_db = load_events()
