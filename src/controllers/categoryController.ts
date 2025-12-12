import { Request, Response } from 'express';
import Category from '../models/Category';
import mongoose from 'mongoose';
import { buildTree } from '../utils/tree';

type Req = Request & { user?: any };

const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

export const createCategory = async (req: Req, res: Response) => {
  try {
    const { name, parent } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    if (parent && !isValidObjectId(parent)) return res.status(400).json({ message: 'invalid parent id' });

    // if parent is specified, ensure it exists
    if (parent) {
      const parentCat = await Category.findById(parent);
      if (!parentCat) return res.status(400).json({ message: 'parent category not found' });
    }

    const cat = new Category({ name, parent: parent || null });
    await cat.save();
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const getAllCategoriesTree = async (req: Req, res: Response) => {
  try {
    // fetch all - consider projection to essential fields
    const categories = await Category.find().sort({ name: 1 }).lean();
    const tree = buildTree(categories);
    res.json(tree);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCategory = async (req: Req, res: Response) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'invalid id' });
    const updates: any = {};
    const { name, status, parent } = req.body;
    if (name) updates.name = name;
    if (typeof status !== 'undefined') {
      if (!['active', 'inactive'].includes(status)) return res.status(400).json({ message: 'invalid status' });
      updates.status = status;
    }
    if (typeof parent !== 'undefined') {
      if (parent && !isValidObjectId(parent)) return res.status(400).json({ message: 'invalid parent id' });
      updates.parent = parent || null;
    }

    const cat = await Category.findByIdAndUpdate(id, updates, { new: true });
    if (!cat) return res.status(404).json({ message: 'category not found' });

    // If marking inactive -> cascade to descendants (bulk)
    if (updates.status === 'inactive') {
      // Use aggregation with $graphLookup to find all descendants efficiently
      const agg = await Category.aggregate([
        { $match: { _id: cat._id } },
        {
          $graphLookup: {
            from: 'categories',
            startWith: '$_id',
            connectFromField: '_id',
            connectToField: 'parent',
            as: 'descendants',
            depthField: 'depth'
          }
        },
        { $project: { descendants: '$_id' } } // not needed, we'll extract
      ]);

      // The above project won't work as-is; instead just get descendants via graphLookup result:
      const resAgg = await Category.aggregate([
        { $match: { _id: cat._id } },
        {
          $graphLookup: {
            from: 'categories',
            startWith: '$_id',
            connectFromField: '_id',
            connectToField: 'parent',
            as: 'descendants'
          }
        }
      ]);

      const idsToUpdate = (resAgg[0]?.descendants || []).map((d: any) => d._id);
      if (idsToUpdate.length) {
        await Category.updateMany({ _id: { $in: idsToUpdate } }, { $set: { status: 'inactive' } });
      }
    }

    res.json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const deleteCategory = async (req: Req, res: Response) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'invalid id' });
    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ message: 'category not found' });

    // Reassign immediate children to this category's parent (could be null)
    await Category.updateMany({ parent: cat._id }, { $set: { parent: cat.parent || null } });

    // delete the category
    await cat.remove();
    res.json({ message: 'deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
