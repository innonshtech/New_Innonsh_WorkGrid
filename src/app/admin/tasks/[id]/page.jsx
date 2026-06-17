'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TaskForm from '@/components/tasks/task-form';

export default function EditTaskPage() {
  const params = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTask();
  }, [params.id]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/v1/admin/tasks/${params.id}`);
      if (response.ok) {
        const taskData = await response.json();
        setTask(taskData);
      } else {
        console.error('Failed to fetch task');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Task Not Found</h2>
          <p className="text-slate-600">The requested task could not be found.</p>
        </div>
      </div>
    );
  }

  return <TaskForm taskData={task} isEdit={true} />;
}