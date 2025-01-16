import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

interface Notification {
  id: string;
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

  private apiUrl = 'http://127.0.0.1:5000/api/notifications';  // my backend API endpoint

  constructor(private http: HttpClient,@Inject(PLATFORM_ID) private platformId: Object) {
    this.fetchNotifications();
  }

  // Fetch notifications from the backend
  fetchNotifications(): void {
    if (isPlatformBrowser(this.platformId)) {
      const email = localStorage.getItem('userEmail');
      if (email) {
        this.http.get<Notification[]>(`${this.apiUrl}/${email}`).subscribe(
          (notifications) => {
            this.notifications = notifications.map(notif => ({
              ...notif,
              id: notif.id, // Ensure id is mapped correctly
            }));
            this.updateNotifications();
          },
          (error) => {
            console.error('Failed to fetch notifications:', error);
          }
        );
      } else {
        console.error('No user email found in localStorage.');
      }
    }
  }
  
  

  // Add a new notification (handled by backend)
  addNotification(notification: Notification): void {
    this.http.post<Notification>(this.apiUrl, notification).subscribe(
      (newNotification) => {
        this.notifications.unshift(newNotification);
        this.updateNotifications();
      },
      (error) => {
        console.error('Failed to add notification:', error);
      }
    );
  }

  // Mark a notification as read
  markAsRead(id: string): void {
    this.http.put(`${this.apiUrl}/read/${id}`, {}).subscribe(
      () => {
        const notification = this.notifications.find((notif) => notif.id === id);
        if (notification) {
          notification.read = true;
          this.updateNotifications();
        }
      },
      (error) => {
        console.error('Failed to mark notification as read:', error);
      }
    );
  }
  
  

  // Mark all notifications as read
  markAllAsRead(): void {
    this.http.put(`${this.apiUrl}/read-all`, {}).subscribe(
      () => {
        this.notifications = this.notifications.map(notif => ({ ...notif, read: true }));
        this.updateNotifications();
      },
      (error) => {
        console.error('Failed to mark all notifications as read:', error);
      }
    );
  }

  clearNotifications(): void {
    const email = localStorage.getItem('userEmail'); // Assuming the user's email is stored here
    if (email) {
      this.http.delete(`${this.apiUrl}/clear/${email}`).subscribe(
        () => {
          this.notifications = [];
          this.updateNotifications();
        },
        (error) => {
          console.error('Failed to clear notifications:', error);
        }
      );
    } else {
      console.error('No user email found in localStorage.');
    }
  }
  
  deleteNotification(id: string): void {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe(
      () => {
        this.notifications = this.notifications.filter((notif) => notif.id !== id);
        this.updateNotifications();
      },
      (error) => {
        console.error('Failed to delete notification:', error);
      }
    );
  }
  

  // Helper methods to update and track notifications
  private updateNotifications(): void {
    this.notificationsSubject.next([...this.notifications]);
    this.updateUnreadCount();
  }

  private updateUnreadCount(): void {
    const unreadCount = this.notifications.filter((notif) => !notif.read).length;
    this.unreadCountSubject.next(unreadCount);
  }
}
