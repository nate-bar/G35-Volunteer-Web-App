import json


def load_user_event_matchings():
    try:
        with open('user_event_matching_db.json', 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return []


def save_user_event_matchings(users):
    with open('user_event_matching_db.json', 'w') as file:
        json.dump(users, file, indent=4)

user_event_matching_db = load_user_event_matchings()
