import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { MdbCheckboxModule } from 'mdb-angular-ui-kit/checkbox';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MdbCheckboxModule, ReactiveFormsModule, MdbFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  rememberMe: boolean = false; 

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Retrieve the stored username if "Remember Me" was checked
    if (localStorage.getItem('rememberMe') === 'true') {
      this.username = localStorage.getItem('username') || '';
      this.rememberMe = true;
    }
  }

  login() {
    if (this.username === 'admin' && this.password === 'admin123') {
      this.authService.login('admin'); // Log in as an admin
      this.handleRememberMe(); 
      this.router.navigate(['/admin']);
    } else if (this.username === 'user' && this.password === 'user123') {
      this.authService.login('user'); // Log in as a regular user
      this.handleRememberMe(); 
      this.router.navigate(['/userEvent']);
    } else {
      alert('Invalid credentials!');
    }
  }
  cancel() {
    // Clear form fields
    this.username = '';
    this.password = '';
    this.rememberMe = false;}

  handleRememberMe(): void {
    if (this.rememberMe) {
      // Store username
      localStorage.setItem('username', this.username);
      localStorage.setItem('rememberMe', 'true');
    } else {
      // Clear stored 
      localStorage.removeItem('username');
      localStorage.setItem('rememberMe', 'false');
    }
  }
}
