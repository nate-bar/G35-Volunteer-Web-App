import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private registerUrl = 'http://127.0.0.1:5000/api/register'; // URL to Flask registration API
  private confirmUrl = 'http://127.0.0.1:5000/api/confirm'; // URL to Flask email confirmation API

  constructor(private http: HttpClient) {}

  // Method to perform registration with the backend API
  register(data: { email: string; password: string; role: string }): Observable<any> {
    return this.http.post(this.registerUrl, data);
  }

  // Method to confirm email using the token
  confirmEmail(token: string): Observable<any> {
    return this.http.get(`${this.confirmUrl}/${token}`);
  }
}

