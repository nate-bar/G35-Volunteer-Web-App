import json


def load_profiles():
    try:
        with open('user_profiles_db.json', 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return []


def save_profile(profiles):
    with open('user_profiles_db.json', 'w') as file:
        json.dump(profiles, file, indent=4)

user_profiles_db = load_profiles()