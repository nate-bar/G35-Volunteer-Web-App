import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

interface User {
  email: string;
  skills: string[];
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
    NgbPaginationModule
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  addUserForm: FormGroup;
  users: User[] = [];
  filteredusers: User[] = []; 
  skillOptions: string[] = ['Programming', 'Teaching', 'Gardening', 'Public Speaking', 'Fundraising'];
  isEditMode: boolean = false;
  editIndex: number | null = null;
  filter = new FormControl('');
  page = 1;
  pageSize = 3;

  constructor(private fb: FormBuilder) {
    this.addUserForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      skills: [[], Validators.required] 
    });
  }

  ngOnInit(): void {
    
    this.users = [
      { email: 'john.doe@gmail.com', skills: ['Programming', 'Teaching'] },
      { email: 'jane.smith@gmail.com', skills: ['Gardening', 'Public Speaking'] },
      { email: 'alice.brown@gmail.com', skills: ['Programming', 'Fundraising'] },
      { email: 'bob.jones@gmail.com', skills: ['Teaching', 'Gardening'] },
      { email: 'charlie.wilson@gmail.com', skills: ['Public Speaking', 'Fundraising'] }
    ];

    this.filteredusers = [...this.users];

    
    this.filter.valueChanges.subscribe((searchTerm: string | null) => {
      this.filterUsers(searchTerm || '');
    });
  }


  filterUsers(searchTerm: string) {
    if (!searchTerm) {
      this.filteredusers = [...this.users];
    } else {
      this.filteredusers = this.users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.skills.join(', ').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }

  onAddUser(): void {
    if (this.addUserForm.valid) {
      const user: User = {
        email: this.addUserForm.value.email,
        skills: this.addUserForm.value.skills
      };

      if (this.isEditMode && this.editIndex !== null) {
        this.users[this.editIndex] = user; 
        this.isEditMode = false;
        this.editIndex = null;
      } else {
        this.users.push(user);
      }

      this.addUserForm.reset();
      this.filterUsers(this.filter.value || ''); 
    }
  }

  // Handle edit action
  onEdit(index: number): void {
    this.isEditMode = true;
    this.editIndex = index;// this part to be fixed
    const user = this.users[index];
    this.addUserForm.setValue({
      email: user.email,
      skills: user.skills
    });
  }

  // Handle delete action
  onDelete(index: number): void {
    this.users.splice(index, 1);
    this.filterUsers(this.filter.value || ''); // Update the filtered users after deletion
  }

  // Handle cancel action
  onCancel(): void {
    this.addUserForm.reset();
    this.isEditMode = false;
    this.editIndex = null;
  }
}