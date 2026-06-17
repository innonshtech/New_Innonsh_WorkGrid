
// src/app/(dashboard)/tasks/calendar/page.jsx
import TaskCalendar from '@/components/tasks/task-calendar';
import { Suspense } from 'react';

export default function TaskCalendarPage() {
  return (
    <Suspense fallback={<div>Loading calendar...</div>}>
      <TaskCalendar />
    </Suspense>
  );
}