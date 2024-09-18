import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-volunteer-history',
  templateUrl: './volunteer-history.component.html',
  styleUrls: ['./volunteer-history.component.scss']
})
export class VolunteerHistoryComponent implements OnInit {
  
  // Data source for the table
  volunteerHistory = [
    { eventName: 'Food Drive', eventDate: new Date('2023-08-10'), skills: ['Cooking', 'Logistics'], status: 'Completed' },
    { eventName: 'Beach Cleanup', eventDate: new Date('2023-09-01'), skills: ['Environmental'], status: 'Pending' },
    // Add more event history objects here
  ];

  displayedColumns: string[] = ['eventName', 'eventDate', 'skills', 'status'];

  constructor() {}

  ngOnInit(): void {}
}

