import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { ProfilePage } from "./pages/ProfilePage";
import { WorkoutsPage } from "./pages/WorkoutsPage";
import { CalendarPage } from "./pages/CalendarPage";
import { CreateWorkoutPage } from "./pages/CreateWorkoutPage";
import { FeedPage } from "./pages/FeedPage";
import { SearchPage } from "./pages/SearchPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: FeedPage },
      { path: "search", Component: SearchPage },
      { path: "create", Component: CreateWorkoutPage },
      { path: "calendar", Component: CalendarPage },
      { path: "workouts", Component: WorkoutsPage },
      { path: "profile", Component: ProfilePage },
    ],
  },
]);
