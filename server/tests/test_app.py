import datetime
import json
import pytest
from main import app, bcrypt, users_db, events_db, user_event_matching_db, user_profiles_db, notifications_db, validate_event_form

from flask import url_for



@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture(autouse=True)
def clear_db():
    users_db.clear()
    events_db.clear()
    user_event_matching_db.clear()
    user_profiles_db.clear()

def test_home(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b"Welcome to the Volunteer Management API" in response.data

def test_register_and_confirm_user(client):
    
    email = 'testuser1@gmail.com'
    
    users_db.append({
        'email': email,
        'password': bcrypt.generate_password_hash('12345678').decode('utf-8'),
        'role': 'user',
        'profile_completed': False
    })
    

def test_complete_profile(client):
    
    email = 'testuser2@gmail.com'
    users_db.append({
        'email': email,
        'password': bcrypt.generate_password_hash('12345678').decode('utf-8'),
        'role': 'user',
        'profile_completed': False
    })

    response = client.post('/api/profile', json={
        'email': email,
        'fullName': 'Test User 2',
        'address1': '123 Main St',
        'address2': '',
        'city': 'Houston',
        'state': 'TX',
        'zipCode': '77002',
        'availability': ['2024-10-01'],
        'preferences': 'No preferences',
        'skills': ['Leadership', 'Teamwork']
    })

    assert response.status_code == 201
    assert response.json['message'] == 'Profile completed successfully.'

    # Verify that the user's profile is marked as completed
    user = next(user for user in users_db if user['email'] == email)
    assert user['profile_completed'] is True
    return email

def test_login_before_profile_completion(client):
    # Register a user first to test login with incomplete profile
    email = 'testuser3@gmail.com'
    users_db.append({
        'email': email,
        'password': bcrypt.generate_password_hash('12345678').decode('utf-8'),
        'role': 'user',
        'profile_completed': False
    })

    response = client.post('/api/login', json={
        'email': email,
        'password': '12345678'
    })

    assert response.status_code == 200
    assert response.json['profile_completed'] is False
    assert b"Login successful, but please complete your profile." in response.data

def test_login_after_profile_completion(client):
    # Register a user and complete their profile first to test login with completed profile
    email = 'testuser4@gmail.com'
    users_db.append({
        'email': email,
        'password': bcrypt.generate_password_hash('12345678').decode('utf-8'),
        'role': 'user',
        'profile_completed': False
    })

    # Complete the profile
    client.post('/api/profile', json={
        'email': email,
        'fullName': 'Test User 4',
        'address1': '123 Main St',
        'address2': '',
        'city': 'Houston',
        'state': 'TX',
        'zipCode': '77002',
        'availability': ['2024-10-01'],
        'preferences': 'No preferences',
        'skills': ['Leadership', 'Teamwork']
    })

    response = client.post('/api/login', json={
        'email': email,
        'password': '12345678'
    })

    assert response.status_code == 200
    assert response.json['profile_completed'] is True
    assert b"Login successful" in response.data

def test_get_profile_incomplete(client):
    # Register a user first to test fetching an incomplete profile
    email = 'testuser5@gmail.com'
    users_db.append({
        'email': email,
        'password': bcrypt.generate_password_hash('12345678').decode('utf-8'),
        'role': 'user',
        'profile_completed': False
    })

    response = client.get('/api/profile', query_string={'email': email})
    assert response.status_code == 200
    assert 'Profile not found' in response.json.get('message', '')

def test_get_profile_complete(client):
    # Complete profile before fetching it
    email = test_complete_profile(client)

    response = client.get('/api/profile', query_string={'email': email})
    assert response.status_code == 200
    assert response.json['full_name'] == 'Test User 2'

def test_get_events(client):
    response = client.get('/api/events')
    assert response.status_code == 200

def test_add_event(client):
    response = client.post('/api/events', data={
    'eventName': 'Cleanup Event',
    'eventDescription': 'Join us to clean up the park.',
    'location': 'Central Park',
    'requiredSkills': json.dumps(['Teamwork', 'Environmental Awareness']),
    'urgency': 'High',
    'eventDate': '2025-10-01'
}, content_type='multipart/form-data')

    assert response.status_code == 201
    assert 'Event added successfully' in response.json['message']
    assert response.json['event']['eventName'] == 'Cleanup Event'

def test_update_event(client):
    # First add an event
    client.post('/api/events', data={
        'eventName': 'Community Research',
        'eventDescription': 'Join us for community research.',
        'location': 'Central Park',
        'requiredSkills': json.dumps(['Research', 'Teamwork']),
        'urgency': 'High',
        'eventDate': '2025-10-01'
    }, content_type='multipart/form-data')

    # Get the event ID (assuming it's the last one added)
    event_id = events_db[-1]['id']  # Get the ID of the event just added

    # Update the event using the event_id
    response = client.put(f'/api/events/{event_id}', data={
        'eventName': 'Updated Community Research',
        'eventDescription': 'Updated description.',
        'location': 'Updated Park',
        'requiredSkills': json.dumps(['Updated Skills']),
        'urgency': 'Low',
        'eventDate': '2025-12-31'
    }, content_type='multipart/form-data')

    # Assertions
    assert response.status_code == 200
    assert 'Event updated successfully' in response.json['message']
    assert response.json['event']['eventName'] == 'Updated Community Research'


def test_update_event_not_found(client):
    response = client.put('/api/events/99999', json={
        'eventName': 'Non-existent Event',
        'eventDescription': 'Should not be updated',
        'location': 'Unknown',
        'requiredSkills': [],
        'urgency': 'Low',
        'eventDate': '2025-12-31'
    })
    assert response.status_code == 404
    assert 'Event not found' in response.json['error']

def test_delete_event(client):
    events_db.append({
        'id': len(events_db) + 1,
        'eventName': 'Event to Delete',
        'eventDescription': 'This event will be deleted.',
        'location': 'Central Park',
        'requiredSkills': ['Teamwork'],
        'urgency': 'Medium',
        'eventDate': '2025-11-01',
        'eventImage': None 
    })

    event_id = events_db[-1]['id']

    response = client.delete(f'/api/events/{event_id}')
    
    assert response.status_code == 200
    assert 'Event deleted successfully' in response.json['message']
    assert len([event for event in events_db if event['id'] == event_id]) == 0

def test_delete_event_not_found(client):
    response = client.delete('/api/events/99999')
    assert response.status_code == 404
    assert 'Event not found' in response.json['error']

def test_match_volunteer_with_event(client):
    users_db.append({
        'email': 'volunteer1@example.com',
        'password': bcrypt.generate_password_hash('12345678').decode('utf-8'),
        'role': 'user',
        'full_name': 'Tester Man',
        'profile_completed': True
    })

    user_profiles_db.append({
        'email': 'volunteer1@example.com',
        'full_name': 'Tester Man',
        'address1': '123 Volunteer St',
        'city': 'Volunteer City',
        'state': 'VS',
        'zip_code': '12345',
        'skills': ['Endurance', 'Community Spirit'],
        'availability': ['2024-11-01']
    })

    events_db.append({
        'id': 1,
        'eventName': 'Charity Run',
        'eventDescription': 'Join us for a charity run to raise funds for education.',
        'location': 'City Park',
        'requiredSkills': ['Endurance', 'Community Spirit'],
        'urgency': 'Medium',
        'eventDate': '2024-11-01',
    })

    response = client.post('/api/events/matchVolunteers', json={
        'email': 'volunteer1@example.com',
        'event_id': '1',
        'participation_hours': 5,
        'participation_status': 'Confirmed'
    })

    assert response.status_code == 200

    assert len(user_event_matching_db) == 1
    assert user_event_matching_db[0]['user_email'] == 'volunteer1@example.com'
    assert len(user_event_matching_db[0]['events']) == 1

    matched_event = user_event_matching_db[0]['events'][0]
    assert matched_event['event']['eventName'] == 'Charity Run'
    assert matched_event['participation_hours'] == 5 
    assert matched_event['participation_status'] == 'Confirmed'


def test_mark_notification_as_read(client):
    
    notifications_db.append({
        'id': 1,
        'user_email': 'testuser1@gmail.com',
        'title': 'Test Notification',
        'message': 'This is a test notification.',
        'read': False,
        'date': datetime.datetime.now().isoformat()
    })

    
    response = client.put('/api/notifications/read/1')

    assert response.status_code == 200
    assert response.json['message'] == 'Notification marked as read'

    
    notif = next((n for n in notifications_db if n['id'] == 1), None)
    assert notif is not None
    assert notif['read'] is True

def test_mark_all_notifications_as_read(client):
    
    notifications_db.append({
        'id': 1,
        'user_email': 'testuser2@gmail.com',
        'title': 'Notification 1',
        'message': 'First notification',
        'read': False,
        'date': datetime.datetime.now().isoformat()
    })
    notifications_db.append({
        'id': 2,
        'user_email': 'testuser2@gmail.com',
        'title': 'Notification 2',
        'message': 'Second notification',
        'read': False,
        'date': datetime.datetime.now().isoformat()
    })

  
    response = client.put('/api/notifications/read-all/testuser2@gmail.com')

    assert response.status_code == 200
    assert response.json['message'] == 'All notifications marked as read'

    
    user_notifications = [n for n in notifications_db if n['user_email'] == 'testuser2@gmail.com']
    for notif in user_notifications:
        assert notif['read'] is True

def test_get_notifications(client):
    # Add a notification for the test
    notifications_db.append({
        'id': 1,
        'user_email': 'testuser123@gmail.com',
        'title': 'Test Notification',
        'message': 'This is a test notification.',
        'read': False,
        'date': datetime.datetime.now().isoformat()
    })

    # Get notifications for testuser1
    response = client.get('/api/notifications/testuser123@gmail.com')

    assert response.status_code == 200
    assert len(response.json) == 1  # One notification
    assert response.json[0]['user_email'] == 'testuser123@gmail.com'
    assert response.json[0]['title'] == 'Test Notification'
    assert response.json[0]['read'] is False

def test_clear_notifications(client):
   
    notifications_db.append({
        'id': 1,
        'user_email': 'testuser3@gmail.com',
        'title': 'Notification 1',
        'message': 'First notification',
        'read': False,
        'date': datetime.datetime.now().isoformat()
    })
    notifications_db.append({
        'id': 2,
        'user_email': 'testuser3@gmail.com',
        'title': 'Notification 2',
        'message': 'Second notification',
        'read': False,
        'date': datetime.datetime.now().isoformat()
    })

 
    response = client.delete('/api/notifications/clear/testuser3@gmail.com')

    assert response.status_code == 200
    assert response.json['message'] == 'All notifications cleared'

    
    user_notifications = [n for n in notifications_db if n['user_email'] == 'testuser3@gmail.com']
    assert len(user_notifications) == 2

def test_delete_notification(client):
    global notifications_db

    notifications_db.append({
        'id': 1,
        'user_email': 'testuser4@gmail.com',
        'title': 'Notification to Delete',
        'message': 'This notification will be deleted.',
        'read': False,
        'date': datetime.datetime.now().isoformat()
    })

    
    response = client.delete('/api/notifications/1')

    assert response.status_code == 200
    assert response.json['message'] == 'Notification 1 deleted successfully.'

def test_get_users(client):
    # Add a few users to the users_db for the test
    users_db.append({
        'email': 'user1@gmail.com',
        'password': bcrypt.generate_password_hash('12345678').decode('utf-8'),
        'role': 'user',
        'profile_completed': True
    })
    users_db.append({
        'email': 'user2@gmail.com',
        'password': bcrypt.generate_password_hash('12345678').decode('utf-8'),
        'role': 'admin',
        'profile_completed': True
    })

    
    response = client.get('/api/users')

    assert response.status_code == 200
    assert len(response.json) == 2 
    assert response.json[0]['email'] == 'user1@gmail.com'
    assert response.json[1]['email'] == 'user2@gmail.com'

def test_delete_all_notifications_for_user(client):
    notifications_db.append({
        'id': 2,
        'user_email': 'user5@gmail.com',
        'title': 'Test Notification',
        'message': 'Test message',
        'read': False,
        'date': datetime.datetime.now().isoformat()
    })
    
   
    response = client.delete('/api/notifications/clear/user5@gmail.com')
    
    assert response.status_code == 200
    assert response.json['message'] == 'All notifications cleared'

def test_validate_event_form():
    # Valid event data
    valid_data = {
        'event_name': 'Community Cleanup',
        'event_description': 'Help clean up the local park.',
        'location': 'Central Park',
        'required_skills': ['Teamwork', 'Environmental Awareness'],
        'urgency': 'High',
        'event_date': '2025-10-01'
    }
    
    validation_error = validate_event_form(**valid_data)
    assert validation_error is None  

    
    invalid_data_no_name = valid_data.copy()
    invalid_data_no_name['event_name'] = ''
    validation_error = validate_event_form(**invalid_data_no_name)
    assert validation_error == 'Event Name is required and must be at most 100 characters.'

    
    invalid_data_invalid_urgency = valid_data.copy()
    invalid_data_invalid_urgency['urgency'] = 'Critical'
    validation_error = validate_event_form(**invalid_data_invalid_urgency)
    assert validation_error == 'Urgency must be one of "High", "Medium", or "Low".'

    
    invalid_data_no_skills = valid_data.copy()
    invalid_data_no_skills['required_skills'] = []
    validation_error = validate_event_form(**invalid_data_no_skills)
    assert validation_error == 'Required Skills must be selected.'
    
def test_get_users_with_complete_profile(client):
    users_db.append({
        'email': 'completeuser1@gmail.com',
        'full_name': 'Complete User',
        'address1': '123 Main St',
        'address2': 'Apt 4B',
        'city': 'New York',
        'state': 'NY',
        'profile_completed': True,
        'zip_code': '10001',
        'availability': ['2025-01-01'],
        'skills': ['Leadership', 'Teamwork']
    })

    
    users_db.append({
        'email': 'incompleteuser2@gmail.com',
        'full_name': '',
        'address1': '456 Oak St',
        'city': 'Los Angeles',
        'state': 'CA',
        'zip_code': '90001',
        'availability': [],
        'skills': []
    })

    
    response = client.get('/api/users/getUsersWithCompleteProfile')

    assert response.status_code == 200
    assert len(response.json) == 1  
    assert response.json[0]['email'] == 'completeuser1@gmail.com'
    assert response.json[0]['full_name'] == 'Complete User'
import pytest
from flask import json

# Test case for sending event reminders
def test_send_reminder(client):
    events_db.append({'id': 1, 'eventName': 'Test Event'})
    events_db.append({'id': 999, 'eventName': 'Test Event 2'})
    user_event_matching_db.append({
        'user_email': 'testuser@example.com',
        'events': [{'event': {'id': 1}}]
    })

    # Test with valid event ID
    response = client.post('/api/admin/sendReminder', json={
        'event_id': 1
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'Reminders sent successfully' in data['message']

    # Test invalid event ID
    response = client.post('/api/admin/sendReminder', json={
        'event_id': 'invalid_id'
    })
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'Invalid event ID format' in data['error']

    # Test no users assigned to event
    response = client.post('/api/admin/sendReminder', json={
        'event_id': 999
    })
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'No users assigned to this event' in data['error']

# Test case for getting volunteers with the 'user' role
def test_get_volunteers(client):
    response = client.get('/api/volunteers')
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Check that all returned profiles have the role 'user'
    for user in data:
        assert user['role'] == 'user'
