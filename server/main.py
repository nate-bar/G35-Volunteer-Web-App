from flask import Flask, jsonify, request, urlfor, rendertemplate_string
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_mail import Mail, Message
import datetime
import re
import secrets
import datetime
from users_db import users_db, save_users
from user_profiles_db import user_profiles_db,save_profile
from notifications_db import notifications_db, save_notifications
from events_data import events_db, save_events
from user_event_matching_db import user_event_matching_db, save_user_event_matchings
from config import Config  # Import your configuration
from threading import Thread
from werkzeug.utils import secure_filename
import os,json

app = Flask(__name)
CORS(app)  # Allow cross-origin requests

UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

#Apply the configuration from config.py
app.config.from_object(Config)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

bcrypt = Bcrypt(app)
mail = Mail(app)

# Temporary storage for pending registrations
pending_users = {}

# Token expiration time in minutes
TOKEN_EXPIRATION_TIME = 60  # 60 minutes 


def send_async_email(app, msg):
    with app.app_context():
        mail.send(msg)

# Home route
@app.route('/')
def home():
    return "<h1>Welcome to the Volunteer Management API</h1>"

# Registration Endpoint
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
    expiration_time = datetime.datetime.now() + datetime.timedelta(minutes=TOKEN_EXPIRATION_TIME)

    # Store the user in pending_users temporarily
    pending_users[token] = {
        'email': email,
        'password': bcrypt.generate_password_hash(password).decode('utf-8'),
        'role': role,
        'expires_at': expiration_time
    }

    # Send a confirmation email to the user
    confirmation_link = f'http://localhost:4200/confirm-email/{token}'
    msg = Message('Confirm Your Email', recipients=[email])
    msg.html = f'''
    <html>
            <head>
                <style>
                    @keyframes fadeIn {{
                        0% {{ opacity: 0; }}
                        100% {{ opacity: 1; }}
                    }}

                    body {{
                        font-family: Arial, sans-serif;
                        background-color: #f9f9f9;
                        color: #333;
                        margin: 0;
                        padding: 20px;
                        animation: fadeIn 1.5s ease-in-out;
                    }}

                    .container {{
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #fff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.1);
                        text-align: center;
                        animation: fadeIn 2s ease-in-out;
                    }}

                    h3 {{
                        color: #4caf50;
                    }}

                    p {{
                        font-size: 16px;
                        line-height: 1.6;
                    }}

                    .confirm-button {{
                        display: inline-block;
                        margin-top: 20px;
                        padding: 15px 25px;
                        font-size: 18px;
                        color: #fff;
                        background-color: #4caf50;
                        text-decoration: none;
                        border-radius: 5px;
                        transition: background-color 0.3s ease;
                    }}

                    .confirm-button:hover {{
                        background-color: #45a049;
                    }}

                    .footer {{
                        margin-top: 30px;
                        font-size: 12px;
                        color: #888;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h3>Confirm Your Email</h3>
                    <p>Welcome to our platform! Please confirm your email address to activate your account.</p>
                    <p>This link will expire in <strong>1 hour</strong>.</p>
                    <a href="{confirmation_link}" class="confirm-button">Confirm Your Email</a>
                    <div class="footer">
                        <p>If you did not request this, please ignore this email.</p>
                    </div>
                </div>
            </body>
        </html>

    '''
    Thread(target=send_async_email, args=(app, msg)).start()
    return jsonify({'message': 'Registration initiated. Please check your email to confirm.'}), 201

# Email Confirmation Endpoint
@app.route('/api/confirm/<token>', methods=['GET'])
def confirm_email(token):
    # Check if the token exists in pending_users
    if token not in pending_users:
        return jsonify({'error': 'Invalid or expired token.'}), 400

    # Check if the token has expired
    user_data = pending_users[token]
    if datetime.datetime.now() > user_data['expires_at']:
        # Token has expired, remove it from pending_users
        del pending_users[token]
        return jsonify({'error': 'Token has expired. Please register again.'}), 400

    # Prepare user data by excluding 'expires_at' before saving
    confirmed_user_data = {
        'email': user_data['email'],
        'password': user_data['password'],
        'role': user_data['role'],
        'profile_completed': False  # Mark the profile as not completed initially
    }

    # Retrieve and save the user data from pending_users
    pending_users.pop(token)
    users_db.append(confirmed_user_data)
    save_users(users_db)

    # Send another email to the user indicating successful registration
    msg = Message('Registration Successful', recipients=[user_data['email']])
    msg.html = f"""
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Successful</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                padding: 20px;
            }}
            .container {{
                background-color: #ffffff;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                text-align: center;
                animation: fadeIn 1s ease-in-out;
            }}
            h1 {{
                color: #4caf50;
            }}
            p {{
                font-size: 1.2em;
                margin-bottom: 20px;
            }}
            @keyframes fadeIn {{
                from {{ opacity: 0; }}
                to {{ opacity: 1; }}
            }}
            .complete-profile-btn {{
                background-color: #4caf50;
                color: #ffffff;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                transition: background-color 0.3s;
            }}
            .complete-profile-btn:hover {{
                background-color: #45a049;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Registration Successful!</h1>
            <p>Your email has been confirmed. Please complete your profile to get started.</p>
            <a href="http://localhost:4200/profile?email={user_data['email']}" class="complete-profile-btn">Complete Profile</a>
        </div>
    </body>
    </html>
    """
    #mail.send(msg)
    # Send email asynchronously
    Thread(target=send_async_email, args=(app, msg)).start()

    return jsonify({'message': 'Email confirmed. Registration successful.'}), 200




@app.route('/api/profile', methods=['GET'])
def get_profile():
    email = request.args.get('email')
    if not email:
        return jsonify({'error': 'Email parameter is required'}), 400

    user = next((user for user in users_db if user['email'] == email), None)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify(user), 200


# Login Endpoint
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

    # Check if profile is completed
    if not user.get('profile_completed', False):
        return jsonify({
            'message': 'Login successful, but please complete your profile.',
            'role': user['role'],
            'email': user['email'],            # Return the email
            'full_name': user.get('full_name'), # Return the full_name
            'profile_completed': False
        }), 200

    return jsonify({
        'message': 'Login successful',
        'role': user['role'],
        'email': user['email'],                # Return the email
        'full_name': user.get('full_name'),     # Return the full_name
        'profile_completed': True
    }), 200



# Complete Profile Endpoint
@app.route('/api/profile', methods=['POST'])
def complete_profile():
    data = request.get_json()

    email = data.get('email')
    full_name = data.get('fullName')
    address1 = data.get('address1')
    address2 = data.get('address2')
    city = data.get('city')
    state = data.get('state')
    zip_code = data.get('zipCode')
    availability = data.get('availability')
    preferences=data.get('preferences')
    skills=data.get('skills')

    # Find user by email
    user = next((user for user in users_db if user['email'] == email), None)

    if not user:
        return jsonify({'error': 'User not found.'}), 404

    # Update user profile
    user['full_name'] = full_name
    user['address1'] = address1
    user['address2'] = address2
    user['city'] = city
    user['state'] = state
    user['zip_code'] = zip_code
    user['preferences']=preferences
    user['availability'] = availability
    user['skills'] =skills
    user['profile_completed'] = True
    

    save_users(users_db)

    return jsonify({'message': 'Profile completed successfully.'}), 201

# Get all useras
@app.route('/api/users', methods=['GET'])
def get_users():
    return jsonify(users_db)

# Get all user event matchings
@app.route('/api/admin/eventUserMatchings', methods=['GET'])
def get_user_event_matchings():
    return jsonify(user_event_matching_db)

# Function to check if the file extension is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Validate the event form fields
def validate_event_form(event_name, event_description, location, required_skills, urgency, event_date):
    # Event Name: required, max 100 characters
    if not event_name or len(event_name) > 100:
        return 'Event Name is required and must be at most 100 characters.'

    # Event Description: required
    if not event_description:
        return 'Event Description is required.'

    # Location: required
    if not location:
        return 'Location is required.'

    # Required Skills: must be a non-empty list
    if not required_skills or not isinstance(required_skills, list) or len(required_skills) == 0:
        return 'Required Skills must be selected.'

    # Urgency: must be one of 'High', 'Medium', 'Low'
    if urgency not in ['High', 'Medium', 'Low']:
        return 'Urgency must be one of "High", "Medium", or "Low".'

    # Event Date: required (could add further validation, e.g., proper date format)
    if not event_date:
        return 'Event Date is required.'

    return None  # No errors

# Get all events
@app.route('/api/events', methods=['GET'])
def get_events():
    return jsonify(events_db)

# Add a new event
@app.route('/api/events', methods=['POST'])
def add_event():
    try:
        # Check if the post request has the file part
        if 'eventImage' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400

        file = request.files['eventImage']

        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Check if file extension is allowed
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

            if not os.path.exists(app.config['UPLOAD_FOLDER']):
                os.makedirs(app.config['UPLOAD_FOLDER'])

            file.save(file_path)

            # Convert file path to a URL that can be accessed by the frontend
            file_url = url_for('static', filename=f'uploads/{filename}', _external=True)
        else:
            return jsonify({'error': 'File type not allowed'}), 400

        # Parse other form data
        event_name = request.form.get('eventName')
        event_description = request.form.get('eventDescription')
        location = request.form.get('location')
        urgency = request.form.get('urgency')
        event_date = request.form.get('eventDate')

        # Parse the requiredSkills field (sent as a JSON string)
        required_skills_raw = request.form.get('requiredSkills')
        required_skills = json.loads(required_skills_raw) if required_skills_raw else []

        # Validate form data
        validation_error = validate_event_form(event_name, event_description, location, required_skills, urgency, event_date)
        if validation_error:
            return jsonify({'error': validation_error}), 400

        if not event_name or not event_description or not location or not urgency or not event_date:
            return jsonify({'error': 'Missing required event details'}), 400
        # Check if the event with the same name and date already exists
        for event in events_db:
            if event['eventName'].lower() == event_name.lower() and event['eventDate'] == event_date:
                return jsonify({'error': 'An event with the same name and date already exists.'}), 400

        new_event = {
            'id': len(events_db) + 1,
            'eventName': event_name,
            'eventDescription': event_description,
            'location': location,
            'requiredSkills': required_skills,
            'urgency': urgency,
            'eventDate': event_date,
            'eventImage': file_url  # Store the file URL instead of the file path
        }

        events_db.append(new_event)
        save_events(events_db)
        # Create notifications for all users
        for user in users_db:
           create_notification_for_users(
            'New Event Created',
            f'A new event "{event_name}" has been created.'
        )


        return jsonify({'message': 'Event added successfully', 'event': new_event}), 201

    except Exception as e:
        return jsonify({'error': 'Failed to add event', 'details': str(e)}), 500



# Update an event
@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    try:
        # Check if the request has a file part for the image
        file = request.files.get('eventImage')

        # Get form data for other event fields
        event_name = request.form.get('eventName')
        event_description = request.form.get('eventDescription')
        location = request.form.get('location')
        urgency = request.form.get('urgency')
        event_date = request.form.get('eventDate')

        # Parse the requiredSkills field (sent as a JSON string)
        required_skills_raw = request.form.get('requiredSkills')
        required_skills = json.loads(required_skills_raw) if required_skills_raw else []

         # Validate form data
        validation_error = validate_event_form(event_name, event_description, location, required_skills, urgency, event_date)
        if validation_error:
            return jsonify({'error': validation_error}), 400

        for event in events_db:
            if event['id'] == event_id:
                event['eventName'] = event_name
                event['eventDescription'] = event_description
                event['location'] = location
                event['requiredSkills'] = required_skills
                event['urgency'] = urgency
                event['eventDate'] = event_date

                # Handle image upload
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(file_path)

                    # Convert file path to a URL for frontend
                    file_url = url_for('static', filename=f'uploads/{filename}', _external=True)
                    event['eventImage'] = file_url
                elif not file:
                    if 'eventImage' in event and event['eventImage']:
                        if not event['eventImage'].startswith('http'):
                            filename = os.path.basename(event['eventImage'])
                            event['eventImage'] = url_for('static', filename=f'uploads/{filename}', _external=True)

                save_events(events_db)

                 # After updating, send notification
                # for user in users_db:
                #     create_notification(
                #         user['email'],
                #         'Event Updated',
                #         f'The event "{event_name}" has been updated.'
                #     )
                create_notification_for_users(
                    'Event Updated',
                    f'The event "{event_name}" has been updated.'
                )
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
    
# match volunteers
@app.route('/api/admin/matchVolunteers', methods=['POST'])
def match_volunteer_with_event():
    data = request.json
    email = data.get('email')
    event_id = data.get('event_id')

    if not email or not event_id:
        return jsonify({'error': 'Please select a user and an event'}), 400

    try:
        user = next((user for user in users_db if user.get('email') == email), None)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        event = next((event for event in events_db if event.get('id') == event_id), None)
        if not event:
            return jsonify({'error': 'Event not found'}), 404

        user_match = next((entry for entry in user_event_matching_db if entry['user_email'] == email), None)


        # TODO: make sure to throw error if the event and the user is already matched

        if user_match:
            user_match['events'].append(event)
        else:
            new_entry = {
                'user_email': email,
                'events': [event]
            }
            user_event_matching_db.append(new_entry)

        save_user_event_matchings(user_event_matching_db)

        return jsonify({'message': f'successfully matched event {event["eventName"]} with user {user["full_name"]}'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
