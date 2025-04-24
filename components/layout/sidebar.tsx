"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  CreditCard,
  LayoutDashboard,
  Tags,
  Upload,
  Users,
  Sun,
  Moon,
  History,
  Menu,
  ChevronLeft,
  ChevronRight,
  BarChart2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { UserButton } from "@/components/auth/user-button";

const sidebarItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Import CSV", href: "/import", icon: Upload },
  { name: "Import History", href: "/imports", icon: History },
  { name: "Transactions", href: "/transactions", icon: CreditCard },
  { name: "Tags", href: "/tags", icon: Tags },
  { name: "Admin", href: "/admin", icon: Users },
];

interface SidebarContentProps {
  pathname: string;
  onItemClick?: () => void;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

function SidebarContent({ pathname, onItemClick, isCollapsed, onCollapsedChange }: SidebarContentProps) {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <div className={cn(
        "flex h-14 items-center border-b px-4 py-2",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {isCollapsed ? (
          <BarChart2 className="h-6 w-6" />
        ) : (
          <>
            <h2 className="text-lg font-semibold">Expense Tracker</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              <UserButton />
            </div>
          </>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full",
                  isCollapsed ? "justify-center" : "justify-start gap-2"
                )}
                onClick={onItemClick}
                asChild
              >
                <Link href={item.href}>
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && item.name}
                </Link>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
      {onCollapsedChange && (
        <Button
          variant="ghost"
          className={cn(
            "w-full h-10 border-t",
            isCollapsed ? "px-2" : "justify-between px-4"
          )}
          onClick={() => onCollapsedChange(!isCollapsed)}
        >
          {!isCollapsed && <span>折りたたむ</span>}
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      )}
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-40"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] p-0">
          <div className="flex h-full flex-col">
            <SidebarContent 
              pathname={pathname}
              onItemClick={() => setIsOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className={cn(
      "hidden md:flex h-screen flex-col border-r transition-all duration-300",
      isCollapsed ? "w-[70px]" : "w-[240px]"
    )}>
      <SidebarContent 
        pathname={pathname}
        isCollapsed={isCollapsed}
        onCollapsedChange={setIsCollapsed}
      />
    </div>
  );
}