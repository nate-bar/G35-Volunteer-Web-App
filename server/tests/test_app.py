from io import BytesIO
import bcrypt
import pytest
from unittest.mock import patch
import mongomock
from main import bcrypt, app, send_async_email, allowed_file, validate_event_form,convert_objectid_to_str,create_notification_for_users
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
import datetime
import json
from bson import ObjectId
import os


app.config['SECURITY_PASSWORD_SALT'] = 'mysecret'

@pytest.fixture(scope="function")
def mock_mongo_collections(mocker):
    mock_client = mongomock.MongoClient()  # Mock MongoDB client
    mock_db = mock_client.db  # Access the mock database

    # Patch collections in the mock MongoDB client
    mocker.patch('main.users_collection', mock_db.users)
    mocker.patch('main.profiles_collection', mock_db.user_profiles)
    mocker.patch('main.notifications_collection', mock_db.notifications)
    mocker.patch('main.events_collection', mock_db.events)
    mocker.patch('main.event_matching_collection', mock_db.user_event_matchings)
    mocker.patch('main.states_collection', mock_db.states)

    # Patch the app's mongo config
    app.config['mongo'] = mock_client
    yield mock_client


@pytest.fixture(scope="function")
def client(mock_mongo_collections):
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

# Test home route
def test_home(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b"Welcome to the Volunteer Management API" in response.data


# Helper tests
def test_allowed_file():
    assert allowed_file('image.jpg') is True
    assert allowed_file('document.pdf') is False

def test_validate_event_form():
    # Test missing event name
    error = validate_event_form('', 'desc', 'location', ['Skill1'], 'High', '2024-10-01')
    assert error == 'Event Name is required and must be at most 100 characters.'

    # Test event name exceeding 100 characters
    long_event_name = 'A' * 101
    error = validate_event_form(long_event_name, 'desc', 'location', ['Skill1'], 'High', '2024-10-01')
    assert error == 'Event Name is required and must be at most 100 characters.'

    # Test missing event description
    error = validate_event_form('Event', '', 'location', ['Skill1'], 'High', '2024-10-01')
    assert error == 'Event Description is required.'

    # Test missing location
    error = validate_event_form('Event', 'desc', '', ['Skill1'], 'High', '2024-10-01')
    assert error == 'Location is required.'

    # Test required skills is an empty list
    error = validate_event_form('Event', 'desc', 'location', [], 'High', '2024-10-01')
    assert error == 'Required Skills must be selected.'

    # Test required skills is not a list
    error = validate_event_form('Event', 'desc', 'location', 'Skill1', 'High', '2024-10-01')
    assert error == 'Required Skills must be selected.'

    # Test invalid urgency value
    error = validate_event_form('Event', 'desc', 'location', ['Skill1'], 'Invalid', '2024-10-01')
    assert error == 'Urgency must be one of "High", "Medium", or "Low".'

    # Test missing event date
    error = validate_event_form('Event', 'desc', 'location', ['Skill1'], 'High', '')
    assert error == 'Event Date is required.'

    # Test a valid form input
    error = validate_event_form('Event', 'desc', 'location', ['Skill1'], 'High', '2024-10-01')
    assert error is None

def add_user_directly(email, password, role="user"):
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    users_collection = app.config['mongo'].db.users
    users_collection.insert_one({
        'email': email,
        'password': hashed_password,
        'role': role,
        'profile_completed': False
    })

def test_register(client):
    # Helper function to simulate a user bypassing email verification
    def bypass_email_verification(email, password, role):
        add_user_directly(email, password, role)

    # Test successful registration
    response = client.post('/api/register', json={
        'email': 'testuser@example.com',
        'password': 'password123',
        'role': 'user'
    })
    assert response.status_code == 201
    assert response.json['message'] == 'Registration initiated. Please check your email to confirm.'

    # Bypass email verification for the registered user
    bypass_email_verification('testuser@example.com', 'password123', 'user')

    # Test registration with a password that's too short
    response = client.post('/api/register', json={
        'email': 'testuser2@example.com',
        'password': 'short',
        'role': 'user'
    })
    assert response.status_code == 400
    assert response.json['error'] == 'Password must be at least 8 characters long'

    # Test registration with an invalid role
    response = client.post('/api/register', json={
        'email': 'testuser3@example.com',
        'password': 'password123',
        'role': 'invalid_role'
    })
    assert response.status_code == 400
    assert response.json['error'] == 'Role must be either "admin" or "user"'

    # Test registration with missing email
    response = client.post('/api/register', json={
        'password': 'password123',
        'role': 'user'
    })
    assert response.status_code == 400
    assert response.json['error'] == 'Invalid email address'

    # Test registration with missing password
    response = client.post('/api/register', json={
        'email': 'testuser4@example.com',
        'role': 'user'
    })
    assert response.status_code == 400
    assert response.json['error'] == 'Password must be at least 8 characters long'

    # Test registration with missing role
    response = client.post('/api/register', json={
        'email': 'testuser5@example.com',
        'password': 'password123'
    })
    assert response.status_code == 400
    assert response.json['error'] == 'Role must be either "admin" or "user"'

    # Test registration with already registered email
    response = client.post('/api/register', json={
        'email': 'testuser@example.com',
        'password': 'password123',
        'role': 'user'
    })
    assert response.status_code == 400
    assert response.json['error'] == 'Email is already registered'

# Helper function to add a user directly to the database without confirmation
def add_user_directly(email, password, role="user"):
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    users_collection = app.config['mongo'].db.users
    users_collection.insert_one({
        'email': email,
        'password': hashed_password,
        'role': role,
        'profile_completed': False
    })

def test_login(client):
    # Add user directly without requiring confirmation
    add_user_directly('testuser@example.com', 'password123')
    
    # Test login with incomplete profile
    response = client.post('/api/login', json={
        'email': 'testuser@example.com',
        'password': 'password123'
    })
    assert response.status_code == 200
    assert response.json['message'] == 'Login successful, but please complete your profile.'
    assert response.json['profile_completed'] is False

    # Complete the profile to set profile_completed=True
    client.post('/api/profile', json={
        'email': 'testuser@example.com',
        'fullName': 'Test User',
        'address1': '123 Test St',
        'city': 'Test City',
        'state': 'TS',
        'zipCode': '12345',
        'availability': ['2024-10-01'],
        'preferences': 'None',
        'skills': ['Skill1']
    })
    
    # Test login after profile completion
    response = client.post('/api/login', json={
        'email': 'testuser@example.com',
        'password': 'password123'
    })
    assert response.status_code == 200
    assert response.json['message'] == 'Login successful'
    assert response.json['profile_completed'] is True

    # Test invalid login with incorrect password
    response = client.post('/api/login', json={
        'email': 'testuser@example.com',
        'password': 'wrongpassword'
    })
    assert response.status_code == 401
    assert response.json['error'] == 'Invalid email or password'

    # Test invalid login with non-existent email
    response = client.post('/api/login', json={
        'email': 'nonexistent@example.com',
        'password': 'password123'
    })
    assert response.status_code == 401
    assert response.json['error'] == 'Invalid email or password'


# Complete Profile Endpoint
def test_complete_profile(client):
    # Add the user directly to the database to skip registration confirmation
    add_user_directly('testuser@example.com', 'password123', 'user')

    # Valid profile completion request
    response = client.post('/api/profile', json={
        'email': 'testuser@example.com',
        'fullName': 'Test User',
        'address1': '123 Test St',
        'address2': '',
        'city': 'Test City',
        'state': 'TS',
        'zipCode': '12345',
        'availability': ['2024-10-01'],
        'preferences': 'None',
        'skills': ['Skill1', 'Skill2']
    })
    assert response.status_code == 201
    assert response.json['message'] == 'Profile completed successfully.'
    # Test attempting to complete a profile for a non-existent user
    response = client.post('/api/profile', json={
        'email': 'nonexistent@example.com',
        'fullName': 'Nonexistent User',
        'address1': '404 Not Found St',
        'city': 'Nowhere',
        'state': 'NA',
        'zipCode': '00000',
        'availability': ['2024-10-01'],
        'preferences': 'None',
        'skills': ['Skill1']
    })
    assert response.status_code == 404
    assert response.json['error'] == 'User not found.'

    # Test missing full name
    response = client.post('/api/profile', json={
        'email': 'testuser@example.com',
        'fullName': '',
        'address1': '123 Test St',
        'city': 'Test City',
        'state': 'TS',
        'zipCode': '12345',
        'availability': ['2024-10-01'],
        'preferences': 'None',
        'skills': ['Skill1', 'Skill2']
    })
    assert response.status_code == 400
    assert response.json['error'] == 'Full name is required and should not exceed 50 characters.'

    # Test full name exceeding 50 characters
    response = client.post('/api/profile', json={
        'email': 'testuser@example.com',
        'fullName': 'A' * 51,
        'address1': '123 Test St',
        'city': 'Test City',
        'state': 'TS',
        'zipCode': '12345',
        'availability': ['2024-10-01'],
        'preferences': 'None',
        'skills': ['Skill1', 'Skill2']
    })
    assert response.status_code == 400
    assert response.json['error'] == 'Full name is required and should not exceed 50 characters.'

    # Test missing address1
    response = client.post('/api/profile', json={
        'email': 'testuser@example.com',
        'fullName': 'Test User',
        'address1': '',
        'city': 'Test City',
        'state': 'TS',
        'zipCode': '12345',
        'availability': ['2024-10-01'],
        'preferences': 'None',
        'skills': ['Skill1', 'Skill2']
    })
    assert response.status_code == 400
    assert response.json['error'] == 'Address line 1 is required and should not exceed 100 characters.'

    # Test city exceeding 100 characters
    response = client.post('/api/profile', json={
        'email': 'testuser@example.com',
        'fullName': 'Test User',
        'address1': '123 Test St',
        'city': 'A' * 101,
        'state': 'TS',
        'zipCode': '12345',
        'availability': ['2024-10-01'],
        'preferences': 'None',
        'skills': ['Skill1', 'Skill2']
    })
    assert response.status_code == 400
    assert response.json['error'] == 'City is required and should not exceed 100 characters.'

    # Test invalid zip code length
    response = client.post('/api/profile', json={
        'email': 'testuser@example.com',
        'fullName': 'Test User',
        'address1': '123 Test St',
        'city': 'Test City',
        'state': 'TS',
        'zipCode': '123',
        'availability': ['2024-10-01'],
        'preferences': 'None',
        'skills': ['Skill1', 'Skill2']
    })
    assert response.status_code == 400
    assert response.json['error'] == 'Zip code is required and should be between 5 and 9 characters.'

    # Test missing availability
    response = client.post('/api/profile', json={
        'email': 'testuser@example.com',
        'fullName': 'Test User',
        'address1': '123 Test St',
        'city': 'Test City',
        'state': 'TS',
        'zipCode': '12345',
        'availability': [],
        'preferences': 'None',
        'skills': ['Skill1', 'Skill2']
    })
    assert response.status_code == 400
    assert response.json['error'] == 'At least one availability option is required.'

    # Test missing skills
    response = client.post('/api/profile', json={
        'email': 'testuser@example.com',
        'fullName': 'Test User',
        'address1': '123 Test St',
        'city': 'Test City',
        'state': 'TS',
        'zipCode': '12345',
        'availability': ['2024-10-01'],
        'preferences': 'None',
        'skills': []
    })
    assert response.status_code == 400
    assert response.json['error'] == 'At least one skill must be selected.'



# Test add event with invalid file extension
def test_add_event_invalid_file(client):
    response = client.post('/api/events', data={
        'id': 12345,
        'eventName': 'Test Event',
        'eventDescription': 'A test event description',
        'location': 'Test City',
        'requiredSkills': '["Skill1"]',
        'urgency': 'High',
        'eventDate': '2024-10-01',
        'eventImage': (BytesIO(b"fake image data"), 'test.txt')  # Invalid file type
    }, content_type='multipart/form-data')
    assert response.status_code == 400
    assert 'File type not allowed' in response.json['error']


# Test add event with valid file extension
def test_add_event_valid_file(client):
    upload_folder = os.path.join('static', 'uploads')
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    
    response = client.post('/api/events', data={
        'id': 12346,
        'eventName': 'Valid File Event',
        'eventDescription': 'An event with a valid image',
        'location': 'Test City',
        'requiredSkills': '["Skill1", "Skill2"]',
        'urgency': 'Medium',
        'eventDate': '2024-11-01',
        'eventImage': (BytesIO(b"fake image data"), 'test.jpg')  # Valid file type
    }, content_type='multipart/form-data')

    assert response.status_code == 201
    assert 'Event added successfully' in response.json['message']
    assert 'eventImage' in response.json['event'] and response.json['event']['eventImage'] is not None

    # Verify that the file was saved
    saved_file_path = os.path.join(upload_folder, 'test.jpg')
    assert os.path.exists(saved_file_path)

    # Clean up the test file after the test
    os.remove(saved_file_path)

def test_update_event(client):
    # Retrieve all events to determine the highest existing ID
    existing_events_response = client.get('/api/events')
    events = existing_events_response.json if existing_events_response.status_code == 200 else []
    highest_id = max(event['id'] for event in events) if events else 0
    new_event_id = highest_id + 1  # Calculate the new event ID

    # Create a new event with the calculated new ID
    create_response = client.post('/api/events', data={
        'id': new_event_id,
        'eventName': 'Sample Event',
        'eventDescription': 'Sample description',
        'location': 'Sample Location',
        'requiredSkills': json.dumps(["Skill1"]),  
        'urgency': 'High',
        'eventDate': '2024-11-01'
    }, content_type='multipart/form-data')  

    # Debugging information
    print(create_response.json) 
    assert create_response.status_code == 201  

    # Update the event
    update_response = client.put(f'/api/events/{new_event_id}', data={
        'eventName': 'Updated Event',
        'eventDescription': 'Updated description',
        'location': 'Updated Location',
        'requiredSkills': json.dumps(["Skill1", "Skill2"]),
        'urgency': 'Low',
        'eventDate': '2024-11-15'
    }, content_type='multipart/form-data')
    
    assert update_response.status_code == 200  # Confirm successful update
    assert update_response.json['message'] == 'Event updated successfully'


def test_mark_notification_as_read(client):
    # Insert a sample notification for the user
    notifications_collection = app.config['mongo'].db.notifications
    notification_id = 1
    
    # Insert a notification with `read` set to False
    notifications_collection.insert_one({
        'id': notification_id,
        'user_email': 'testuser@example.com',
        'title': 'Unread Notification',
        'message': 'This is a test notification',
        'read': False
    })
    
    # Send PUT request to mark the notification as read
    response = client.put(f'/api/notifications/read/{notification_id}')
    
    # Check the response status code and message
    assert response.status_code == 200
    assert response.json['message'] == 'Notification marked as read'
    
    # Verify that the notification has been updated in the database
    updated_notification = notifications_collection.find_one({'id': notification_id})
    assert updated_notification['read'] is True  # Check that 'read' is now True

def test_create_notification_for_users(mock_mongo_collections):
    # Define test data
    title = "Test Notification"
    message = "This is a test notification message."
    user_emails = ["user1@example.com", "user2@example.com"]

    # Insert test users
    users_collection = app.config['mongo'].db.users
    users_collection.insert_many([
        {'email': 'user1@example.com', 'role': 'user'},
        {'email': 'user2@example.com', 'role': 'user'},
        {'email': 'admin@example.com', 'role': 'admin'}
    ])

    # Call the helper function to create notifications for specific users
    create_notification_for_users(title, message, user_emails=user_emails)

    # Check that notifications were created correctly in the notifications collection
    notifications_collection = app.config['mongo'].db.notifications
    notifications = list(notifications_collection.find({'user_email': {'$in': user_emails}}, {'_id': 0}))

    # Assertions
    assert len(notifications) == 2  # Only user1 and user2 should have notifications
    for notification in notifications:
        assert notification['title'] == title
        assert notification['message'] == message
        assert notification['read'] is False
        assert notification['user_email'] in user_emails

    
# Test mark all notifications as read
def test_mark_all_notifications_as_read(client):
    response = client.put('/api/notifications/read-all/testuser@example.com')
    assert response.status_code == 200
    assert 'All notifications marked as read' in response.json['message']

# Test clearing notifications
def test_clear_notifications(client):
    response = client.delete('/api/notifications/clear/testuser@example.com')
    assert response.status_code == 200
    assert 'All notifications cleared' in response.json['message']

def test_delete_notification(client):
    # Insert a notification with an integer ID
    notifications_collection = app.config['mongo'].db.notifications
    notifications_collection.insert_one({
        'id': 1, 
        'user_email': 'testuser@example.com',
        'read': False
    })

    # Attempt to delete the existing notification by this integer ID
    response = client.delete('/api/notifications/1')  
    print("Delete Notification Response (existing):", response.json) 
    assert response.status_code == 200  

    # Attempt to delete a notification that does not exist
    response = client.delete('/api/notifications/9999') 
    print("Delete Notification Response (non-existent):", response.json)  
    assert response.status_code == 404  
    assert response.json['error'] == 'Notification with ID 9999 not found.'

def test_get_profile(client):
    # Case 1: Missing email parameter
    response = client.get('/api/profile')
    assert response.status_code == 400
    assert response.json['error'] == 'Email parameter is required'

    # Case 2: Profile exists in the database
    profiles_collection = app.config['mongo'].db.user_profiles
    profiles_collection.insert_one({
        'email': 'existinguser@example.com',
        'full_name': 'Existing User',
        'city': 'Existing City',
        'state': 'EX'
    })
    response = client.get('/api/profile', query_string={'email': 'existinguser@example.com'})
    assert response.status_code == 200
    assert response.json['email'] == 'existinguser@example.com'
    assert response.json['full_name'] == 'Existing User'
    assert response.json['city'] == 'Existing City'
    assert response.json['state'] == 'EX'

    # Case 3: Profile does not exist in the database
    response = client.get('/api/profile', query_string={'email': 'nonexistentuser@example.com'})
    assert response.status_code == 200
    assert response.json['email'] == 'nonexistentuser@example.com'
    assert response.json['message'] == 'Profile not found. Please complete your profile.'


# Confirm Email with expired and invalid token
def test_confirm_email_with_expired_token(client):
    expired_token = URLSafeTimedSerializer(app.config['SECRET_KEY']).dumps('testuser@example.com', salt=app.config['SECURITY_PASSWORD_SALT'])
    with patch('itsdangerous.URLSafeTimedSerializer.loads') as mock_loads:
        mock_loads.side_effect = SignatureExpired("Token expired")
        response = client.get(f'/api/confirm/{expired_token}')
        assert response.status_code == 400
        assert response.json['error'] == 'Token has expired. Please register again.'

def test_confirm_email_with_invalid_token(client):
    response = client.get('/api/confirm/invalidtoken123')
    assert response.status_code == 400
    assert response.json['error'] == 'Invalid or expired token.'


def test_send_reminder_with_invalid_event_id(client):
    response = client.post('/api/admin/sendReminder', json={
        'event_id': 'invalid_id',
        'user_email': 'testuser@example.com'
    })
    assert response.status_code == 400
    assert response.json['error'] == 'Invalid event ID format'

def test_send_reminder_to_nonexistent_event(client):
    response = client.post('/api/admin/sendReminder', json={
        'event_id': 999,
        'user_email': 'testuser@example.com'
    })
    assert response.status_code == 404
    assert response.json['error'] == 'Event not found.'

def test_send_reminder_missing_fields(client):
    response = client.post('/api/admin/sendReminder', json={
        'event_id': 123  # Missing 'user_email'
    })
    assert response.status_code == 400
    assert response.json['error'] == 'Event ID and User Email are required'

def test_send_reminder_unassigned_user(client):
    # Insert event but don't assign the user
    events_collection = app.config['mongo'].db.events
    events_collection.insert_one({
        'id': 123,
        'eventName': 'Test Event',
        'eventDescription': 'Event Description',
        'location': 'Location',
        'requiredSkills': ['Skill1'],
        'urgency': 'Low',
        'eventDate': '2024-11-01'
    })

    response = client.post('/api/admin/sendReminder', json={
        'event_id': 123,
        'user_email': 'unassigneduser@example.com'
    })
    assert response.status_code == 404
    assert response.json['error'] == 'unassigneduser@example.com is not assigned to this event.'

# ObjectId Conversion
def test_convert_objectid_to_str_complex_structure():
    data = {
        "simple_id": ObjectId(),
        "nested": {
            "sub_id": ObjectId(),
            "list_of_ids": [ObjectId(), {"id": ObjectId()}]
        }
    }
    result = convert_objectid_to_str(data)
    assert result["simple_id"] == str(data["simple_id"])
    assert result["nested"]["sub_id"] == str(data["nested"]["sub_id"])
    assert isinstance(result["nested"]["list_of_ids"][0], str)
    assert "id" in result["nested"]["list_of_ids"][1]


# Test get users with complete profile
def test_get_users_with_complete_profile(client):
    profiles_collection = app.config['mongo'].db.user_profiles
    profiles_collection.insert_one({'email': 'testuser@example.com', 'full_name': 'Complete User'})
    response = client.get('/api/users/getUsersWithCompleteProfile')
    assert response.status_code == 200
    assert len(response.json) == 1

# Test send reminder
def test_send_reminder(client):
    response = client.post('/api/admin/sendReminder', json={
        'event_id': 1,
        'user_email': 'testuser@example.com'
    })
    assert response.status_code in [404, 200]

# Test get all events
def test_get_events(client):
    response = client.get('/api/events')
    assert response.status_code == 200
    assert isinstance(response.json, list)

# Helper function to create a user profile
def add_user_profile(email, full_name="Test User"):
    profiles_collection = app.config['mongo'].db.user_profiles
    profiles_collection.insert_one({
        'email': email,
        'full_name': full_name,
        'city': 'Test City',
        'skills': ['Skill1'],
        'profile_completed': True
    })


# Test successful matching of a volunteer to an event
def test_match_volunteer_success(client):
    # Register a user and add a profile
    client.post('/api/register', json={
        'email': 'volunteer@example.com',
        'password': 'password123',
        'role': 'user'
    })
    add_user_profile('volunteer@example.com')

    # Create an event
    event_id = str(ObjectId())
    events_collection = app.config['mongo'].db.events
    events_collection.insert_one({
        '_id': ObjectId(event_id),
        'id': 1,
        'eventName': 'Community Service',
        'eventDescription': 'Helping the community',
        'location': 'Local Park',
        'requiredSkills': ['Skill1'],
        'urgency': 'Medium',
        'eventDate': '2024-11-01'
    })

    # Attempt to match the volunteer to the event
    response = client.post('/api/events/matchVolunteers', json={
        'email': 'volunteer@example.com',
        'event_id': event_id
    })
    assert response.status_code == 200
    assert "Successfully matched event Community Service" in response.json['message']

# Test duplicate match prevention
def test_match_volunteer_already_assigned(client):
    # Register a user and add a profile
    client.post('/api/register', json={
        'email': 'volunteer@example.com',
        'password': 'password123',
        'role': 'user'
    })
    add_user_profile('volunteer@example.com')

    # Create an event with an integer ID
    events_collection = app.config['mongo'].db.events
    events_collection.insert_one({
        'id': 2,
        'eventName': 'Environmental Cleanup',
        'eventDescription': 'Cleaning up the local beach',
        'location': 'Beach',
        'requiredSkills': ['Skill1'],
        'urgency': 'High',
        'eventDate': '2024-12-01'
    })

    # Match the volunteer to the event
    client.post('/api/events/matchVolunteers', json={
        'email': 'volunteer@example.com',
        'event_id': 2
    })

    # Attempt to match the volunteer to the same event again
    response = client.post('/api/events/matchVolunteers', json={
        'email': 'volunteer@example.com',
        'event_id': 2
    })
    assert response.status_code == 400
    assert "is already matched with event" in response.json['error']

# Test when user or event not found
def test_match_volunteer_user_or_event_not_found(client):
    # Attempt to match a user who doesn't exist to an event
    response = client.post('/api/events/matchVolunteers', json={
        'email': 'nonexistent_user@example.com',
        'event_id': '1'
    })
    assert response.status_code == 404
    assert response.json['error'] == 'User not found'

    # Register a user and create profile
    client.post('/api/register', json={
        'email': 'volunteer2@example.com',
        'password': 'password123',
        'role': 'user'
    })
    add_user_profile('volunteer2@example.com')

    # Attempt to match the user to a nonexistent event
    response = client.post('/api/events/matchVolunteers', json={
        'email': 'volunteer2@example.com',
        'event_id': '999'
    })
    assert response.status_code == 404
    assert response.json['error'] == 'Event not found'



def test_get_matched_events(client):
    # Directly insert a verified user profile into the database
    profiles_collection = app.config['mongo'].db.user_profiles
    profiles_collection.insert_one({
        'email': 'testuser@example.com',
        'city': 'Test City',
        'skills': ['Skill1'],
        'profile_completed': True  # Bypass email verification
    })

    # Test matched events
    response = client.post('/api/events/matched', json={'email': 'testuser@example.com'})
    assert response.status_code == 200
    assert 'events' in response.json





# Test get states
def test_get_states(client):
    response = client.get('/api/states')
    assert response.status_code == 200
    assert isinstance(response.json, list)



# Test for convert_objectid_to_str function
def test_convert_objectid_to_str():
    # Test with a single ObjectId
    obj_id = ObjectId()
    assert convert_objectid_to_str(obj_id) == str(obj_id)

    # Test with a dictionary containing ObjectIds
    data = {"_id": ObjectId(), "name": "Test", "nested": {"sub_id": ObjectId()}}
    result = convert_objectid_to_str(data)
    assert result["_id"] == str(data["_id"])
    assert result["nested"]["sub_id"] == str(data["nested"]["sub_id"])

    # Test with a list of ObjectIds
    data_list = [ObjectId(), ObjectId(), {"_id": ObjectId()}]
    result = convert_objectid_to_str(data_list)
    assert result[0] == str(data_list[0])
    assert result[1] == str(data_list[1])
    assert result[2]["_id"] == str(data_list[2]["_id"])

def test_get_user_event_matchings(client):
    # Mock data setup
    event_matching_collection = app.config['mongo'].db.user_event_matchings
    profiles_collection = app.config['mongo'].db.user_profiles

    # Insert a sample event-user matching
    user_email = "user@example.com"
    event_matching_collection.insert_one({
        "user_email": user_email,
        "events": [{"event_id": 1, "event_name": "Sample Event"}]
    })

    # Insert a corresponding user profile
    profiles_collection.insert_one({
        "email": user_email,
        "full_name": "Sample User"
    })

    # Send GET request to the endpoint
    response = client.get('/api/admin/eventUserMatchings')
    assert response.status_code == 200

    # Verify response data
    matchings = response.json
    assert len(matchings) > 0
    assert "full_name" in matchings[0]
    assert matchings[0]["full_name"] == "Sample User"
    assert "events" in matchings[0]
    assert "user_email" in matchings[0]
    assert "_id" in matchings[0]  

def test_get_notifications(client):
    # Insert sample notifications for the user
    notifications_collection = app.config['mongo'].db.notifications
    user_email = "testuser@example.com"
    
    # Insert notifications for the specified email
    notifications_collection.insert_many([
        {'user_email': user_email, 'title': 'Notification 1', 'message': 'First notification message', 'read': False},
        {'user_email': user_email, 'title': 'Notification 2', 'message': 'Second notification message', 'read': True}
    ])
    
    # Insert a notification for a different user to ensure filtering works
    notifications_collection.insert_one({
        'user_email': 'otheruser@example.com',
        'title': 'Notification for other user',
        'message': 'Message for other user',
        'read': False
    })
    
    # Send GET request to fetch notifications for testuser@example.com
    response = client.get(f'/api/notifications/{user_email}')
    
    # Check the response status code
    assert response.status_code == 200
    
    # Check the notifications content in the response
    notifications = response.json
    assert len(notifications) == 2  # Only two notifications should be returned
    assert notifications[0]['user_email'] == user_email
    assert notifications[1]['user_email'] == user_email
    assert notifications[0]['title'] == 'Notification 1'
    assert notifications[1]['title'] == 'Notification 2'


def test_get_volunteers(client):
    profiles_collection = app.config['mongo'].db.user_profiles

    
    profiles_collection.insert_one({
        "email": "volunteer1@example.com",
        "role": "user",
        "full_name": "Volunteer One"
    })
    profiles_collection.insert_one({
        "email": "volunteer2@example.com",
        "role": "user",
        "full_name": "Volunteer Two"
    })

   
    response = client.get('/api/volunteers')
    assert response.status_code == 200

    
    volunteers = response.json
    assert len(volunteers) >= 2  
    assert all("role" in volunteer and volunteer["role"] == "user" for volunteer in volunteers)
    assert any(volunteer["full_name"] == "Volunteer One" for volunteer in volunteers)
    assert any(volunteer["full_name"] == "Volunteer Two" for volunteer in volunteers)


def test_generate_volunteer_history_csv(client, mock_mongo_collections):
    event_matching_collection = app.config['mongo'].db.user_event_matchings
    event_matching_collection.insert_one({
        "user_email": "volunteer1@example.com",
        "events": [
            {
                "event": {
                    "eventName": "Community Service",
                    "eventDescription": "Helping the community",
                    "location": "Local Park",
                    "requiredSkills": ["Communication", "Teamwork"],
                    "urgency": "Medium",
                    "eventDate": "2024-11-01T00:00:00"
                }
            }
        ]
    })

  
    response = client.get('/api/report/volunteer-history/csv')
    assert response.status_code == 200
    assert "text/csv" in response.headers["Content-Type"]  
    assert b"Volunteer Email" in response.data
    assert b"volunteer1@example.com" in response.data
    assert b"Community Service" in response.data
    assert b"Helping the community" in response.data

def test_generate_volunteer_history_pdf(client, mock_mongo_collections):
    event_matching_collection = app.config['mongo'].db.user_event_matchings
    event_matching_collection.insert_one({
        "user_email": "volunteer2@example.com",
        "events": [
            {
                "event": {
                    "eventName": "Environmental Cleanup",
                    "eventDescription": "Beach cleaning",
                    "location": "Local Beach",
                    "requiredSkills": ["Cleaning", "Awareness"],
                    "urgency": "High",
                    "eventDate": "2024-12-10T00:00:00"
                }
            }
        ]
    })

    # Call the PDF report endpoint
    response = client.get('/api/report/volunteer-history/pdf')

    # Check response
    assert response.status_code == 200
    assert "application/pdf" in response.headers["Content-Type"]  
    assert response.data.startswith(b"%PDF")  
def test_generate_event_details_with_volunteers_csv(client, mock_mongo_collections):
    events_collection = app.config['mongo'].db.events
    event_matching_collection = app.config['mongo'].db.user_event_matchings

    # Insert sample events
    events_collection.insert_many([
        {
            "id": 1,
            "eventName": "Community Cleanup",
            "eventDescription": "Clean the park",
            "location": "City Park",
            "urgency": "High",
            "eventDate": "2024-11-20"
        },
        {
            "id": 2,
            "eventName": "Beach Cleanup",
            "eventDescription": "Clean the beach",
            "location": "Beach",
            "urgency": "Medium",
            "eventDate": "2024-11-21"
        }
    ])

   
    event_matching_collection.insert_many([
        {
            "user_email": "user1@example.com",
            "events": [{"event": {"id": 1}}]
        },
        {
            "user_email": "user2@example.com",
            "events": [{"event": {"id": 2}}]
        }
    ])

    # Call the CSV report endpoint
    response = client.get('/api/report/event-details/csv')

    # Assertions
    assert response.status_code == 200
    assert "text/csv" in response.headers["Content-Type"]
    csv_data = response.data.decode('utf-8')
    assert "Community Cleanup" in csv_data
    assert "user1@example.com" in csv_data
    assert "Beach Cleanup" in csv_data
    assert "user2@example.com" in csv_data


def test_generate_event_details_with_volunteers_pdf(client, mock_mongo_collections):
    events_collection = app.config['mongo'].db.events
    event_matching_collection = app.config['mongo'].db.user_event_matchings


    events_collection.insert_many([
        {
            "id": 1,
            "eventName": "Community Cleanup",
            "eventDescription": "Clean the park",
            "location": "City Park",
            "urgency": "High",
            "eventDate": "2024-11-20"
        },
        {
            "id": 2,
            "eventName": "Beach Cleanup",
            "eventDescription": "Clean the beach",
            "location": "Beach",
            "urgency": "Medium",
            "eventDate": "2024-11-21"
        }
    ])

   
    event_matching_collection.insert_many([
        {
            "user_email": "user1@example.com",
            "events": [{"event": {"id": 1}}]
        },
        {
            "user_email": "user2@example.com",
            "events": [{"event": {"id": 2}}]
        }
    ])

    # Call the PDF report endpoint
    response = client.get('/api/report/event-details/pdf')

    # Assertions
    assert response.status_code == 200
    assert "application/pdf" in response.headers["Content-Type"]
    assert response.data.startswith(b"%PDF")
