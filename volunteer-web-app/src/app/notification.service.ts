import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  date: Date;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifications: Notification[] = [];
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    this.loadNotifications();
  }

  // Add a new notification with current timestamp
  // Add a new notification
addNotification(notification: Notification) {  // Changed from Omit<Notification, 'date'>
  this.notifications.unshift(notification);
  this.updateNotifications();
}


  // Mark a notification as read
  markAsRead(id: number) {
    const notification = this.notifications.find((notif) => notif.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.updateNotifications();
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications = this.notifications.map(notif => ({ ...notif, read: true }));
    this.updateNotifications();
  }

  // Clear all notifications
  clearNotifications() {
    this.notifications = [];
    this.updateNotifications();
  }

  // Update notifications and save to local storage (only in the browser)
  private updateNotifications() {
    this.notificationsSubject.next([...this.notifications]);  // Use a copy to prevent unexpected mutation
    this.updateUnreadCount();
    this.saveNotifications();
  }

  // Update unread count
  private updateUnreadCount() {
    const unreadCount = this.notifications.filter((notif) => !notif.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  // Save notifications to local storage with error handling
  private saveNotifications() {
    try {
      if (this.isBrowser()) {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
      }
    } catch (error) {
      console.error('Failed to save notifications to localStorage:', error);
    }
  }

  // Load notifications from local storage with error handling
  private loadNotifications() {
    try {
      if (this.isBrowser()) {
        const storedNotifications = localStorage.getItem('notifications');
        if (storedNotifications) {
          this.notifications = JSON.parse(storedNotifications);
          this.updateNotifications();
        }
      }
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error);
    }
  }

  // Check if environment is a browser
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
