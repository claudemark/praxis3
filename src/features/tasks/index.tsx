import type { RouteObject } from "react-router-dom";

import { TaskBoardPage } from "@/features/tasks/pages/task-board-page";

export const tasksRoute: RouteObject = {
  path: "aufgaben",
  element: <TaskBoardPage />,
};
