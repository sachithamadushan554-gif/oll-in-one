import React, { useState, useMemo } from 'react';
// FIX: Corrected import path for types
import type { Task } from '../types';
import { ConfirmationModal } from './Modal';

interface TaskManagerProps {
  tasks: Task[];
  addTask: (taskData: { description: string; dueDate: string }) => void;
  toggleTaskStatus: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
}

const TaskItem: React.FC<{ task: Task; onToggle: () => void; onDelete: () => void }> = ({ task, onToggle, onDelete }) => {
    const isOverdue = !task.completed && new Date(task.dueDate) < new Date();
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${task.completed ? 'bg-stone-100 dark:bg-stone-800/50' : 'bg-white dark:bg-stone-800 shadow-sm border dark:border-stone-700'}`}>
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={onToggle}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer dark:bg-stone-600 dark:border-stone-500"
                />
                <div>
                    <p className={`font-medium ${task.completed ? 'line-through text-stone-500 dark:text-stone-400' : 'text-stone-800 dark:text-stone-100'}`}>
                        {task.description}
                    </p>
                    <p className={`text-xs ${task.completed ? 'text-stone-400 dark:text-stone-500' : isOverdue ? 'text-rose-500 font-semibold' : 'text-stone-500 dark:text-stone-400'}`}>
                        Due: {task.dueDate} {isOverdue && '(Overdue)'}
                    </p>
                </div>
            </div>
            <button
                onClick={onDelete}
                className="text-stone-400 hover:text-rose-600 p-1 rounded-full"
                aria-label="Delete task"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
};


export const TaskManager: React.FC<TaskManagerProps> = ({ tasks, addTask, toggleTaskStatus, deleteTask }) => {
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const formInputStyle = "w-full px-4 py-2 border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-stone-700 dark:border-stone-600 dark:text-stone-200";


  const { pendingTasks, completedTasks } = useMemo(() => {
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return {
      pendingTasks: sortedTasks.filter(task => !task.completed),
      completedTasks: sortedTasks.filter(task => task.completed),
    };
  }, [tasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !dueDate) {
      alert('Please enter a description and a due date for the task.');
      return;
    }
    addTask({ description, dueDate });
    setDescription('');
    setDueDate('');
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
        deleteTask(taskToDelete.id);
        setTaskToDelete(null);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-lg border dark:border-stone-800">
      <div className="mb-6 border-b border-stone-200 dark:border-stone-800 pb-4">
        <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Task Manager</h2>
      </div>

        <form onSubmit={handleSubmit} className="mb-8 p-4 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-800/50 space-y-3">
            <h3 className="text-lg font-semibold text-stone-700 dark:text-stone-200">Add a New Task</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="taskDescription" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Task</label>
                  <input
                  type="text"
                  id="taskDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Follow up with customer"
                  className={`${formInputStyle} placeholder-stone-400 dark:placeholder-stone-500`}
                  required
                  />
              </div>
              <div>
                  <label htmlFor="taskDueDate" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Due Date</label>
                  <input
                  type="date"
                  id="taskDueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={formInputStyle}
                  required
                  />
              </div>
            </div>
            <div className="text-right pt-2">
                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Add Task
                </button>
            </div>
        </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Pending Tasks */}
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-3">Pending Tasks ({pendingTasks.length})</h3>
                <div className="space-y-2">
                    {pendingTasks.length > 0 ? (
                        pendingTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onToggle={() => toggleTaskStatus(task.id)}
                                onDelete={() => setTaskToDelete(task)}
                            />
                        ))
                    ) : (
                        <p className="text-sm text-stone-500 dark:text-stone-400 italic p-4 text-center">No pending tasks. Well done!</p>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column: Completed Tasks */}
        <div>
            <h3 className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-3">Completed Tasks ({completedTasks.length})</h3>
            <div className="space-y-2">
                 {completedTasks.length > 0 ? (
                    completedTasks.map(task => (
                         <TaskItem
                            key={task.id}
                            task={task}
                            onToggle={() => toggleTaskStatus(task.id)}
                            onDelete={() => setTaskToDelete(task)}
                        />
                    ))
                ) : (
                    <p className="text-sm text-stone-500 dark:text-stone-400 italic p-4 text-center">No tasks completed yet.</p>
                )}
            </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={taskToDelete ? `Are you sure you want to delete the task "${taskToDelete.description}"? This action cannot be undone.` : ''}
      />
    </div>
  );
};