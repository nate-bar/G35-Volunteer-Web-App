from flask import Flask, jsonify, request, url_for, render_template_string
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_mail import Mail, Message
import datetime
import re

import datetime

from config import Config
from threading import Thread
from werkzeug.utils import secure_filename
import os,json
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from flask_pymongo import PyMongo
from bson import ObjectId

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}


app.config.from_object(Config)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

bcrypt = Bcrypt(app)
mail = Mail(app)
mongo = PyMongo(app)


users_collection = mongo.db.users
profiles_collection = mongo.db.user_profiles
notifications_collection = mongo.db.notifications
events_collection = mongo.db.events
event_matching_collection = mongo.db.user_event_matchings
states_collection = mongo.db.states

# Temporary storage for pending registrations
pending_users = {}

TOKEN_EXPIRATION_TIME = 60  # 60 minutes

serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])


def send_async_email(app, msg):
    with app.app_context():
        mail.send(msg)

# Home route
@app.route('/')
def home():
    return "<h1>Welcome to the Volunteer Management API</h1>"

# Get notifications for a user
@app.route('/api/notifications/<string:email>', methods=['GET'])
def get_notifications(email):
    user_notifications = [notif for notif in notifications_db if notif['user_email'] == email]
    return jsonify(user_notifications), 200


# Mark a notification as read
@app.route('/api/notifications/read/<int:notif_id>', methods=['PUT'])
def mark_notification_as_read(notif_id):
    for notif in notifications_db:
        if notif['id'] == notif_id:
            notif['read'] = True
            save_notifications(notifications_db)
            return jsonify({'message': 'Notification marked as read'}), 200
    return jsonify({'error': 'Notification not found'}), 404


# Mark all notifications as read for a user
@app.route('/api/notifications/read-all/<string:email>', methods=['PUT'])
def mark_all_notifications_as_read(email):
    user_notifications = [notif for notif in notifications_db if notif['user_email'] == email]
    for notif in user_notifications:
        notif['read'] = True
    save_notifications(notifications_db)
    return jsonify({'message': 'All notifications marked as read'}), 200


# Delete all notifications for a user
@app.route('/api/notifications/clear/<string:email>', methods=['DELETE'])
def clear_notifications(email):
    global notifications_db
    notifications_db = [notif for notif in notifications_db if notif['user_email'] != email]
    save_notifications(notifications_db)
    return jsonify({'message': 'All notifications cleared'}), 200


# Helper function to create notifications for specific users
def create_notification_for_users(title, message, user_emails=None):
    """Create notifications for specific users or all users with 'user' role if no emails are provided."""
    for user in users_db:
        if user_emails:  # If specific users are provided, notify only them
            if user['email'] in user_emails:
                new_notification = {
                    'id': len(notifications_db) + 1,
                    'user_email': user['email'],
                    'title': title,
                    'message': message,
                    'read': False,
                    'date': datetime.datetime.now().isoformat()
                }
                notifications_db.append(new_notification)
        else:
            if user['role'] == 'user':  # If no specific emails are provided, notify all users with 'user' role
                new_notification = {
                    'id': len(notifications_db) + 1,
                    'user_email': user['email'],
                    'title': title,
                    'message': message,
                    'read': False,
                    'date': datetime.datetime.now().isoformat()
                }
                notifications_db.append(new_notification)
    
    save_notifications(notifications_db)


@app.route('/api/notifications/<int:notif_id>', methods=['DELETE'])
def delete_notification(notif_id):
    global notifications_db
    # Find the notification by its ID
    notification = next((notif for notif in notifications_db if notif['id'] == notif_id), None)

    if notification:
        notifications_db = [notif for notif in notifications_db if notif['id'] != notif_id]
        save_notifications(notifications_db)  # Save the updated list of notifications
        return jsonify({'message': f'Notification {notif_id} deleted successfully.'}), 200
    else:
        return jsonify({'error': f'Notification with ID {notif_id} not found.'}), 404

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
    if any(user['email'] == email for user in users_db):
        return jsonify({'error': 'Email is already registered'}), 400

    # Generate a confirmation token
    token = secrets.token_urlsafe(16)
    expiration_time = datetime.datetime.now() + datetime.timedelta(minutes=TOKEN_EXPIRATION_TIME)
    pending_users[token] = {
        'email': email,
        'password': bcrypt.generate_password_hash(password).decode('utf-8'),
        'role': role,
        'expires_at': expiration_time
    }

    # Send a confirmation email to the user
    confirmation_link = f'http://localhost:4200/confirm-email/{token}'
    
    # Load the email template
    with open('email_templates/email_confirmation_template.html', 'r') as file:
        email_template = file.read()
    
    # Render the template with the confirmation link
    msg = Message('Confirm Your Email', recipients=[email])
    msg.html = render_template_string(email_template, confirmation_link=confirmation_link)

    Thread(target=send_async_email, args=(app, msg)).start()
    return jsonify({'message': 'Registration initiated. Please check your email to confirm.'}), 201

# Email Confirmation Endpoint
@app.route('/api/confirm/<token>', methods=['GET'])
def confirm_email(token):
    if token not in pending_users:
        return jsonify({'error': 'Invalid or expired token.'}), 400
    user_data = pending_users[token]
    if datetime.datetime.now() > user_data['expires_at']:
        del pending_users[token]
        return jsonify({'error': 'Token has expired. Please register again.'}), 400

    confirmed_user_data = {
        'email': user_data['email'],
        'password': user_data['password'],
        'role': user_data['role'],
        'profile_completed': False
    }
    pending_users.pop(token)
    users_db.append(confirmed_user_data)
    save_users(users_db)

    # Send success email
    with open('email_templates/email_success_template.html', 'r') as file:
        success_template = file.read()
    
    # Render the template with the user's email
    msg = Message('Registration Successful', recipients=[user_data['email']])
    msg.html = render_template_string(success_template, email=user_data['email'])

    Thread(target=send_async_email, args=(app, msg)).start()
    return jsonify({'message': 'Email confirmed. Registration successful.'}), 200



# Get Profile Endpoint
@app.route('/api/profile', methods=['GET'])
def get_profile():
    email = request.args.get('email')
    
    if not email:
        return jsonify({'error': 'Email parameter is required'}), 400

    # Check if the email exists in users_db
    user = next((user for user in users_db if user['email'] == email), None)
    
    if not user:
        return jsonify({'error': 'User not found in users database.'}), 404

    #  Retrieve the profile from user_profiles_db
    user_profile = next((profile for profile in user_profiles_db if profile['email'] == email), None)
    
    if not user_profile:
        #  If the profile is missing, return the email and a message indicating profile completion is needed
        return jsonify({
            'email': user['email'],  # Fetch the email from users_db
            'message': 'Profile not found. Please complete your profile.'
        }), 200

    # Return the profile if it exists
    return jsonify(user_profile), 200



# Login Endpoint
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Find user by email in users_db
    user = next((user for user in users_db if user['email'] == email), None)

    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401

    # Check the password
    if not bcrypt.check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid email or password'}), 401

    # Fetch user profile data from user_profiles_db
    user_profile = next((profile for profile in user_profiles_db if profile['email'] == email), None)

    # Check if all required fields are present in the profile
    required_fields = ['full_name', 'address1', 'city', 'state', 'zip_code']
    profile_completed = True

    if user_profile:
        # Check if any required profile field is missing or empty
        for field in required_fields:
            if not user_profile.get(field):
                profile_completed = False
                break
    else:
        # If the profile doesn't exist in user_profiles_db, set profile_completed to False
        profile_completed = False

    # Update the profile_completed status in users_db
    user['profile_completed'] = profile_completed
    save_users(users_db)  # Save the updated users_db

    if not profile_completed:
        # Return a message prompting the user to complete their profile
        return jsonify({
            'message': 'Login successful, but please complete your profile.',
            'role': user['role'],
            'email': user['email'],
            'profile_completed': False
        }), 200

    # If profile is completed, return success message
    return jsonify({
        'message': 'Login successful',
        'role': user['role'],
        'email': user['email'],
        'full_name': user_profile.get('full_name') if user_profile else None,
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
    preferences = data.get('preferences')
    skills = data.get('skills')

    # Find user by email in users_db
    user = next((user for user in users_db if user['email'] == email), None)
    if not user:
        return jsonify({'error': 'User not found.'}), 404
    
    role = user.get('role', 'user')

    # Validate profile fields
    if not full_name or len(full_name) > 50:
        return jsonify({'error': 'Full name is required and should not exceed 50 characters.'}), 400
    if not address1 or len(address1) > 100:
        return jsonify({'error': 'Address line 1 is required and should not exceed 100 characters.'}), 400
    if address2 and len(address2) > 100:
        return jsonify({'error': 'Address line 2 should not exceed 100 characters.'}), 400
    if not city or len(city) > 100:
        return jsonify({'error': 'City is required and should not exceed 100 characters.'}), 400
    if not state:
        return jsonify({'error': 'State is required.'}), 400
    if not zip_code or not (5 <= len(zip_code) <= 9):
        return jsonify({'error': 'Zip code is required and should be between 5 and 9 characters.'}), 400
    if not availability or not isinstance(availability, list) or len(availability) == 0:
        return jsonify({'error': 'At least one availability option is required.'}), 400
    if not skills or not isinstance(skills, list) or len(skills) == 0:
        return jsonify({'error': 'At least one skill must be selected.'}), 400

    # Update user_profiles_db for storing profile-related data
    profile_data = {
        'email': email,
        'full_name': full_name,
        'address1': address1,
        'address2': address2,
        'city': city,
        'state': state,
        'zip_code': zip_code,
        'role': role,
        'preferences': preferences,
        'availability': availability,
        'skills': skills
    }

    # Check if the user already has a profile
    existing_profile = next((profile for profile in user_profiles_db if profile['email'] == email), None)
    if existing_profile:
        # Update the existing profile
        existing_profile.update(profile_data)
    else:
        # Add new profile
        user_profiles_db.append(profile_data)

    save_profile(user_profiles_db)
     # Update the 'profile_completed' status in users_db
    user['profile_completed'] = True  # Set profile as completed

    # Save the updated user information to users_db
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

# Return user_event_matching but with full_name instead of user_email
@app.route('/api/admin/eventUserMatchingsWithName', methods=['GET'])
def get_user_event_matching_with_name():
    results = []

    for person in user_event_matching_db:
        temp = person.copy()
        for user in user_profiles_db:
            if temp['user_email'] == user['email']:
                temp['user_email'] = user.get('full_name')
        results.append(temp)

    return jsonify(results)

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


# Add a new event
@app.route('/api/events', methods=['POST'])
def add_event():
    try:
        # Check if the post request has the file part (optional)
        file_url = None
        if 'eventImage' in request.files:
            file = request.files['eventImage']

            if file.filename != '':
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
            'eventImage': file_url  # Store the file URL, or None if no image is uploaded
        }

        events_db.append(new_event)
        save_events(events_db)

        # Create notifications for all users
        # create_notification_for_users(
        #     'New Event Created',
        #     f'A new event "{event_name}" has been created.'
        # )

        return jsonify({'message': 'Event added successfully', 'event': new_event}), 201

    except Exception as e:
        return jsonify({'error': 'Failed to add event', 'details': str(e)}), 500

@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    try:
        # Find the existing event by event_id
        event = next((e for e in events_db if e['id'] == event_id), None)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
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

        # Update the event fields
        event['eventName'] = event_name
        event['eventDescription'] = event_description
        event['location'] = location
        event['requiredSkills'] = required_skills
        event['urgency'] = urgency
        event['eventDate'] = event_date

        # Handle image upload if a new image is provided
        if file and file.filename != '' and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

            # Save the uploaded file
            file.save(file_path)

            # Convert file path to a URL for frontend
            file_url = url_for('static', filename=f'uploads/{filename}', _external=True)
            event['eventImage'] = file_url
        elif 'eventImage' not in event or not event['eventImage']:
            
            event['eventImage'] = None  

        # Save the updated events database
        save_events(events_db)

        # Notify users of the update
        # create_notification_for_users(
        #     'Event Updated',
        #     f'The event "{event_name}" has been updated.'
        # )

        # Notify only users who are matched to the event
        matched_users = [match['user_email'] for match in user_event_matching_db 
                         if any(evt['event']['id'] == event_id for evt in match['events'])]
        
        if matched_users:
            create_notification_for_users(
                'Event Updated',
                f'The event "{event_name}" has been updated.',
                matched_users
            )

        return jsonify({'message': 'Event updated successfully', 'event': event}), 200

    except Exception as e:
        return jsonify({'error': 'Failed to update event', 'details': str(e)}), 500

# Delete an event
@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    try:
        for event in events_db:
            if event['id'] == event_id:
                # If the event has an associated image, delete the image file
                if 'eventImage' in event and event['eventImage']:
                    # Extract the image file path from the event's image URL
                    image_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(event['eventImage']))
                    
                    # Check if the image file exists and delete it
                    if os.path.exists(image_path):
                        os.remove(image_path)
                
                # Remove the event from the database
                events_db.remove(event)
                save_events(events_db)
                
                return jsonify({'message': 'Event deleted successfully'}), 200
        
        return jsonify({'error': 'Event not found'}), 404
    
    except Exception as e:
        return jsonify({'error': 'Failed to delete event', 'details': str(e)}), 500

# get users with complete profile
@app.route('/api/users/getUsersWithCompleteProfile', methods=['GET'])
def get_users_with_complete_profile():
    completed_profiles = [user for user in users_db if user.get('profile_completed') == True]
    return jsonify(completed_profiles), 200


@app.route('/api/events/matchVolunteers', methods=['POST'])
def match_volunteer_with_event():
    data = request.json
    email = data.get('email')
    event_id = data.get('event_id')
    if not email or not event_id:
        return jsonify({'error': 'Please select a user and an event'}), 400
    try:
        # Find the user profile in MongoDB
        user = profiles_collection.find_one({'email': email})
        if not user:
            print("User not found")
            return jsonify({'error': 'User not found'}), 404
        # If event_id is an ObjectId string, use it to find the event by _id
        if ObjectId.is_valid(event_id):
            event = events_collection.find_one({'_id': ObjectId(event_id)})
        else:
            # If event_id is a number or a non-ObjectId string, query by 'id' field
            event = events_collection.find_one({'id': int(event_id)})
        if not event:
            print("Event not found")
            return jsonify({'error': 'Event not found'}), 404

        # Check if the user is already matched with the event
        user_match = event_matching_collection.find_one({'user_email': email})
        if user_match and any(evt['event']['id'] == int(event_id) for evt in user_match['events']):
            return jsonify({'error': f'User {user["full_name"]} is already matched with event {event["eventName"]}'}), 400

        # Prepare the event data to be added
        event_data = {
            'event': event,
        }


        # If the user is already matched with some events, update the document
        if user_match:
            event_matching_collection.update_one(
                {'user_email': email},
                {'$push': {'events': event_data}}
            )
        else:
            # If the user is not matched with any event, create a new entry
            new_entry = {
                'user_email': email,
                'events': [event_data]
            }
            event_matching_collection.insert_one(new_entry)

        # Create a new notification for the user
        new_notification = {
            'user_email': email,
            'title': 'Volunteer Assignment',
            'message': f'You have been assigned to the event {event["eventName"]}.',
            'read': False,
            'date': datetime.datetime.now().isoformat()
        }
        notifications_collection.insert_one(new_notification)
        return jsonify({'message': f'Successfully matched event {event["eventName"]} with user {user["full_name"]}'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/sendReminder', methods=['POST'])
def send_reminder():
    data = request.json
    event_id = data.get('event_id')
    
    # Convert event_id to integer
    try:
        event_id = int(event_id)
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid event ID format'}), 400

    print(event_id)

    if not event_id:
        return jsonify({'error': 'Event ID is required'}), 400

    try:
        # Fetch the event by ID to get the event name
        event = next((evt for evt in events_db if evt['id'] == event_id), None)
        if not event:
            return jsonify({'error': 'Event not found.'}), 404

        event_name = event.get('eventName', 'Unknown Event')

        # Send reminder only to users assigned to the event
        matched_users = [match['user_email'] for match in user_event_matching_db 
                         if any(evt['event']['id'] == event_id for evt in match['events'])]

        if not matched_users:
            return jsonify({'error': 'No users assigned to this event.'}), 404
        
        # Create notifications for the matched users
        for user_email in matched_users:
            new_notification = {
                'id': len(notifications_db) + 1,
                'user_email': user_email,
                'title': 'Event Reminder',
                'message': f'Reminder: You are assigned to the event "{event_name}".',
                'read': False,
                'date': datetime.datetime.now().isoformat()
            }
            notifications_db.append(new_notification)

        save_notifications(notifications_db)

        return jsonify({'message': 'Reminders sent successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get all volunteers with 'user' role
@app.route('/api/volunteers', methods=['GET'])
def get_volunteers():
    volunteers = list(profiles_collection.find({'role': 'user'}, {'_id': 0}))
    return jsonify(volunteers), 200

#matched users to events
@app.route('/api/events/matched', methods=['POST'])
def get_matched_events():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    # Get the user profile
    user_profile = profiles_collection.find_one({'email': email}, {'_id': 0})
    if not user_profile:
        return jsonify({'error': 'User not found'}), 404

    user_city = user_profile.get('city')
    user_skills = user_profile.get('skills', [])

    # Filter events by location and skills
    matched_events = list(events_collection.find({
        'location': user_city,
        'requiredSkills': {'$in': user_skills}
    }, {'_id': 0}))

    if not matched_events:
        return jsonify({'message': 'No matching events found', 'events': []}), 200  # Return empty list if no matches

    return jsonify({'events': matched_events}), 200

# Get all events
@app.route('/api/events', methods=['GET'])
def get_events():
    return jsonify(events_db)



if __name__ == '__main__':
    app.run(debug=True)
