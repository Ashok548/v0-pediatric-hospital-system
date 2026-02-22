"use client"

import { Bell, Search, ChevronDown, Menu, LogOut, User, HelpCircle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"

interface HeaderProps {
  onMobileMenuToggle: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const [notificationOpen, setNotificationOpen] = useState(false)

  return (
    <header className="flex items-center justify-between h-16 px-4 lg:px-6 bg-card border-b border-border shrink-0">
      {/* Left: Mobile menu + Search */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden text-muted-foreground"
          onClick={onMobileMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <Menu className="size-5" />
        </Button>

        <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 w-72">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="search"
            placeholder="Search patients, records, appointments..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
            aria-label="Search"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Mobile search */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden text-muted-foreground"
          aria-label="Search"
        >
          <Search className="size-5" />
        </Button>

        {/* Notifications */}
        <DropdownMenu open={notificationOpen} onOpenChange={setNotificationOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative text-muted-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center size-4 rounded-full bg-destructive text-[10px] font-bold text-primary-foreground">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant="secondary" className="text-[10px]">3 new</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-destructive shrink-0" />
                <span className="text-sm font-medium text-foreground">NICU Alert - Bed 12</span>
              </div>
              <span className="text-xs text-muted-foreground pl-4">
                Vitals threshold breached for Patient #1847
              </span>
              <span className="text-[10px] text-muted-foreground/70 pl-4">2 min ago</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-warning shrink-0" />
                <span className="text-sm font-medium text-foreground">Lab Results Ready</span>
              </div>
              <span className="text-xs text-muted-foreground pl-4">
                CBC report for Arya Mehta is available
              </span>
              <span className="text-[10px] text-muted-foreground/70 pl-4">15 min ago</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">New Appointment</span>
              </div>
              <span className="text-xs text-muted-foreground pl-4">
                Dr. Sharma has a new booking at 3:00 PM
              </span>
              <span className="text-[10px] text-muted-foreground/70 pl-4">1 hour ago</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-xs text-primary font-medium">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-border" role="separator" />

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors outline-none" aria-label="User menu">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  DR
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground leading-tight">Dr. Priya Reddy</span>
                <span className="text-[11px] text-muted-foreground leading-tight">Pediatrician</span>
              </div>
              <ChevronDown className="hidden sm:block size-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>Dr. Priya Reddy</span>
                <span className="text-xs font-normal text-muted-foreground">priya.reddy@carenest.in</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="size-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="size-4" />
              Help & Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut className="size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
