from flask import Flask, jsonify, request, url_for, render_template_string,send_file,make_response
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
from io import BytesIO,StringIO
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from flask_pymongo import PyMongo
from bson import ObjectId
from fpdf import FPDF
import pandas as pd
from tempfile import NamedTemporaryFile

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
    user_notifications = list(notifications_collection.find({'user_email': email}, {'_id': 0}))
    return jsonify(user_notifications), 200



# Mark a notification as read
@app.route('/api/notifications/read/<int:notif_id>', methods=['PUT'])
def mark_notification_as_read(notif_id):
    notifications_collection.update_one({'id': notif_id}, {'$set': {'read': True}})
    return jsonify({'message': 'Notification marked as read'}), 200



# Mark all notifications as read for a user
@app.route('/api/notifications/read-all/<string:email>', methods=['PUT'])
def mark_all_notifications_as_read(email):
    notifications_collection.update_many({'user_email': email}, {'$set': {'read': True}})
    return jsonify({'message': 'All notifications marked as read'}), 200


# Delete all notifications for a user
@app.route('/api/notifications/clear/<string:email>', methods=['DELETE'])
def clear_notifications(email):
    notifications_collection.delete_many({'user_email': email})
    return jsonify({'message': 'All notifications cleared'}), 200


# Helper function to create notifications for specific users
def create_notification_for_users(title, message, user_emails=None):
    if user_emails:
        users = users_collection.find({'email': {'$in': user_emails}})
    else:
        users = users_collection.find({'role': 'user'})

    for user in users:
        new_notification = {
            'user_email': user['email'],
            'title': title,
            'message': message,
            'read': False,
            'date': datetime.datetime.now().isoformat()
        }
        notifications_collection.insert_one(new_notification)


@app.route('/api/notifications/<int:notif_id>', methods=['DELETE'])
def delete_notification(notif_id):
    result = notifications_collection.delete_one({'id': notif_id})
    if result.deleted_count > 0:
        return jsonify({'message': f'Notification {notif_id} deleted successfully.'}), 200
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

    # Check if the email already exists in the database
    existing_user = users_collection.find_one({'email': email})
    if existing_user:
        return jsonify({'error': 'Email is already registered'}), 400

    # Generate a confirmation token
    token = serializer.dumps(email, salt=app.config['SECURITY_PASSWORD_SALT'])
    expiration_time = datetime.datetime.now() + datetime.timedelta(minutes=TOKEN_EXPIRATION_TIME)
    pending_users[token] = {
        'email': email,
        'password': bcrypt.generate_password_hash(password).decode('utf-8'),
        'role': role,
        'expires_at': expiration_time
    }

    # Send confirmation email
    confirmation_link = f'http://localhost:4200/confirm-email/{token}'
    with open('email_templates/email_confirmation_template.html', 'r') as file:
        email_template = file.read()

    msg = Message('Confirm Your Email', recipients=[email])
    msg.html = render_template_string(email_template, confirmation_link=confirmation_link)

    Thread(target=send_async_email, args=(app, msg)).start()
    return jsonify({'message': 'Registration initiated. Please check your email to confirm.'}), 201


# Email Confirmation Endpoint
@app.route('/api/confirm/<token>', methods=['GET'])
def confirm_email(token):
    try:
        email = serializer.loads(token, salt=app.config['SECURITY_PASSWORD_SALT'], max_age=TOKEN_EXPIRATION_TIME * 60)
    except SignatureExpired:
        return jsonify({'error': 'Token has expired. Please register again.'}), 400
    except BadSignature:
        return jsonify({'error': 'Invalid or expired token.'}), 400

    # Check if the user is in pending_users
    if token not in pending_users:
        return jsonify({'error': 'Invalid or expired token.'}), 400

    user_data = pending_users.pop(token)

    # Insert the confirmed user into the MongoDB users collection
    users_collection.insert_one({
        'email': user_data['email'],
        'password': user_data['password'],
        'role': user_data['role'],
        'profile_completed': False
    })

    # Send success email
    with open('email_templates/email_success_template.html', 'r') as file:
        success_template = file.read()

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

    # Fetch user profile from MongoDB
    user_profile = profiles_collection.find_one({'email': email}, {'_id': 0})  # Exclude the _id field

    if not user_profile:
        return jsonify({
            'email': email,
            'message': 'Profile not found. Please complete your profile.'
        }), 200

    return jsonify(user_profile), 200




# Login Endpoint
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({'email': email})

    if not user or not bcrypt.check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid email or password'}), 401

    user_profile = profiles_collection.find_one({'email': email})

    profile_completed = user_profile is not None

    if not profile_completed:
        return jsonify({
            'message': 'Login successful, but please complete your profile.',
            'role': user['role'],
            'email': user['email'],
            'profile_completed': False
        }), 200

    return jsonify({
        'message': 'Login successful',
        'role': user['role'],
        'email': user['email'],
        'full_name': user_profile.get('full_name') if user_profile else None,
        'profile_completed': True
    }), 200



# Complete Profile Endpoint with MongoDB
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

    # Find user by email in MongoDB users collection
    user = users_collection.find_one({'email': email})
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

    # Prepare the profile data to be stored in MongoDB
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

    # Upsert the profile in MongoDB (update if exists, insert if not)
    profiles_collection.replace_one({'email': email}, profile_data, upsert=True)

    # Update the 'profile_completed' status in the MongoDB users collection
    users_collection.update_one({'email': email}, {'$set': {'profile_completed': True}})

    return jsonify({'message': 'Profile completed successfully.'}), 201

# Get all useras
@app.route('/api/users', methods=['GET'])
def get_users():
    users = list(users_collection.find({}, {'_id': 0}))  # Exclude the '_id' field
    return jsonify(users), 200

# Helper function to convert ObjectId to string
def convert_objectid_to_str(data):
    if isinstance(data, dict):
        return {key: convert_objectid_to_str(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_objectid_to_str(item) for item in data]
    elif isinstance(data, ObjectId):
        return str(data)
    else:
        return data

@app.route('/api/admin/eventUserMatchings', methods=['GET'])
def get_user_event_matchings():
    matchings = []
    user_event_matchings = event_matching_collection.find()

    for matching in user_event_matchings:
        user_profile = profiles_collection.find_one({'email': matching.get('user_email')}, {'_id': 0})
        if user_profile:
            matching['full_name'] = user_profile.get('full_name', 'Unknown User')
        matchings.append(matching)

    # Convert any ObjectId in the matchings to strings
    matchings = convert_objectid_to_str(matchings)

    return jsonify(matchings), 200

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

                    # Create the upload folder if it doesn't exist
                    if not os.path.exists(app.config['UPLOAD_FOLDER']):
                        os.makedirs(app.config['UPLOAD_FOLDER'])

                    file.save(file_path)

                    # Convert file path to a URL that can be accessed by the frontend
                    file_url = url_for('static', filename=f'uploads/{filename}', _external=True)
                else:
                    return jsonify({'error': 'File type not allowed'}), 400

        # Parse form data
        event_name = request.form.get('eventName')
        event_description = request.form.get('eventDescription')
        location = request.form.get('location')
        urgency = request.form.get('urgency')
        event_date = request.form.get('eventDate')

        # Parse requiredSkills field (sent as a JSON string)
        required_skills_raw = request.form.get('requiredSkills')
        required_skills = json.loads(required_skills_raw) if required_skills_raw else []

        # Validate form data
        validation_error = validate_event_form(event_name, event_description, location, required_skills, urgency, event_date)
        if validation_error:
            return jsonify({'error': validation_error}), 400

        if not event_name or not event_description or not location or not urgency or not event_date:
            return jsonify({'error': 'Missing required event details'}), 400

        # Check if an event with the same name and date already exists
        existing_event = events_collection.find_one({'eventName': event_name, 'eventDate': event_date})
        if existing_event:
            return jsonify({'error': 'An event with the same name and date already exists.'}), 400

        # Get the highest existing id in the MongoDB collection and increment it by 1
        max_event = events_collection.find_one(sort=[("id", -1)])  # Get the highest 'id' field
        new_id = max_event['id'] + 1 if max_event else 1  # Start from 1 if no events exist

        # Prepare the new event document with the manually assigned 'id'
        new_event = {
            'id': new_id,  # Manually assigned id
            'eventName': event_name,
            'eventDescription': event_description,
            'location': location,
            'requiredSkills': required_skills,
            'urgency': urgency,
            'eventDate': event_date,
            'eventImage': file_url  # Store the file URL, or None if no image is uploaded
        }

        # Insert the new event into MongoDB
        result = events_collection.insert_one(new_event)

        # Convert the ObjectId to a string for returning in the response
        new_event['_id'] = str(result.inserted_id)

        # Return success message along with the inserted event
        return jsonify({'message': 'Event added successfully', 'event': new_event}), 201

    except Exception as e:
        return jsonify({'error': 'Failed to add event', 'details': str(e)}), 500


@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    try:
        event = events_collection.find_one({'id': event_id})
        if not event:
            return jsonify({'error': 'Event not found'}), 404

        file = request.files.get('eventImage')
        event_name = request.form.get('eventName')
        event_description = request.form.get('eventDescription')
        location = request.form.get('location')
        urgency = request.form.get('urgency')
        event_date = request.form.get('eventDate')
        required_skills = json.loads(request.form.get('requiredSkills', '[]'))

        validation_error = validate_event_form(event_name, event_description, location, required_skills, urgency, event_date)
        if validation_error:
            return jsonify({'error': validation_error}), 400

        # Update event fields
        update_data = {
            'eventName': event_name,
            'eventDescription': event_description,
            'location': location,
            'requiredSkills': required_skills,
            'urgency': urgency,
            'eventDate': event_date
        }

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            file_url = url_for('static', filename=f'uploads/{filename}', _external=True)
            update_data['eventImage'] = file_url

        events_collection.update_one({'id': event_id}, {'$set': update_data})

        # Notify matched users
        matched_users = event_matching_collection.find({'events.event.id': event_id})
        if matched_users:
            matched_user_emails = [match['user_email'] for match in matched_users]
            create_notification_for_users('Event Updated', f'The event "{event_name}" has been updated.', matched_user_emails)

        return jsonify({'message': 'Event updated successfully', 'event': update_data}), 200

    except Exception as e:
        return jsonify({'error': 'Failed to update event', 'details': str(e)}), 500

# Delete an event
@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    try:
        event = events_collection.find_one({'id': event_id})
        if not event:
            return jsonify({'error': 'Event not found'}), 404

        if event.get('eventImage'):
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(event['eventImage']))
            if os.path.exists(image_path):
                os.remove(image_path)

        events_collection.delete_one({'id': event_id})
        return jsonify({'message': 'Event deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': 'Failed to delete event', 'details': str(e)}), 500

# Get all events
@app.route('/api/events', methods=['GET'])
def get_events():
    events = list(events_collection.find({}, {'_id': 0}))
    return jsonify(events), 200

# get users with complete profile
@app.route('/api/users/getUsersWithCompleteProfile', methods=['GET'])
def get_users_with_complete_profile():
    users_with_complete_profile = list(profiles_collection.find({}, {'_id': 0}))
    return jsonify(users_with_complete_profile), 200


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

@app.route('/api/admin/sendReminder', methods=['POST'])
def send_reminder():
    data = request.json
    event_id = data.get('event_id')
    user_email = data.get('user_email')
    
    try:
        event_id = int(event_id)
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid event ID format'}), 400

    if not event_id or not user_email:
        return jsonify({'error': 'Event ID and User Email are required'}), 400

    try:
        event = events_collection.find_one({'id': event_id})
        if not event:
            return jsonify({'error': 'Event not found.'}), 404

        event_name = event.get('eventName', 'Unknown Event')
        match = event_matching_collection.find_one({
            'user_email': user_email,
            'events.event.id': event_id
        })
        if not match:
            return jsonify({'error': f'{user_email} is not assigned to this event.'}), 404

        new_notification = {
            'user_email': user_email,
            'title': 'Event Reminder',
            'message': f'Reminder: You are assigned to the event "{event_name}".',
            'read': False,
            'date': datetime.datetime.now().isoformat()
        }
        notifications_collection.insert_one(new_notification)

        # Success response for the frontend to confirm successful reminder
        return jsonify({'message': f'Reminder sent successfully to {user_email}'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500




# Get all volunteers with 'user' role
@app.route('/api/volunteers', methods=['GET'])
def get_volunteers():
    volunteers = list(profiles_collection.find({'role': 'user'}, {'_id': 0}))
    return jsonify(volunteers), 200


@app.route('/api/states', methods=['GET'])
def get_states():
    states = list(states_collection.find({}, {'_id': 0})) 
    return jsonify(states), 200

@app.route('/api/report/volunteer-history/csv', methods=['GET'])
def generate_volunteer_history_csv():
    volunteer_history = list(event_matching_collection.find()) 
    csv_rows = []

    for history in volunteer_history:
        user_email = history.get('user_email')
        events = history.get('events', [])
        csv_rows.append({'Field': 'Volunteer Email', 'Value': user_email})
        csv_rows.append({})
        for event_number, event_data in enumerate(events, start=1):
            event = event_data.get("event", {})
            csv_rows.append({'Field': f'Event #{event_number}', 'Value': ''})
            csv_rows.append({'Field': '-----------------', 'Value': '-----------------'})
            csv_rows.append({'Field': 'Event Name:', 'Value': event.get("eventName", "")})
            csv_rows.append({'Field': 'Description:', 'Value': event.get("eventDescription", "")})
            csv_rows.append({'Field': 'Location:', 'Value': event.get("location", "")})
            csv_rows.append({'Field': 'Skills:', 'Value': ", ".join(event.get("requiredSkills", []))})
            csv_rows.append({'Field': 'Urgency:', 'Value': event.get("urgency", "")})
            csv_rows.append({'Field': 'Date:', 'Value': event.get("eventDate", "").split("T")[0]})
            csv_rows.append({})

        csv_rows.append({'Field': '====================', 'Value': '===================='})
        csv_rows.append({}) 

    df = pd.DataFrame(csv_rows)
    csv_buffer = StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)
    return send_file(BytesIO(csv_buffer.getvalue().encode()), as_attachment=True, download_name="volunteer_history.csv", mimetype='text/csv')

@app.route('/api/report/volunteer-history/pdf', methods=['GET'])
def generate_volunteer_history_pdf():
    volunteer_history = list(event_matching_collection.find())

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(0, 10, txt="Volunteer Participation History Report", ln=True, align="C")
    pdf.ln(10)
    for history in volunteer_history:
        pdf.set_font("Arial", "B", size=12)
        pdf.cell(0, 10, txt=f"Volunteer Email: {history.get('user_email')}", ln=True)
        pdf.set_font("Arial", size=11)
        pdf.ln(5)
        pdf.set_fill_color(180, 200, 230)  
        pdf.cell(50, 10, "Label", border=1, fill=True)
        pdf.cell(140, 10, "Details", border=1, fill=True)
        pdf.ln(10)
        for index, event_data in enumerate(history.get("events", [])):
            event = event_data.get("event", {})
            row_fill = (245, 245, 245) if index % 2 == 0 else (255, 255, 255)
            pdf.set_fill_color(*row_fill)
            pdf.cell(50, 10, "Event Name:", border=1, fill=True)
            pdf.cell(140, 10, txt=event.get("eventName", ""), border=1, fill=True, ln=True)
            pdf.cell(50, 10, "Description:", border=1, fill=True)
            pdf.cell(140, 10, txt=event.get("eventDescription", ""), border=1, fill=True, ln=True)
            pdf.cell(50, 10, "Location:", border=1, fill=True)
            pdf.cell(140, 10, txt=event.get("location", ""), border=1, fill=True, ln=True)
            pdf.cell(50, 10, "Skills:", border=1, fill=True)
            pdf.cell(140, 10, txt=", ".join(event.get("requiredSkills", [])), border=1, fill=True, ln=True)
            pdf.cell(50, 10, "Urgency:", border=1, fill=True)
            pdf.cell(140, 10, txt=event.get("urgency", ""), border=1, fill=True, ln=True)
            pdf.cell(50, 10, "Date:", border=1, fill=True)
            pdf.cell(140, 10, txt=event.get("eventDate", "").split("T")[0], border=1, fill=True, ln=True)
            pdf.ln(5)

        pdf.set_draw_color(0, 0, 0) 
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())  
        pdf.ln(10)

    with NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf_file:
        temp_pdf_file_path = temp_pdf_file.name
        pdf.output(temp_pdf_file_path)
    return send_file(temp_pdf_file_path, as_attachment=True, download_name="volunteer_history.pdf", mimetype='application/pdf')

@app.route('/api/report/event-details/csv', methods=['GET'])
def generate_event_details_with_volunteers_csv():
    events = list(events_collection.find({}, {'_id': 0}))
    event_users_map = {}

    # Map users assigned to each event
    matchings = list(event_matching_collection.find())
    for match in matchings:
        for event_data in match.get('events', []):
            event_id = event_data.get('event', {}).get('id')
            if event_id:
                user_email = match.get('user_email')
                if event_id not in event_users_map:
                    event_users_map[event_id] = []
                event_users_map[event_id].append(user_email)

    csv_rows = []
    for event in events:
        event_id = event.get('id')
        assigned_users = event_users_map.get(event_id, [])
        csv_rows.append({
            'Event Name': event.get('eventName', ''),
            'Description': event.get('eventDescription', ''),
            'Location': event.get('location', ''),
            'Urgency': event.get('urgency', ''),
            'Date': event.get('eventDate', ''),
            'Assigned Users': ', '.join(assigned_users) if assigned_users else 'None'
        })

    df = pd.DataFrame(csv_rows)
    csv_buffer = StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)

    return send_file(
        BytesIO(csv_buffer.getvalue().encode()),
        as_attachment=True,
        download_name="event_details_with_volunteers.csv",
        mimetype='text/csv'
    )

@app.route('/api/report/event-details/pdf', methods=['GET'])
def generate_event_details_with_volunteers_pdf():
    events = list(events_collection.find({}, {'_id': 0}))
    event_users_map = {}

    # Map users assigned to each event
    matchings = list(event_matching_collection.find())
    for match in matchings:
        for event_data in match.get('events', []):
            event_id = event_data.get('event', {}).get('id')
            if event_id:
                user_email = match.get('user_email')
                if event_id not in event_users_map:
                    event_users_map[event_id] = []
                event_users_map[event_id].append(user_email)

    pdf = FPDF()
    pdf.add_page()
    
    # Title Section
    pdf.set_font("Arial", style="B", size=16)
    pdf.cell(0, 10, txt="Event Details with Volunteer Assignments", ln=True, align="C")
    pdf.ln(10)

    for event in events:
        event_id = event.get('id')
        assigned_users = event_users_map.get(event_id, [])

        # Add event details
        pdf.set_fill_color(200, 220, 255)  # Light blue background for labels
        pdf.set_font("Arial", style="B", size=12)
        pdf.cell(60, 10, txt="Field", border=1, fill=True, align="C")
        pdf.cell(130, 10, txt="Details", border=1, fill=True, align="C")
        pdf.ln(10)

        # Add data rows
        pdf.set_font("Arial", size=11)
        pdf.set_fill_color(245, 245, 245)  # Alternate row color: light gray
        rows = [
            ("Event Name", event.get('eventName', '')),
            ("Description", event.get('eventDescription', '')),
            ("Location", event.get('location', '')),
            ("Urgency", event.get('urgency', '')),
            ("Date", event.get('eventDate', '')),
            ("Assigned Users", ", ".join(assigned_users) if assigned_users else "None"),
        ]
        for i, (label, value) in enumerate(rows):
            fill = i % 2 == 0  # Alternate row color
            pdf.cell(60, 10, txt=label, border=1, fill=fill, align="L")
            pdf.cell(130, 10, txt=value, border=1, fill=fill, align="L")
            pdf.ln(10)

        pdf.ln(5)  # Space between events

    # Save and send the PDF
    with NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf_file:
        temp_pdf_file_path = temp_pdf_file.name
        pdf.output(temp_pdf_file_path)

    return send_file(
        temp_pdf_file_path,
        as_attachment=True,
        download_name="event_details_with_volunteers.pdf",
        mimetype='application/pdf'
    )



if __name__ == '__main__':
    app.run(debug=True)
