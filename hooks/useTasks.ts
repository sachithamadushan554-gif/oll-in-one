import { useState, useEffect } from 'react';
import type { Task } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../src/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export const useTasks = () => {
  const { user } = useFirebase();
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const savedTasks = localStorage.getItem('tasks');
      return savedTasks ? JSON.parse(savedTasks) : [];
    } catch (error) {
      console.error("Error reading tasks from localStorage", error);
      return [];
    }
  });

  // Sync from Firestore
  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/tasks`;
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const remoteTasks = snapshot.docs.map(doc => doc.data() as Task);
      setTasks(remoteTasks);
      localStorage.setItem('tasks', JSON.stringify(remoteTasks));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return unsubscribe;
  }, [user]);

  // Save to Firestore helper
  const saveTaskToCloud = async (task: Task) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks/${task.id}`;
    try {
      await setDoc(doc(db, path), task);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteTaskFromCloud = async (taskId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
      } catch (error) {
        console.error("Error saving tasks to localStorage", error);
      }
    }
  }, [tasks, user]);

  const addTask = (taskData: { description: string; dueDate: string }) => {
    const newTask: Task = {
      id: `TASK-${crypto.randomUUID()}`,
      completed: false,
      ...taskData,
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
    if (user) saveTaskToCloud(newTask);
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
            const updated = { ...task, completed: !task.completed };
            if (user) saveTaskToCloud(updated);
            return updated;
        }
        return task;
      })
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    if (user) deleteTaskFromCloud(taskId);
  };

  return { tasks, addTask, toggleTaskStatus, deleteTask };
};
