import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/student/StudentSidebar";

interface StudentLayoutProps {
  children: React.ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <StudentSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-card flex items-center px-4 sticky top-0 z-10">
            <SidebarTrigger />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
