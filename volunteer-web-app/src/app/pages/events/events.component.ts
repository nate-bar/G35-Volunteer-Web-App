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
import { NotificationService } from '../../notification.service';
//import { provideHttpClient, HttpClient } from '@angular/common/http';
import { EventService } from './event.service';
import { Event } from './event.interface';

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
  events: Event[] = [];
  skillOptions: string[] = [
    'Teamwork', 'Environmental Awareness', 'Running', 'Fundraising', 'Organizing', 'Public Speaking',
    'Nursing', 'Gardening', 'Compassion', 'Creativity', 'Patience', 'Music', 'Empathy', 'Coding',
    'Teaching', 'Animal Care', 'Communication', 'Technology',
  ];
  filteredEvents: Event[] = [];
  filter = new FormControl('');
  isEditMode = false;
  editIndex: number | null = null;
  page = 1;
  pageSize = 5;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private notificationService: NotificationService,
    private eventService: EventService,
  ) {
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
    // Fetch events from the Flask API
    this.eventService.getEvents().subscribe(
      (data: Event[]) => {
        this.events = data;
        this.filteredEvents = [...this.events]; // Set filteredEvents initially
      },
      error => {
        console.error('Error fetching events', error);
      }
    );

    // Subscribe to filter input changes
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
      const newEvent = { ...this.eventForm.value, eventDate: new Date(this.eventForm.value.eventDate).toISOString() };
      if (this.isEditMode && this.editIndex !== null) {
        // Update the existing event
        this.events[this.editIndex] = newEvent;
        this.isEditMode = false;
        this.editIndex = null;

        // Notify about the updated event
        this.notificationService.addNotification({
          id: Date.now(),
          title: 'Event Updated',
          message: `The event "${newEvent.eventName}" has been updated.`,
          read: false,
          date: new Date(),
        });
      } else {
        // Add new event
        this.events.push(newEvent);

        // Notify about the new event
        this.notificationService.addNotification({
          id: Date.now(),
          title: 'New Event Created',
          message: `A new event "${newEvent.eventName}" has been created.`,
          read: false,
          date: new Date(),
        });
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

  deleteEvent(eventId: number) {
    // Find the event name before deletion
    const eventToDelete = this.events.find(event => event.id === eventId);
  
    if (!eventToDelete) {
      console.error('Event not found');
      return;
    }
  
    const eventName = eventToDelete.eventName;
  
    this.eventService.deleteEvent(eventId).subscribe(
      () => {
        // Remove the event from the local list after successful deletion
        this.events = this.events.filter((event) => event.id !== eventId);
        this.filterEvents(this.filter.value || '');
  
        // Notify about the deletion
        this.notificationService.addNotification({
          id: Date.now(),
          title: 'Event Deleted',
          message: `The event "${eventName}" has been deleted.`,
          read: false,
          date: new Date(),
        });
      },
      error => {
        console.error('Error deleting event:', error);
      }
    );
  }
  

  onSkillChange(event: any, skill: string): void {
    const selectedSkills = this.eventForm.get('requiredSkills')!.value as string[];

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

    this.eventForm.get('requiredSkills')!.setValue(selectedSkills);
  }
}
