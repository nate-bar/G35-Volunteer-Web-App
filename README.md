git clone https://github.com/nate-bar/G35-Volunteer-Web-App.git
cd G35-volunteer-web-app

2. Frontend Setup (Angular)
    Navigate to the volunteer-web-app directory:  cd volunteer-web-app
    Install the dependencies: npm install --legacy-peer-deps or npm install --force
    install angual material : ng add @angular/material



3. Backend Setup (Flask)
    Navigate to the server directory: cd ../server

Create a virtual environment and activate it:
    Windows:
            python -m venv .venv # run this command to create the virtual environment
            .venv\Scripts\activate  #run this commadndto activate the virtual environment
    Linux/macOS:
            python3 -m venv .venv
            source .venv/bin/activate

Install the Python dependencies:
            pip install -r requirements.txt

Running the Application
1. Run the Frontend (Angular)
    Navigate to the volunteer-web-app folder: cd ../volunteer-web-app and run : ng serve
The Angular app will be available at http://localhost:4200/.

2. Run the Backend (Flask)
    Navigate to the server folder: cd ../server and run : "flask run"  or  "python main.py"

The Flask server will be running at http://localhost:5000/.

- Usage:
Access the app in your browser at http://localhost:4200/.
Volunteers can register, log in, view available events, and register for them.
Admins can log in to create, update, and delete events and manage volunteers.
API Endpoints
The following are some of the key API endpoints used by the Flask backend:

GET /api/events: Fetch all available events.
POST /api/events: Create a new event (Admin only).
PUT /api/events/<id>: Update an event by ID (Admin only).
DELETE /api/events/<id>: Delete an event by ID (Admin only).
POST /api/register: Register a new user.
POST /api/login: Authenticate a user and get an access token.










