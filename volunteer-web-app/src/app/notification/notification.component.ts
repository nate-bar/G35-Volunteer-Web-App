import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from '../notification.service';
import { CommonModule } from '@angular/common';

interface Notification {
  id: string;
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

  constructor(private notificationService: NotificationService,private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.notificationService.notifications$.subscribe((notifications) => {
      this.notifications = notifications;
      this.cdr.markForCheck();
    });

    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
      this.cdr.markForCheck();
    });
  }

  markAsRead(id: string) {
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

  deleteNotification(id: string) {
    this.notificationService.deleteNotification(id);
  }

  closeDropdown() {
    this.showDropdown = false;
  }
}
