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
import { HttpClient } from '@angular/common/http';
import Chart from 'chart.js/auto';
import { FormsModule } from '@angular/forms';




@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterModule, CommonModule, MatSidenavModule, MatMenuModule, MatButtonModule, MatIconModule,MatRippleModule,FormsModule],
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
  chart: any;
  selectedFormat: string | null = null;

  @ViewChild('sidenav') sidenav!: MatSidenav;

  constructor(public authService: AuthService, private router: Router,private renderer: Renderer2, private http: HttpClient) {}

  ngOnInit(): void {
    this.selectedLink = 'home';
    this.initializeGraph();
    if (this.authService.getIsLoggedIn()) {
      // First, check if the fullName is in local storage
      const fullName = localStorage.getItem('fullName');
      
      if (fullName) {
        this.userName = fullName; // Assign the username from localStorage
        console.log('Username loaded from localStorage:', this.userName);
      } else {
        // If fullName is not available, check for profile data in localStorage
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          this.userName = profile.full_name;
          console.log('Profile data loaded from localStorage:', profile);
        }
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
 
  

  downloadSelectedFormat(): void {
    if (this.selectedFormat) {
      const apiUrl = `http://127.0.0.1:5000/api/report/event-details/${this.selectedFormat}`;
      this.http.get(apiUrl, { responseType: 'blob' }).subscribe((response) => {
        const blob = new Blob([response], {
          type: this.selectedFormat === 'csv' ? 'text/csv' : 'application/pdf',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `event_details.${this.selectedFormat}`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
    } else {
      alert('Please select a format to download.');
    }
  }

  
  initializeGraph(): void {
    // Fetch event-user matching data
    this.http.get<any[]>('http://127.0.0.1:5000/api/admin/eventUserMatchings').subscribe(
      (data) => {
        // Process data to aggregate the count of users per event
        const eventUserCounts: { [eventId: number]: number } = {};
        const eventNames: { [eventId: number]: string } = {};
  
        data.forEach((match) => {
          match.events.forEach((eventData: any) => {
            const event = eventData.event;
            const eventId = event.id;
            if (!eventUserCounts[eventId]) {
              eventUserCounts[eventId] = 0;
              eventNames[eventId] = event.eventName;
            }
            eventUserCounts[eventId] += 1; 
          });
        });
  
        // Prepare data for the chart
        const labels = Object.values(eventNames); 
        const counts = Object.values(eventUserCounts);
  
        // Create a bar chart
        this.chart = new Chart('eventChart', {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Number of Assigned Users',
                data: counts,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Events',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Number of Users',
                },
                beginAtZero: true,
              },
            },
          },
        });
      },
      (error) => {
        console.error('Error fetching event-user matchings:', error);
      }
    );
  }
  
  

}
