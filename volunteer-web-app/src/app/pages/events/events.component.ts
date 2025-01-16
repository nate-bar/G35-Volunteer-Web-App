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
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from '../../confirm-delete-dialog/confirm-delete-dialog.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

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
    MatIconModule,MatDialogModule,MatAutocompleteModule
  ],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
})

export class EventsComponent implements OnInit {
  eventForm: FormGroup;
  events: Event[] = [];
  selectedFile: string | File | null = null;
  imagePreview :string | File | null = null;

  skillOptions: string[] = [
    'Teamwork', 'Environmental Awareness', 'Running', 'Fundraising', 'Organizing', 'Public Speaking',
    'Nursing', 'Gardening', 'Compassion', 'Creativity', 'Patience', 'Music', 'Empathy', 'Coding',
    'Teaching', 'Animal Care', 'Communication', 'Technology',
  ];
  filteredEvents: Event[] = [];
  filter = new FormControl('');
  filteredEventOptions: Observable<Event[]> | undefined;
  isEditMode = false;
  editIndex: number | null = null;
  page = 1;
  pageSize = 5;
  apiMessage: string = '';
  loading: boolean = false;
  messageType: 'success' | 'error' = 'success';

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private notificationService: NotificationService,
    private eventService: EventService,private dialog: MatDialog
  ) {
    this.eventForm = this.fb.group({
      eventName: ['', [Validators.required, Validators.maxLength(100)]],
      eventDescription: ['', Validators.required],
      location: ['', Validators.required],
      requiredSkills: [[], Validators.required],
      urgency: ['', Validators.required],
      eventDate: ['', Validators.required],
    });
  }

  ngOnInit(): void {
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
      },
      error => {
        console.error('Error fetching events', error);
      }
    );
    this.filteredEventOptions = this.filter.valueChanges.pipe(
      startWith(''),
      map(value => this._filterEvents(value || ''))
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
      const formData = new FormData();
      
  
      // Append form fields to FormData
      formData.append('eventName', this.eventForm.get('eventName')?.value);
      formData.append('eventDescription', this.eventForm.get('eventDescription')?.value);
      formData.append('location', this.eventForm.get('location')?.value.toLowerCase());
      formData.append('urgency', this.eventForm.get('urgency')?.value);
      formData.append('eventDate', new Date(this.eventForm.get('eventDate')?.value).toISOString());
  
      // Append `requiredSkills` as a JSON string
      const requiredSkills = this.eventForm.get('requiredSkills')?.value;
      formData.append('requiredSkills', JSON.stringify(requiredSkills));
  
      // Handle the file upload
      if (this.selectedFile instanceof File) {
        formData.append('eventImage', this.selectedFile);
      }
  
      if (this.isEditMode && this.editIndex !== null) {
        // Update the existing event
        this.eventService.updateEvent(this.editIndex, formData).subscribe(
          (response) => {
            const updatedEvent = response.event;
  
            // Update the event in the events array
            const eventIndex = this.events.findIndex(event => event.id === this.editIndex);
            if (eventIndex !== -1) {
              this.events[eventIndex] = updatedEvent;
            }
  
            this.isEditMode = false;
            this.editIndex = null;
            this.apiMessage = response.message;  // Backend success message
            this.messageType = 'success'; 
  
            // // Notify about the updated event
            // this.notificationService.addNotification({
            //   id: Date.now(),
            //   title: 'Event Updated',
            //   message: `The event "${updatedEvent.eventName}" has been updated.`,
            //   read: false,
            //   date: new Date(),
            // });
  
            this.eventForm.reset();
            this.filterEvents(this.filter.value || '');
            modal.close();
          },
          (error) => {
            // Display the exact error message from the backend
            this.apiMessage = error.error?.details || error.error?.error || 'Error updating event';
            this.messageType = 'error'; 
            console.error('Error updating event:', error);
          }
        );
      } else {
        // Add a new event
        this.eventService.addEvent(formData).subscribe(
          (addedEvent) => {
            this.events.push(addedEvent.event);
            this.apiMessage = addedEvent.message;  // Backend success message
            this.messageType = 'success'; 
  
            // this.notificationService.addNotification({
            //   id: Date.now(),
            //   title: 'New Event Created',
            //   message: `A new event "${addedEvent.event.eventName}" has been created.`,
            //   read: false,
            //   date: new Date(),
            // });
  
            this.eventForm.reset();
            modal.close();
          },
          (error) => {
            // Display the exact error message from the backend
            this.apiMessage = error.error?.details || error.error?.error ;
            this.messageType = 'error'; 
            console.error('Error adding new event:', error);
          }
        );
      }
    } else {
      this.apiMessage = 'Form is invalid. Please check the fields and try again.';
      console.error('Form is invalid');
    }
  }
  
  
  
  
  


  openModal(content: any, editMode: boolean, event?: Event): void {
    this.isEditMode = editMode;
  
    if (editMode && event) {
      this.eventForm.setValue({
        eventName: event.eventName,
        eventDescription: event.eventDescription,
        location: event.location,
        requiredSkills: event.requiredSkills,
        urgency: event.urgency,
        eventDate: new Date(event.eventDate),
      });
  
      // Set the current image path if editing and the event has an image
      this.selectedFile = event.eventImage || null; // Keep reference to the current image path
  
      this.editIndex = event.id;
    } else {
      this.editIndex = null;
      this.eventForm.reset();
      this.selectedFile = null;
    }
  
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' });
  }
  
  
  
  
  
  

  onCancel(): void {
    this.eventForm.reset();
    this.isEditMode = false;
    this.editIndex = null;
  }


  openDeleteDialog(eventId: number, eventName: string): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '300px',
      data: { eventName },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // User confirmed deletion
        this.deleteEvent(eventId);
      }
    });
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
  
        this.apiMessage = response.message;  // Backend success message
        this.messageType = 'success'; 
  
        // Notify about the deletion
        this.notificationService.addNotification({
          id: Date.now().toString(),
          title: 'Event Deleted',
          message: `The event "${eventName}" has been deleted.`,
          read: false,
          date: new Date(),
        });
      },
      (error) => {
        // Display the exact error message from the backend
        this.apiMessage = error.error?.details || error.error?.error || 'Error deleting event';
        this.messageType = 'error'; 
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

  toggleFullDescription(event: any) {
    event.showFullDescription = !event.showFullDescription;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('Selected file:', this.selectedFile);
    }
    this.previewImage(file);
  }
// Check if the selected file is an image path (string) or a File object
isImagePath(): boolean {
  return typeof this.selectedFile === 'string' && this.selectedFile !== null && this.selectedFile.startsWith('http');
}

previewImage(file: File) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    this.imagePreview = reader.result as string;
  };
}


 private _filterEvents(value: string): Event[] {
    const filterValue = value.toLowerCase();
    return this.events.filter(event =>
      event.eventName.toLowerCase().includes(filterValue) ||
      event.eventDescription.toLowerCase().includes(filterValue) ||
      event.location.toLowerCase().includes(filterValue)
    );}
  
}
