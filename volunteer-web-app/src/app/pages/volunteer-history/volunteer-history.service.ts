import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class volunteerHistoryService {
  private users_eventsUrl =
    'http://127.0.0.1:5000/api/admin/eventUserMatchings';

  constructor(private http: HttpClient) {}

  getUsersEvents(): Observable<any> {
    return this.http.get(this.users_eventsUrl);
  }
}