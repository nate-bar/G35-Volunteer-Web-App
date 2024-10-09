import pytest
from main import app

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
    assert response.json['event']['eventName'] == 'Updated Community Cleanup'

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
    assert any(event['eventName'] == 'Community Cleanup' for event in response.json)


def test_match_volunteer_with_event(client):
    client.post('/api/register', json={
        'email': 'volunteer1@example.com',
        'password': 'securepassword123',
        'role': 'user'
    })

    client.post('/api/events', json={
        'eventName': 'Charity Run',
        'eventDescription': 'Join us for a charity run to raise funds for education.',
        'location': 'City Park',
        'requiredSkills': ['Endurance', 'Community Spirit'],
        'urgency': 'Medium',
        'eventDate': '2024-11-01'
    })

    response = client.post('/api/admin/matchVolunteers', json={
        'email': 'volunteer1@example.com',
        'event_id': 1
    })

    assert response.status_code == 200
    assert response.json['message'] == 'Event 1 successfully matched with user volunteer1@example.com'

    user_response = client.get('/api/profile', query_string={'email': 'volunteer1@example.com'})
    assert user_response.status_code == 200
    assert 1 in user_response.json['events']

    event_response = client.get('/api/events')
    assert event_response.status_code == 200
    matched_event = next((event for event in event_response.json if event['id'] == 1), None)
    assert matched_event is not None
    assert 'volunteer1@example.com' in matched_event['users']