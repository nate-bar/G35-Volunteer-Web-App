import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCheckboxModule,
    
  ],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
  
})

export class EventsComponent implements OnInit {
  eventForm: FormGroup;
  events = [
    {
      eventName: 'Community Cleanup',
      eventDescription: 'Join us for a community cleanup event in the local park.',
      location: 'Central Park',
      requiredSkills: ['Teamwork', 'Environmental Awareness'],
      urgency: 'High',
      eventDate: new Date('2024-10-01'),
    },
    {
      eventName: 'Charity Run',
      eventDescription: 'Participate in our annual charity run to support local schools.',
      location: 'Downtown City',
      requiredSkills: ['Running', 'Fundraising'],
      urgency: 'Medium',
      eventDate: new Date('2024-11-05'),
    },
   
  ];

  skillOptions: string[] = [
    'Teamwork',
    'Environmental Awareness',
    'Running',
    'Fundraising',
    'Organizing',
    'Public Speaking',
    'Nursing',
    'Gardening',
    'Compassion',
    'Creativity',
    'Patience',
    'Music',
    'Empathy',
    'Coding',
    'Teaching',
    'Animal Care',
    'Communication',
    'Technology',
  ];
  filteredEvents = [...this.events];
  filter = new FormControl('');
  isEditMode = false;
  editIndex: number | null = null;
  page = 1;
  pageSize = 2;

  constructor(private fb: FormBuilder, private modalService: NgbModal) {
    this.eventForm = this.fb.group({
      eventName: ['', Validators.required],
      eventDescription: ['', Validators.required],
      location: ['', Validators.required],
      requiredSkills: [[], Validators.required],
      urgency: ['', Validators.required],
      eventDate: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.filter.valueChanges.subscribe((searchTerm: string | null) => {
      this.filterEvents(searchTerm || '');
    });
  }

  filterEvents(searchTerm: string) {
    if (!searchTerm) {
      this.filteredEvents = [...this.events];
    } else {
      this.filteredEvents = this.events.filter((event) =>
        event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.eventDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.requiredSkills.join(', ').toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.urgency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.eventDate.toString().includes(searchTerm)
      );
    }
  }

  onAddOrUpdateEvent(modal: any): void {
   
    if (this.eventForm.valid) {
      // Extract form data
      const newEvent = { ...this.eventForm.value, eventDate: new Date(this.eventForm.value.eventDate) };
  
      
      if (this.isEditMode && this.editIndex !== null) {
        // Update the existing event
        this.events[this.editIndex] = newEvent;
        this.isEditMode = false;
        this.editIndex = null;
      } else {
        
        this.events.push(newEvent);
      }
  

      this.eventForm.reset();
  
      
      this.filterEvents(this.filter.value || '');
  
      
      modal.close();
    } else {
      console.error('Form is invalid');
    }
  }
  
  openModal(content: any, editMode: boolean, index?: number): void {
    this.isEditMode = editMode;
    if (editMode && index !== undefined) {
      this.editIndex = index;
      const event = this.events[index];
      this.eventForm.setValue({
        eventName: event.eventName,
        eventDescription: event.eventDescription,
        location: event.location,
        requiredSkills: event.requiredSkills,
        urgency: event.urgency,
        eventDate: new Date(event.eventDate),
      });
    } else {
      this.editIndex = null;
      this.eventForm.reset();
    }
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' });
  }

  onCancel(): void {
    this.eventForm.reset();
    this.isEditMode = false;
    this.editIndex = null;
  }

  deleteEvent(eventName: string) {
    this.events = this.events.filter((event) => event.eventName !== eventName);
    this.filterEvents(this.filter.value || '');
  }
  onSkillChange(event: any, skill: string): void {
  const selectedSkills = this.eventForm.get('requiredSkills')!.value as string[]; // Use '!' here
  
  if (event.target.checked) {
    if (!selectedSkills.includes(skill)) {
      selectedSkills.push(skill);
    }
  } else {
    const index = selectedSkills.indexOf(skill);
    if (index > -1) {
      selectedSkills.splice(index, 1);
    }
  }

  this.eventForm.get('requiredSkills')!.setValue(selectedSkills); // Use '!' here
}

}
