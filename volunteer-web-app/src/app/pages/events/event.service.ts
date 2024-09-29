// event.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private apiUrl = 'http://127.0.0.1:5000/api/events'; // URL to Flask API

  constructor(private http: HttpClient) { }

  // Method to get events from the Flask API
  getEvents(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  deleteEvent(eventId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${eventId}`);
  }
}
