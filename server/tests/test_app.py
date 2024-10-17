import datetime
import json
import pytest
from main import app, bcrypt, users_db, events_db, user_event_matching_db, user_profiles_db,notifications_db, validate_event_form

from flask import url_for



@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

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
    # First add an event
    client.post('/api/events', json={
        'eventName': 'Event to Delete',
        'eventDescription': 'This event will be deleted.',
        'location': 'Central Park',
        'requiredSkills': ['Teamwork'],
        'urgency': 'Medium',
        'eventDate': '2025-11-01'
    })

    # Get the event ID
    event_id = events_db[-1]['id']

    # Delete the event
    response = client.delete(f'/api/events/{event_id}')
    assert response.status_code == 200
    assert 'Event deleted successfully' in response.json['message']

def test_delete_event_not_found(client):
    response = client.delete('/api/events/99999')
    assert response.status_code == 404
    assert 'Event not found' in response.json['error']

def test_get_events_for_user(client):
    user_profiles_db.append({
        'email': 'user2@gmail.com',
        'full_name': 'User Two',
        'address1': '123 Main St',
        'address2': '',
        'city': 'Houston',
        'state': 'TX',
        'zip_code': '77002',
        'preferences': 'No preferences',
        'availability': ['2024-10-01'],
        'skills': ['Leadership', 'Teamwork']
    })

    events_db.append({
        'id': 1,
        'eventName': 'Team Leadership Workshop',
        'eventDescription': 'A workshop to improve leadership skills.',
        'location': 'Houston',  # Matches user city
        'requiredSkills': ['Leadership'],  # Matches user skill
        'urgency': 'High',
        'eventDate': '2024-10-15'
    })

    events_db.append({
        'id': 2,
        'eventName': 'Teamwork Building Event',
        'eventDescription': 'An event to enhance teamwork skills.',
        'location': 'Houston',  # Matches user city
        'requiredSkills': ['Teamwork'],  # Matches user skill
        'urgency': 'Medium',
        'eventDate': '2024-11-01'
    })

    response = client.post('/api/events/getEventsForUser', json={
        'email': 'user2@gmail.com'
    })

    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) == 2

    event_names = [event['eventName'] for event in response.json]
    assert 'Team Leadership Workshop' in event_names
    assert 'Teamwork Building Event' in event_names

def test_match_volunteer_with_event(client):
    users_db.append({
        'email': 'volunteer1@example.com',
        'password': bcrypt.generate_password_hash('12345678').decode('utf-8'),
        'role': 'user',
        'full_name': 'Tester Man',
        'profile_completed': True
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

    response = client.post('/api/admin/matchVolunteers', json={
        'email': 'volunteer1@example.com',
        'event_id': 1
    })

    assert response.status_code == 200
    assert response.json['message'] == 'successfully matched event Charity Run with user Tester Man'

    assert len(user_event_matching_db) == 1
    assert user_event_matching_db[0]['user_email'] == 'volunteer1@example.com'
    assert len(user_event_matching_db[0]['events']) == 1
    assert user_event_matching_db[0]['events'][0]['eventName'] == 'Charity Run'

# Additional tests

def test_get_events_for_user_no_skills(client):
    user_profiles_db.append({
        'email': 'noskills@example.com',
        'full_name': 'No Skills User',
        'city': 'Houston',
        'skills': []
    })

    response = client.post('/api/events/getEventsForUser', json={
        'email': 'noskills@example.com'
    })

    assert response.status_code == 400
    assert response.json['error'] == 'User has not specified any skills'

def test_get_events_for_user_no_user_found(client):
    response = client.post('/api/events/getEventsForUser', json={
        'email': 'nonexistent@example.com'
    })

    assert response.status_code == 404
    assert response.json['error'] == 'User profile not found'

def test_get_users_for_event(client):
    user_profiles_db.clear()
    events_db.clear()

    user_profiles_db.append({
        'email': 'user2@gmail.com',
        'full_name': 'User Two',
        'city': 'Houston', # Matches event city
        'skills': ['Leadership', 'Teamwork']
    })
    user_profiles_db.append({
        'email': 'user3@gmail.com',
        'full_name': 'User Three',
        'city': 'Houston', # Matches event city
        'skills': ['Teamwork']
    })
    user_profiles_db.append({
        'email': 'user4@gmail.com',
        'full_name': 'User Four',
        'city': 'Austin',
        'skills': ['Leadership']
    })

    events_db.append({
        'id': 1,
        'eventName': 'Leadership Conference',
        'eventDescription': 'A conference to improve leadership skills.',
        'location': 'Houston',
        'requiredSkills': ['Leadership'],
        'urgency': 'High',
        'eventDate': '2024-10-15'
    })

    response = client.post('/api/users/getUsersForEvent', json={
        'event_id': 1
    })

    assert response.status_code == 200
    assert isinstance(response.get_json(), list)
    assert len(response.json) == 1

    user_emails = [user['email'] for user in response.json]
    assert 'user2@gmail.com' in user_emails
    assert 'user3@gmail.com' not in user_emails
    assert 'user4@gmail.com' not in user_emails

def test_get_users_for_event_no_skills_required(client):
    user_profiles_db.append({
        'email': 'user2@gmail.com',
        'full_name': 'User Two',
        'city': 'Houston',
        'skills': ['Leadership', 'Teamwork']
    })

    events_db.append({
        'id': 2,
        'eventName': 'General Volunteer Event',
        'eventDescription': 'An event with no required skills.',
        'location': 'Houston',
        'requiredSkills': [],
        'urgency': 'Medium',
        'eventDate': '2024-11-01'
    })

    response = client.post('/api/users/getUsersForEvent', json={
        'event_id': 2
    })

    assert response.status_code == 200
    assert response.json['message'] == 'No skills required for this event'

def test_get_users_for_event_not_found(client):
    response = client.post('/api/users/getUsersForEvent', json={
        'event_id': 999
    })

    assert response.status_code == 404
    assert response.json['error'] == 'Event not found'

def test_get_users_for_event_missing_event_id(client):
    response = client.post('/api/users/getUsersForEvent', json={})

    assert response.status_code == 400
    assert response.json['error'] == 'Event ID is required'

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
    assert len(user_notifications) == 0

def test_delete_notification(client):
    
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

    
    notif = next((n for n in notifications_db if n['id'] == 1), None)
    assert notif is None

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
        'id': 1,
        'user_email': 'user5@gmail.com',
        'title': 'Test Notification',
        'message': 'Test message',
        'read': False,
        'date': datetime.datetime.now().isoformat()
    })
    
   
    response = client.delete('/api/notifications/clear/user5@gmail.com')
    
    assert response.status_code == 200
    assert response.json['message'] == 'All notifications cleared'
    
    
    user_notifications = [notif for notif in notifications_db if notif['user_email'] == 'user5@gmail.com']
    assert len(user_notifications) == 0
def test_get_notifications(client):
    # Add a notification for the test
    notifications_db.append({
        'id': 1,
        'user_email': 'testuser1@gmail.com',
        'title': 'Test Notification',
        'message': 'This is a test notification.',
        'read': False,
        'date': datetime.datetime.now().isoformat()
    })

    # Get notifications for testuser1
    response = client.get('/api/notifications/testuser1@gmail.com')

    assert response.status_code == 200
    assert len(response.json) == 1  # One notification
    assert response.json[0]['user_email'] == 'testuser1@gmail.com'
    assert response.json[0]['title'] == 'Test Notification'
    assert response.json[0]['read'] is False
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
