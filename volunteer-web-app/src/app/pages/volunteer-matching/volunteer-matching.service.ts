import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class volunteerMatchingService {
  private volunteerMatchingUrl = 'http://127.0.0.1:5000/api/admin/matchVolunteers'; // URL to Flask volunteer matching API
  private usersUrl = 'http://127.0.0.1:5000/api/users';
  private eventsUrl = 'http://127.0.0.1:5000/api/events';

  constructor(private http: HttpClient) {}

  // Method to perform volunteer matching with the backend API
  match(data: { email: string; event_id: string }): Observable<any> {
    return this.http.post(this.volunteerMatchingUrl, data);
  }

  getUsers(): Observable<any> {
    return this.http.get(this.usersUrl);
  }

  getEvents(): Observable<any> {
    return this.http.get(this.eventsUrl);
  }
}
