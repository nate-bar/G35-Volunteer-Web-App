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
<<<<<<< HEAD
<<<<<<< HEAD
import { MatIconModule } from '@angular/material/icon';
=======
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
=======
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997

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
<<<<<<< HEAD
<<<<<<< HEAD
    MatIconModule
=======
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
=======
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
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
<<<<<<< HEAD
<<<<<<< HEAD
  apiMessage: string = '';
  loading: boolean = false;
  presetImages = [
    '../../../../public/volunteerChurch.jpg',
    '../../../../public/volunteerRace.jpg',
    '../../../../public/volunteerDisaster.jpg',
    '../../../../public/volunteerSchool.jpg',
    '../../../../public/volunteerPacking.jpg',
    '../../../../public/volunteerPhysical.jpg',
  ];
=======
  apiMessage: string = ''; 
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
=======
  apiMessage: string = ''; 
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997

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
      image: [''] 
    });
  }

  ngOnInit(): void {
<<<<<<< HEAD
<<<<<<< HEAD
    this.loading = true;
    // Fetch events from the Flask API
    this.eventService.getEvents().subscribe(
      (data: Event[]) => {
        // Initialize showFullDescription for each event
        this.events = data.map(event => ({
          ...event,
          showFullDescription: false  // Set the default value to false
        }));
  
        this.filteredEvents = [...this.events];
=======
=======
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
    // Fetch events from the Flask API
    this.eventService.getEvents().subscribe(
      (data: Event[]) => {
        this.events = data;
        this.filteredEvents = [...this.events];
        
<<<<<<< HEAD
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
=======
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
      },
      error => {
        console.error('Error fetching events', error);
      }
    );
<<<<<<< HEAD
<<<<<<< HEAD
  
=======

>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
=======

>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
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
        // Store the old event data before updating
        const oldEvent = { ...this.events[this.editIndex] };
  
        // Update the existing event
<<<<<<< HEAD
<<<<<<< HEAD
        this.eventService.updateEvent(this.editIndex, newEvent).subscribe(
          (response) => {
            const updatedEvent = response.event;
            
            // Find the index of the event in the events array by ID and update it
            const eventIndex = this.events.findIndex(event => event.id === this.editIndex);
            if (eventIndex !== -1) {
              this.events[eventIndex] = updatedEvent;
            }
  
            this.isEditMode = false;
            this.editIndex = null;
            this.apiMessage = response.message;
  
            // Notify about the updated event
            this.notificationService.addNotification({
              id: Date.now(),
              title: 'Event Updated',
              message: `The event "${updatedEvent.eventName}" has been updated.`,
=======
=======
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
        const eventId = this.events[this.editIndex].id;
        this.eventService.updateEvent(eventId, newEvent).subscribe(
          (response) => {
            // Correctly access `event` from the response
            const updatedEvent = response.event;
            this.events[this.editIndex!] = updatedEvent;
            this.isEditMode = false;
            this.editIndex = null;
  
            this.apiMessage = response.message;
  
            // Notify about the updated event with old details
            this.notificationService.addNotification({
              id: Date.now(),
              title: 'Event Updated',
              message: `The event "${oldEvent.eventName}" has been updated.`,
<<<<<<< HEAD
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
=======
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
              read: false,
              date: new Date(),
            });
  
            this.eventForm.reset();
            this.filterEvents(this.filter.value || '');
<<<<<<< HEAD
<<<<<<< HEAD
            modal.close(); // Close the 
            window.location.reload();
=======
            modal.close();
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
=======
            modal.close();
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
          },
          error => {
            this.apiMessage = error.error?.message || 'Error updating event';
            console.error('Error updating event:', error);
          }
        );
      } else {
        // Add new event
        this.eventService.addEvent(newEvent).subscribe(
          (addedEvent) => {
            //console.log('Added Event Response:', addedEvent);
            this.events.push(addedEvent.event);  // Access the `event` key from response
            this.apiMessage = 'New event created successfully';
        
            // Notify about the new event
            this.notificationService.addNotification({
              id: Date.now(),
              title: 'New Event Created',
              message: `A new event "${addedEvent.event.eventName}" has been created.`,
              read: false,
              date: new Date(),
            });
        
            this.eventForm.reset();
            this.filterEvents(this.filter.value || '');
            modal.close();
<<<<<<< HEAD
<<<<<<< HEAD
            window.location.reload();
=======
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
=======
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
          },
          error => {
            this.apiMessage = error.error?.message || 'Error adding new event';
            console.error('Error adding new event:', error);
          }
        );
      }        
    } else {
      this.apiMessage = 'Form is invalid. Please check the fields and try again.';
      console.error('Form is invalid');
    }
  }


<<<<<<< HEAD
<<<<<<< HEAD
  openModal(content: any, editMode: boolean, event?: Event): void {
=======
=======
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
  openModal(content: any, editMode: boolean, index?: number): void {
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
    this.isEditMode = editMode;
  
    if (editMode && event) {
      // Populate the form with the selected event's data
      this.eventForm.setValue({
        eventName: event.eventName,
        eventDescription: event.eventDescription,
        location: event.location,
        requiredSkills: event.requiredSkills,
        urgency: event.urgency,
        eventDate: new Date(event.eventDate),
      });
  
      this.editIndex = event.id; // Save the event ID for editing
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
    const eventToDelete = this.events.find(event => event.id === eventId);
  
    if (!eventToDelete) {
      this.apiMessage = 'Event not found';
      console.error('Event not found');
      return;
    }
  
    const eventName = eventToDelete.eventName;
  
    this.eventService.deleteEvent(eventId).subscribe(
      (response) => {
        this.events = this.events.filter((event) => event.id !== eventId);
        this.filterEvents(this.filter.value || '');

        this.apiMessage = response.message;  // Set message from API response

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
        this.apiMessage = error.error?.message || 'Error deleting event';
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
<<<<<<< HEAD
<<<<<<< HEAD

  toggleFullDescription(event: any) {
    event.showFullDescription = !event.showFullDescription;
  }
  
=======
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
=======
>>>>>>> e645b58f7fff69b6da1921410ed7e22d8070b997
}
