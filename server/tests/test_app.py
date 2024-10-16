import pytest
from main import app, bcrypt, users_db, events_db, user_event_matching_db, user_profiles_db

from flask import url_for

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture(autouse=True)
def clear_data():
    users_db.clear()
    events_db.clear()
    user_event_matching_db.clear()

def test_home(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b"Welcome to the Volunteer Management API" in response.data

def test_register_valid_user(client):
    response = client.post('/api/register', json={
        'email': 'konateallamanhamed@gmail.com',
        'password': '12345678',
        'role': 'user'
    })
    assert response.status_code == 201
    assert response.json['message'] == 'Registration initiated. Please check your email to confirm.'

def test_register_invalid_email(client):
    response = client.post('/api/register', json={
        'email': 'invalidemail',
        'password': 'securepassword123',
        'role': 'user'
    })
    assert response.status_code == 400
    assert 'Invalid email address' in response.json['error']

def test_confirm_email_invalid_token(client):
    response = client.get('/api/confirm/invalidtoken')
    assert response.status_code == 400
    assert b"Invalid or expired token" in response.data

def test_login_success(client):
    # Register a user first to test login
    client.post('/api/register', json={
        'email': 'konateallamanhamed@gmail.com',
        'password': '123456789',
        'role': 'user'
    })

    hashed_password = bcrypt.generate_password_hash('123456789').decode('utf-8')

    # just added code to simulate the confirmation to store the hashed pass
    users_db.append({
        'email': 'konateallamanhamed@gmail.com',
        'password': hashed_password, 
        'role': 'user',
        'profile_completed': True
    })

    # Assuming the email is confirmed, we proceed to login
    response = client.post('/api/login', json={
        'email': 'konateallamanhamed@gmail.com',
        'password': '123456789'
    })
    assert response.status_code == 200
    assert b"Login successful" in response.data

def test_get_events(client):
    response = client.get('/api/events')
    assert response.status_code == 200

def test_add_event(client):
    response = client.post('/api/events', json={
        'eventName': 'Community Cleanup',
        'eventDescription': 'Join us to clean up the park.',
        'location': 'Central Park',
        'requiredSkills': ['Teamwork', 'Environmental Awareness'],
        'urgency': 'High',
        'eventDate': '2024-10-01'
    })
    assert response.status_code == 201
    assert 'Event added successfully' in response.json['message']
    assert response.json['event']['eventName'] == 'Community Cleanup'

def test_update_event(client):
    # First add an event
    client.post('/api/events', json={
        'eventName': 'Community reseach',
        'eventDescription': 'Join us to clean up the park.',
        'location': 'Central Park',
        'requiredSkills': ['Teamwork', 'Environmental Awareness'],
        'urgency': 'High',
        'eventDate': '2024-10-01'
    })
    
    # Update the event with id 1
    response = client.put('/api/events/1', json={
        'eventName': 'Updated Community research',
        'eventDescription': 'Updated description.',
        'location': 'Updated Park',
        'requiredSkills': ['Updated Skills'],
        'urgency': 'Low',
        'eventDate': '2024-12-31'
    })
    assert response.status_code == 200
    assert 'Event updated successfully' in response.json['message']
    assert response.json['event']['eventName'] == 'Updated Community research'

def test_update_event_not_found(client):
    response = client.put('/api/events/999', json={
        'eventName': 'Non-existent Event',
        'eventDescription': 'Should not be updated',
        'location': 'Unknown',
        'requiredSkills': [],
        'urgency': 'Low',
        'eventDate': '2024-12-31'
    })
    assert response.status_code == 404
    assert 'Event not found' in response.json['error']

def test_delete_event(client):
    # First add an event
    client.post('/api/events', json={
        'eventName': 'Community research',
        'eventDescription': 'Join us to clean up the park.',
        'location': 'Central Park',
        'requiredSkills': ['Teamwork', 'Environmental Awareness'],
        'urgency': 'High',
        'eventDate': '2024-10-01'
    })

    # Delete the event with id 1
    response = client.delete('/api/events/1')
    assert response.status_code == 200
    assert 'Event deleted successfully' in response.json['message']

def test_delete_event_not_found(client):
    response = client.delete('/api/events/999')
    assert response.status_code == 404
    assert 'Event not found' in response.json['error']

def test_get_events(client):
    # Make sure we start with a known state by adding an event
    client.post('/api/events', json={
        'eventName': 'Community research',
        'eventDescription': 'Join us to clean up the park.',
        'location': 'Central Park',
        'requiredSkills': ['Teamwork', 'Environmental Awareness'],
        'urgency': 'High',
        'eventDate': '2024-10-01'
    })

    # Fetch all events
    response = client.get('/api/events')
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) > 0
    assert any(event['eventName'] == 'Community research' for event in response.json)


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

def test_get_events_for_user(client):
    user_profiles_db.append({
        'email': 'user@example.com',
        'full_name': 'User One',
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

    events_db.append({
        'id': 3,
        'eventName': 'Non-Matching Event',
        'eventDescription': 'An event unrelated to user skills.',
        'location': 'Austin',  # Different city
        'requiredSkills': ['Different Skill'],  # Different skill
        'urgency': 'Low',
        'eventDate': '2024-12-01'
    })

    response = client.post('/api/events/getEventsForUser', json={
        'email': 'user@example.com'
    })

    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) == 2

    event_names = [event['eventName'] for event in response.json]
    assert 'Team Leadership Workshop' in event_names
    assert 'Teamwork Building Event' in event_names
    assert 'Non-Matching Event' not in event_names

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