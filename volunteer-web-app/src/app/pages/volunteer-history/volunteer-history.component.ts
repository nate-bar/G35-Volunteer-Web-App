import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms'; 
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { volunteerHistoryService } from './volunteer-history.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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
  full_name: string;
  user_email: string;
  events: Events[];
}

@Component({
  selector: 'app-volunteer-history',
  standalone: true,
  imports: [NgbPaginationModule, ReactiveFormsModule, CommonModule, MatExpansionModule, MatTableModule, MatIcon,MatProgressBarModule,FormsModule,MatButtonModule], 
  templateUrl: './volunteer-history.component.html',
  styleUrls: ['./volunteer-history.component.scss']
})
export class VolunteerHistoryComponent implements OnInit {
  volunteerHistory: VolunteerHistory[] = [];
  filteredHistory: VolunteerHistory[] = []; 
  searchControl = new FormControl(''); 
  page = 1;
  pageSize = 3;
  selectedFormat: string = 'csv';

  constructor(private volHistService: volunteerHistoryService) { }

  ngOnInit(): void {
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

  paginatedHistory() {
    const start = (this.page - 1) * this.pageSize;
    const end = this.page * this.pageSize;
    return this.filteredHistory.slice(start, end);
  }

  filterHistory(searchTerm: string) {
    if (!searchTerm) {
      this.filteredHistory = [...this.volunteerHistory];
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase();

      this.filteredHistory = this.volunteerHistory.filter(history => {
        const fullNameMatch = history.full_name.toLowerCase().includes(lowerSearchTerm);
        const emailMatch = history.user_email.toLowerCase().includes(lowerSearchTerm);
        const eventMatch = history.events.some(event => {
          return (
            event.event.eventName.toLowerCase().includes(lowerSearchTerm) ||
            event.event.eventDescription.toLowerCase().includes(lowerSearchTerm) ||
            event.event.location.toLowerCase().includes(lowerSearchTerm) ||
            event.event.requiredSkills.join(', ').toLowerCase().includes(lowerSearchTerm) || 
            event.event.urgency.toLowerCase().includes(lowerSearchTerm) ||
            new Date(event.event.eventDate).toLocaleDateString().toLowerCase().includes(lowerSearchTerm) //|| 
            // event.participation_hours.toString().includes(lowerSearchTerm) ||
            // event.participation_status.toLowerCase().includes(lowerSearchTerm) 
          );
        });
        return fullNameMatch || emailMatch || eventMatch;
      });
    }
  }

  downloadReport() {
    if (this.selectedFormat) {
      this.volHistService.downloadReport(this.selectedFormat);
    } else {
      alert("Please select a report format to download.");
    }
  }
}