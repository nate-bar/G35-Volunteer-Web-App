import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private profileUrl = 'http://127.0.0.1:5000/api/profile'; // Replace with your Flask API URL

  constructor(private http: HttpClient) {}

  getUserProfile(email: string): Observable<any> {
    return this.http.get(`${this.profileUrl}?email=${email}`);
  }

  // Method to update user profile
  completeUserProfile(profileData: any): Observable<any> {
    return this.http.post(`${this.profileUrl}`, profileData);
  }
}
