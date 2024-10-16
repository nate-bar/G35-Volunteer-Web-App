import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class volunteerMatchingService {
  private matchVolunteersUrl = 'http://127.0.0.1:5000/api/admin/matchVolunteers'; // URL to Flask volunteer matching API
  private usersUrl = 'http://127.0.0.1:5000/api/users/getUsersWithCompleteProfile';
  private eventsUrl = 'http://127.0.0.1:5000/api/events';
  private eventsForUserUrl = 'http://127.0.0.1:5000/api/events/getEventsForUser';
  private usersForEventUrl = 'http://127.0.0.1:5000/api/users/getUsersForEvent';

  constructor(private http: HttpClient) {}

  match(data: { email: string; event_id: string }): Observable<any> {
    return this.http.post(this.matchVolunteersUrl, data);
  }

  getUsers(): Observable<any> {
    return this.http.get(this.usersUrl);
  }

  getEvents(): Observable<any> {
    return this.http.get(this.eventsUrl);
  }

  getEventsForUser(email: string): Observable<any> {
    return this.http.post(this.eventsForUserUrl, { email });
  }

  getUsersForEvent(event_id: string): Observable<any> {
    return this.http.post(this.usersForEventUrl, { event_id });
  }
}
