import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILead extends Document {
  name: string;
  email: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Lost';
  source: 'Website' | 'Instagram' | 'Referral';
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Lost'],
      default: 'New',
    },
    source: {
      type: String,
      enum: ['Website', 'Instagram', 'Referral'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search and filter performance
leadSchema.index({ name: 'text', email: 'text' });
leadSchema.index({ status: 1 });
leadSchema.index({ source: 1 });

const Lead: Model<ILead> = mongoose.model<ILead>('Lead', leadSchema);

export default Lead;
