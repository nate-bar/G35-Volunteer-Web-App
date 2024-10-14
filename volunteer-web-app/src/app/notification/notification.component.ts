import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from '../notification.service';
import { CommonModule } from '@angular/common';

interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  date: Date;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,  
})
export class NotificationComponent implements OnInit {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showDropdown: boolean = false; 

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.notifications$.subscribe((notifications) => {
      this.notifications = notifications;
    });

    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });
  }

  markAsRead(id: number) {
    this.notificationService.markAsRead(id);
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }

  clearNotifications() {
    this.notificationService.clearNotifications();
  }

  
  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  
  closeDropdown() {
    this.showDropdown = false;
  }
}
