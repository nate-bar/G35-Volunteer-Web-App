# Volunteer Management Web App

A web application for managing volunteer opportunities, built with Angular (frontend) and Flask (backend). This app helps organizations create, manage, and track volunteer events, while volunteers can easily sign up and get notifications about available opportunities.

## Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## About the Project

This Volunteer Management Web App aims to streamline the management of volunteer events for non-profit organizations and provide volunteers with an easy way to find and register for events. The project is split into a frontend built with Angular and a backend developed using Flask.

## Features

- **User Registration and Authentication**: Volunteers and administrators can register, log in, and manage their profiles.
- **Event Management**: Administrators can create, edit, and delete volunteer events.
- **Volunteer Matching**: Volunteers are matched to events based on their skills and availability.
- **Notifications**: Users receive notifications about new or updated events.
- **Admin Dashboard**: Provides insights into volunteer activity and event participation.

## Getting Started

To get a local copy of the project up and running, follow these steps.

### Prerequisites

- **Node.js and npm**: Required to run the Angular frontend.
  - [Node.js Download](https://nodejs.org/)
- **Python 3.x**: Required to run the Flask backend.
  - [Python Download](https://www.python.org/downloads/)
- **Virtual Environment**: Recommended for isolating backend dependencies.

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/nate-bar/G35-Volunteer-Web-App.git
cd G35-volunteer-web-app

2. Frontend Setup (Angular)
    Navigate to the volunteer-web-app directory:  cd volunteer-web-app
    Install the dependencies: npm install

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
    Navigate to the server folder: cd ../server and run : flask run

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

- Contributing:
Contributions are welcome! If you'd like to contribute, please follow these steps:

Fork the repository.
Create a branch for your feature (git checkout -b feature/AmazingFeature).
Commit your changes (git commit -m 'Add some AmazingFeature').
Push to the branch (git push origin feature/AmazingFeature).
Open a Pull Request.
License
Distributed under the MIT License. See LICENSE for more information.








