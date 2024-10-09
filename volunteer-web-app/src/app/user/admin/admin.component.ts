import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSidenav } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterModule, CommonModule, MatSidenavModule, MatMenuModule, MatButtonModule, MatIconModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  isUsersMenuOpen = false;
  isEventsMenuOpen = false;
  @Input() selected!: boolean;
  selectedLink: string = '';
  userName: string = '';
  sidenavOpened: boolean = true;
  loading: boolean = false;

  @ViewChild('sidenav') sidenav!: MatSidenav;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (this.authService.getIsLoggedIn()) {
      this.authService.userProfile$.subscribe((profile) => {
        if (profile && profile.full_name) {
          this.userName = profile.full_name;
          console.log('Profile data received:', profile);
        } else {
          console.log('Profile is missing or does not contain a full_name:', profile);
        }
        this.loading = false;
      });
    } else {
      console.log('User is not logged in');
      this.loading = false;
    }
  }

  toggleUsersMenu(): void {
    this.isUsersMenuOpen = !this.isUsersMenuOpen;
  }

  toggleEventsMenu(): void {
    this.isEventsMenuOpen = !this.isEventsMenuOpen;
  }

  logout(): void {
    this.authService.logout();  
    this.router.navigate(['/login']); 
  }
  

  selectLink(link: string, closeSidenav: boolean = true): void {
    this.selectedLink = link;
    if (closeSidenav) {
      this.sidenav.toggle(); // Toggle only if necessary
    }
  }
  viewProfile(): void {
    this.router.navigate(['/profile'], { queryParams: { email: this.authService.getUserEmail() } });
  }
  
}
