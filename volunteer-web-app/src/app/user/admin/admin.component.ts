import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterModule,CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  isUsersMenuOpen = false;
  isEventsMenuOpen = false;
  @Input() selected!: boolean;
  selectedLink: string = '';
  constructor(public authService: AuthService,private router: Router) {} 

  toggleUsersMenu(): void {
    this.isUsersMenuOpen = !this.isUsersMenuOpen;
  }

  toggleEventsMenu(): void {
    this.isEventsMenuOpen = !this.isEventsMenuOpen;
  }
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  selectLink(link: string): void {
    this.selectedLink = link;
  }
}
