import { Component } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { CommonModule } from '@angular/common';
import { FooterComponent } from "./footer/footer.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, RouterModule, CommonModule, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'volunteer-web-app';
  isAdminPage = false;
  

  

  constructor(public router: Router) {
    // Listen for route changes
    this.router.events.subscribe(() => {
      // Check if the current URL contains 'admin'
      this.isAdminPage = this.router.url.includes('/admin');
    });
  }
}
