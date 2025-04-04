// navbar-header-toolbar.tsx

"use client"

import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import Link from "next/link"
import NavDropdown from "./NavDropdown"

export default function Navbar() {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="flex flex-col gap-2 mt-4">
              <Link href="/">Home</Link>
              <Link href="/docs">Docs</Link>
              <NavDropdown />
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="text-lg font-semibold">
          MyApp
        </Link>
      </div>

      <NavigationMenu className="hidden lg:flex">
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/" className="px-4 py-2 hover:underline">
              Home
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/docs" className="px-4 py-2 hover:underline">
              Docs
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavDropdown />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-2">
        <Button variant="outline">Sign In</Button>
        <Button>Sign Up</Button>
      </div>
    </header>
  )
}
