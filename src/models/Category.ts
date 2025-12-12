import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  parent?: Types.ObjectId | null;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, index: true },
  parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true }
}, { timestamps: true });

// Compound index if you expect querying (parent + status) frequently
CategorySchema.index({ parent: 1, status: 1 });

export default mongoose.model<ICategory>('Category', CategorySchema);
