"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { NavLink, useLocation } from "react-router-dom"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function TubelightNavBar({ items, className }: NavBarProps) {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(() => {
    const currentItem = items.find(item => item.url === location.pathname)
    return currentItem?.name || items[0].name
  })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const currentItem = items.find(item => item.url === location.pathname)
    if (currentItem) {
      setActiveTab(currentItem.name)
    }
  }, [location.pathname, items])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      className={cn(
        "fixed bottom-6 sm:top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none",
        className,
      )}
    >
      <div className="flex items-center gap-1 bg-card/95 border border-border backdrop-blur-xl py-2 px-2 rounded-2xl shadow-lg pointer-events-auto">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <NavLink
              key={item.name}
              to={item.url}
              end={item.url === '/app'}
              onClick={() => setActiveTab(item.name)}
              className={({ isActive: routeActive }) => cn(
                "relative cursor-pointer text-sm font-medium px-4 py-2 rounded-xl transition-all duration-300",
                routeActive || isActive
                  ? "text-primary-foreground bg-primary shadow-lg" 
                  : "text-primary/60 hover:text-primary hover:bg-primary/10",
              )}
            >
              <span className="hidden md:inline font-heavy tracking-tight">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {(isActive) && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-primary rounded-xl -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-xl">
                    <div className="absolute w-16 h-8 bg-primary/30 rounded-full blur-lg -top-3 -left-4" />
                    <div className="absolute w-10 h-6 bg-primary/40 rounded-full blur-md -top-2 -left-1" />
                    <div className="absolute w-6 h-4 bg-primary/50 rounded-full blur-sm top-0 left-1" />
                  </div>
                </motion.div>
              )}
            </NavLink>
          )
        })}
      </div>
    </div>
  )
}