import { Component } from '@angular/core';
import { FormBuilder, FormControl, Validators, FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';


import { HeaderComponent } from '../../header/header.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox'; 
import { CommonModule } from '@angular/common'; // Import CommonModule

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    CommonModule,
   
    FormsModule,
    ReactiveFormsModule,
    
    HeaderComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
})
export class RegistrationComponent {
  profileForm: FormGroup;
  email = new FormControl('', [
    Validators.required,
    Validators.email,
    Validators.maxLength(100),
  ]);

  password = new FormControl('', [
    Validators.required,
    Validators.minLength(8),
  ]);
  constructor(private fb: FormBuilder, private router: Router) { 
  this.profileForm = this.fb.group({
    email: this.email,
    password: this.password,
  });

}

  onSubmit(): void {
    if (this.profileForm.valid) {
      console.log('Form Submitted:', this.profileForm.value);

      this.router.navigate(['/login']);
    } else {
      
      this.profileForm.markAllAsTouched();
      alert('Please fill out the form correctly.');
    }
  }

 
  isFieldInvalid(control: FormControl): boolean {
    return control.invalid && control.touched;
  }
}
