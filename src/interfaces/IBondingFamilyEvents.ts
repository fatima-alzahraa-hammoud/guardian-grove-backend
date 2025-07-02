import { Types } from "mongoose";

export interface IBondingEvent {
  _id: Types.ObjectId;
  title: string;
  description: string;
  date: Date;
  time: string;
  location?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: Types.ObjectId; // User who generated the event
  createdAt: Date;
  updatedAt: Date;
}