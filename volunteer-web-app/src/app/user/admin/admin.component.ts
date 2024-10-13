import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSidenav } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterModule, CommonModule, MatSidenavModule, MatMenuModule, MatButtonModule, MatIconModule,MatRippleModule],
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
  email:string='';

  @ViewChild('sidenav') sidenav!: MatSidenav;

  constructor(public authService: AuthService, private router: Router,private renderer: Renderer2) {}

  ngOnInit(): void {
    if (this.authService.getIsLoggedIn()) {
      // First, check if the profile is in local storage
      const storedProfile = localStorage.getItem('userProfile');
      const fullName = localStorage.getItem('fullName');// to get fullname
      
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        this.userName = profile.full_name;
        console.log('Profile data loaded from localStorage:', profile);
      }
      
      if (fullName) {
       
        this.userName = fullName; // Assign the username from localStorage

        console.log('Username loaded from localStorage:', this.userName);
      }
  
      // Subscribe to userProfile$ to react to any updates
      this.authService.userProfile$.subscribe((profile) => {
        if (profile && profile.full_name) {
          this.userName = profile.full_name;
          console.log('Profile data received from AuthService:', profile);
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

  viewProfile(): void {
    const retrieveProfile = localStorage.getItem('userProfile');
    if(retrieveProfile){
    const stored = JSON.parse(retrieveProfile);
   
    this.email = stored.email;
    this.router.navigate(['/profile'], { queryParams: { email: this.email} });
    }else{
      console.error('User email is not available. Cannot fetch profile.');
      return;
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
 
  
  

}
