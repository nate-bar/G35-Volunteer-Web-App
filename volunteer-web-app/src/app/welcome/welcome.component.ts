import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  standalone: true,
  imports: [FormsModule,RouterModule] // Import FormsModule here
})
export class WelcomeComponent {
  

  constructor(private router: Router) {}

  
}

