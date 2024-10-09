import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedInSubject: BehaviorSubject<boolean>;
  public isLoggedIn$: Observable<boolean>;
  private userRole: string | null = null;
  private userEmail: string = '';
  private profileCompleted: boolean = false;

  private userProfileSubject = new BehaviorSubject<any>(null);
  public userProfile$ = this.userProfileSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient) {
    // Initialize based on whether the code is running in the browser
    if (isPlatformBrowser(this.platformId)) {
      this.isLoggedInSubject = new BehaviorSubject<boolean>(this.getIsLoggedInFromLocalStorage());
      this.userRole = this.getUserRoleFromLocalStorage();
      this.userEmail = this.getUserEmailFromLocalStorage();
      this.profileCompleted = this.getProfileCompletedFromLocalStorage();
    } else {
      this.isLoggedInSubject = new BehaviorSubject<boolean>(false);
    }

    this.isLoggedIn$ = this.isLoggedInSubject.asObservable();
  }

  login(role: string, email: string): void {
    this.isLoggedInSubject.next(true);
    this.userRole = role;
    this.userEmail = email;

    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', role);
        localStorage.setItem('userEmail', email);
      } catch (error) {
        console.error('Error accessing localStorage', error);
      }
    }
    this.fetchUserProfile(email).subscribe();
  }

  logout(): void {
    this.isLoggedInSubject.next(false);  // Immediately update the observable
    this.userRole = null;
    this.userEmail = '';
    this.profileCompleted = false;
  
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('profileCompleted');
      } catch (error) {
        console.error('Error accessing localStorage', error);
      }
    }
    this.userProfileSubject.next(null);
    
  }
  

  getIsLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  private getIsLoggedInFromLocalStorage(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      try {
        return localStorage.getItem('isLoggedIn') === 'true';
      } catch (error) {
        console.error('Error accessing localStorage', error);
      }
    }
    return false;
  }

  private getUserRoleFromLocalStorage(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        return localStorage.getItem('userRole');
      } catch (error) {
        console.error('Error accessing localStorage', error);
      }
    }
    return null;
  }

  getUserRole(): string | null {
    return this.userRole;
  }

  private getUserEmailFromLocalStorage(): string {
    if (isPlatformBrowser(this.platformId)) {
      try {
        return localStorage.getItem('userEmail') || '';
      } catch (error) {
        console.error('Error accessing localStorage', error);
      }
    }
    return '';
  }

  getUserEmail(): string {
    return this.userEmail;
  }

  fetchUserProfile(email: string): Observable<any> {
    return this.http.get(`http://127.0.0.1:5000/api/profile?email=${email}`).pipe(
      tap((profile) => {
        if (profile) {
          this.userProfileSubject.next(profile);
          console.log('Profile fetched and updated in AuthService:', profile);
        }
      })
    );
  }

  setProfileCompleted(completed: boolean): void {
    this.profileCompleted = completed;

    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem('profileCompleted', completed ? 'true' : 'false');
      } catch (error) {
        console.error('Error accessing localStorage', error);
      }
    }
  }

  isProfileCompleted(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      try {
        return localStorage.getItem('profileCompleted') === 'true';
      } catch (error) {
        console.error('Error accessing localStorage', error);
      }
    }
    return this.profileCompleted;
  }

  private getProfileCompletedFromLocalStorage(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      try {
        return localStorage.getItem('profileCompleted') === 'true';
      } catch (error) {
        console.error('Error accessing localStorage', error);
      }
    }
    return false;
  }
  public updateUserProfile(profile: any): void {
    this.userProfileSubject.next(profile);
  }
  
}
