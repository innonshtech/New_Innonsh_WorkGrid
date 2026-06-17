"use client";

import React from "react";
import TaskList from "./task-list";

const MyTasks = () => {
    // MyTasks is essentially TaskList but defaults to the current user's assignments
    // The API /api/v1/admin/tasks already filters by assignedTo if the user is an employee
    return <TaskList role="employee" />;
};

export default MyTasks;