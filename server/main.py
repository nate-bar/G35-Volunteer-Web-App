from flask import Flask, jsonify, request, url_for
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_mail import Mail, Message
import re
import secrets
from users_db import users_db, save_users
from events_data import events_db, save_events
from config import Config  # Import your configuration

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Apply the configuration from config.py
app.config.from_object(Config)

bcrypt = Bcrypt(app)
mail = Mail(app)

# Temporary storage for pending registrations
pending_users = {}

# Home route
@app.route('/')
def home():
    return "<h1>Welcome to the Volunteer Management API</h1>"

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    email = data.get('email')
    password = data.get('password')
    role = data.get('role')

    # Validation
    if not email or not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({'error': 'Invalid email address'}), 400

    if not password or len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long'}), 400

    if role not in ['admin', 'user']:
        return jsonify({'error': 'Role must be either "admin" or "user"'}), 400

    # Check if email already exists
    if any(user['email'] == email for user in users_db):
        return jsonify({'error': 'Email is already registered'}), 400

    # Generate a confirmation token
    token = secrets.token_urlsafe(16)

    # Store the user in pending_users temporarily
    pending_users[token] = {
        'email': email,
        'password': bcrypt.generate_password_hash(password).decode('utf-8'),
        'role': role,
    }

    # Send a confirmation email to the user
    confirmation_link = f'http://localhost:4200/confirm-email/{token}'
    msg = Message('Confirm Your Email', recipients=[email])
    msg.body = f'Please click the link to confirm your email: {confirmation_link}'
    mail.send(msg)

    return jsonify({'message': 'Registration initiated. Please check your email to confirm.'}), 201


@app.route('/api/confirm/<token>', methods=['GET'])
def confirm_email(token):
    # Check if the token exists in pending_users
    if token not in pending_users:
        return jsonify({'error': 'Invalid or expired token.'}), 400

    # Retrieve and save the user data from pending_users
    user_data = pending_users.pop(token)
    users_db.append(user_data)
    save_users(users_db)

    return jsonify({'message': 'Email confirmed. Registration successful.'}), 200


# Login endpoint
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    email = data.get('email')
    password = data.get('password')

    # Find user by email
    user = next((user for user in users_db if user['email'] == email), None)

    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401

    # Check the password
    if not bcrypt.check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid email or password'}), 401

    return jsonify({'message': 'Login successful', 'role': user['role']}), 200

# Get all events
@app.route('/api/events', methods=['GET'])
def get_events():
    return jsonify(events_db)

# Add a new event
@app.route('/api/events', methods=['POST'])
def add_event():
    try:
        new_event = request.get_json()
        new_event['id'] = len(events_db) + 1
        events_db.append(new_event)
        save_events(events_db)
        return jsonify({'message': 'Event added successfully', 'event': new_event}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add event', 'details': str(e)}), 500

# Update an event
@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    try:
        updated_event = request.get_json()
        for event in events_db:
            if event['id'] == event_id:
                event.update(updated_event)
                save_events(events_db)
                return jsonify({'message': 'Event updated successfully', 'event': event}), 200
        return jsonify({'error': 'Event not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to update event', 'details': str(e)}), 500

# Delete an event
@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    try:
        for event in events_db:
            if event['id'] == event_id:
                events_db.remove(event)
                save_events(events_db)
                return jsonify({'message': 'Event deleted successfully'}), 200
        return jsonify({'error': 'Event not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to delete event', 'details': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
