from flask import Flask, jsonify, request
from flask_cors import CORS
from events_data import events

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Home route
@app.route('/')
def home():
    return "<h1>Welcome to the Volunteer Management API</h1>"



@app.route('/api/events', methods=['GET'])
def get_events():
    return jsonify(events)

# Add a new event
@app.route('/api/events', methods=['POST'])
def add_event():
    new_event = request.get_json()
    new_event['id'] = len(events) + 1
    events.append(new_event)
    return jsonify(new_event), 201

# Update an event
@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    updated_event = request.get_json()
    for event in events:
        if event['id'] == event_id:
            event.update(updated_event)
            return jsonify(event)
    return jsonify({'message': 'Event not found'}), 404

# Delete an event
@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    for event in events:
        if event['id'] == event_id:
            events.remove(event)
            return jsonify({'message': 'Event deleted successfully'})
    return jsonify({'message': 'Event not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)
