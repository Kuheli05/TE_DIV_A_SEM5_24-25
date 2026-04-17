import express from 'express';
import {
  createToDo,
  getToDos,
  updateToDo,
  deleteToDo,
  markToDoCompleted
} from '../controller/todoController.js';
import {authMiddleware} from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', authMiddleware, createToDo);
router.get('/get-all', authMiddleware, getToDos);
router.put('/update/:toDoId', authMiddleware, updateToDo);
router.delete('/delete/:toDoId', authMiddleware, deleteToDo);
router.put('/complete/:toDoId', authMiddleware, markToDoCompleted);

export default router;
