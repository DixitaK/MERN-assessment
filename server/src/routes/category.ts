import express from 'express';
import { createCategory, getAllCategoriesTree, updateCategory, deleteCategory } from '../controllers/categoryController';
import { authenticate } from '../middleware/auth';
const router = express.Router();

router.use(authenticate);

router.post('/', createCategory);
router.get('/', getAllCategoriesTree);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
