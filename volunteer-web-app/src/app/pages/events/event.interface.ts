// event.interface.ts
export interface Event {
  id: number;
  eventName: string;
  eventDescription: string;
  location: string;
  requiredSkills: string[];
  urgency: string;
  eventDate: string;
  showFullDescription?: boolean;
}

  