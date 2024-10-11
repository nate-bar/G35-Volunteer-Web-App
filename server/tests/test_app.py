import pytest
from main import app, bcrypt, users_db, events_db, user_event_matching_db

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