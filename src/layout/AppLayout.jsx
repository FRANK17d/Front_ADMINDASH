import { Outlet } from "react-router";
import AppHeader from "./AppHeader";

const LayoutContent = () => {
  return (
    <div className="min-h-screen flex flex-col dark:bg-black">
      <AppHeader />
      <div className="flex-1 p-4 mx-auto w-full max-w-(--breakpoint-2xl) md:p-6 dark:bg-black">
        <Outlet />
      </div>
    </div>
  );
};

const AppLayout = () => {
  return (
    <LayoutContent />
  );
};

export default AppLayout;
