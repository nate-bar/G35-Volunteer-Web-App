import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class volunteerMatchingService {
  private apiUrl = 'http://127.0.0.1:5000/api';

  constructor(private http: HttpClient) {}

  match(data: { selectedUser: string; selectedEvent: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/events/matchVolunteers`, {
      email: data.selectedUser,
      event_id: data.selectedEvent
      // participation_hours: data.participation_hours,
      // participation_status: data.participation_status
    });
  }
  
  

  // Fetch users with the 'user' role (volunteers)
  getVolunteers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/volunteers`);
  }

  // Fetch all events
  getEvents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/events`);
  }

  // Fetch events that match a user's skills and location
  getMatchedEvents(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/events/matched`, { email });
  }

  sendReminder(event_id: string | null, user_email: string): Observable<any> {
    const payload = { event_id: Number(event_id), user_email: user_email };
    return this.http.post(`${this.apiUrl}/admin/sendReminder`, payload);
  }
  
  

}
