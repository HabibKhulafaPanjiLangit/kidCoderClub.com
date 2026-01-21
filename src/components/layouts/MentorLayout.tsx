import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { BackButton } from "@/components/mentor/BackButton";

interface MentorLayoutProps {
  children: React.ReactNode;
}

export function MentorLayout({ children }: MentorLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <MentorSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-card flex items-center px-4 sticky top-0 z-10 gap-4">
            <SidebarTrigger />
            <BackButton variant="ghost" size="sm" />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
