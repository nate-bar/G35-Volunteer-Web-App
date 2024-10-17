import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { HttpClient } from '@angular/common/http';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';

interface UserProfile {
  email: string;
  full_name: string;
  address1: string;
  city: string;
  state: string;
  zip_code: string;
  skills: string[];
  availability: string[];
  role:string;
  preferences:string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatOptionModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatIconModule,
    MatButton
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent implements OnInit {
  users: UserProfile[] = [];
  isLoading: boolean = false;
  step = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.getUsersWithCompleteProfiles();
  }

  getUsersWithCompleteProfiles(): void {
    this.isLoading = true;

    // Add a delay of 2 seconds before resolving the data
    setTimeout(() => {
      this.http.get<UserProfile[]>('http://127.0.0.1:5000/api/users/getUsersWithCompleteProfile')
        .subscribe(
          (data) => {
            this.users = data;
            console.log(this.users);
            this.isLoading = false; // Set loading to false after the data is fetched
          },
          (error) => {
            console.error('Failed to fetch users', error);
            this.isLoading = false; // Set loading to false in case of an error
          }
        );
    }, 2000); // 2 seconds delay
  }

  setStep(index: number) {
    this.step = index;
  }

  nextStep() {
    if (this.step < this.users.length - 1) {
      this.step++;
    }
  }

  prevStep() {
    if (this.step > 0) {
      this.step--;
    }
  }
}
