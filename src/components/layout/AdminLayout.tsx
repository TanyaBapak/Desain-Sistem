"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { Outlet } from "react-router-dom";

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      <TopNav onOpenSidebar={() => setCollapsed(false)} />
      <div className="flex flex-1">
        <Sidebar
          currentTab="" // will be overridden by page-level layout
          onTabChange={() => {}}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
        <main className="flex-1 p-6 md:p-8">
          <Outlet context={{}} />
        </main>
      </div>
    </div>
  );
};
