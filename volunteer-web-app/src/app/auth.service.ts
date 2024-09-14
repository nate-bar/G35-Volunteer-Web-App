import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedIn = false;
  private userRole: string | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // Login method
  login(role: string): void {
    this.isLoggedIn = true;
    this.userRole = role;

    // Check if we're in the browser before using localStorage
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', role);
    }
  }

  // Logout 
  logout(): void {
    this.isLoggedIn = false;
    this.userRole = null;

    // Check if we're in the browser before using localStorage
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
    }
  }

  // get login status
  getIsLoggedIn(): boolean {
    // Check if we're in the browser before using localStorage
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('isLoggedIn') === 'true';
    }
    return this.isLoggedIn;
  }

  // get user role
  getUserRole(): string | null {
    // Check if we're in the browser before using localStorage
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('userRole');
    }
    return this.userRole;
  }
}
