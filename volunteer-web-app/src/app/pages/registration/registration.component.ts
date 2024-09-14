import { Component } from '@angular/core';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MdbCheckboxModule } from 'mdb-angular-ui-kit/checkbox';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [MdbFormsModule,
    FormsModule,
    ReactiveFormsModule,MdbCheckboxModule],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss'
})
export class RegistrationComponent {

}
