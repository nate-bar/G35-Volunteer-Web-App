import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms'; 
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { volunteerHistoryService } from './volunteer-history.service';

interface Event {
  eventDate: string;
  eventDescription: string;
  eventName: string;
  id: number;
  location: string;
  requiredSkills: string[];
  urgency: string;
}

interface Events {
  event: Event;
  participation_hours: number;
  participation_status: string;
}


interface VolunteerHistory {
  user_email: string;
  events: Events[];
}

@Component({
  selector: 'app-volunteer-history',
  standalone: true,
  imports: [NgbPaginationModule, ReactiveFormsModule, CommonModule], 
  templateUrl: './volunteer-history.component.html',
  styleUrls: ['./volunteer-history.component.scss']
})
export class VolunteerHistoryComponent implements OnInit {
  volunteerHistory: VolunteerHistory[] = [];
  filteredHistory: VolunteerHistory[] = []; 
  searchControl = new FormControl(''); 
  page = 1;
  pageSize = 3;

  constructor(private volHistService: volunteerHistoryService) { }

  ngOnInit(): void {
    // fetch user_event_matchings
    this.volHistService.getUsersEvents().subscribe((data: VolunteerHistory[]) => {
      this.volunteerHistory = data.map(e => ({
        ...e
      }));
      this.filteredHistory = [...this.volunteerHistory];
    });

    this.searchControl.valueChanges.subscribe((searchTerm: string | null) => {
      this.filterHistory(searchTerm ?? ''); 
    });
  }

  
  filterHistory(searchTerm: string) {
    if (!searchTerm) {
      this.filteredHistory = [...this.volunteerHistory];
    } else {
      this.filteredHistory = this.volunteerHistory.filter(history =>
        history.user_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }
}
