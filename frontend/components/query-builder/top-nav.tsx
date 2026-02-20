"use client";

import React from "react"

import { Braces, Clock, Trash2, Sun, Moon, Monitor, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryStore } from "@/lib/query-store";
import { useTheme, type Theme } from "@/hooks/use-theme";

const themeIcons: Record<Theme, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  midnight: Monitor,
  highcontrast: Eye,
};

export default function TopNav() {
  const blocks = useQueryStore((s) => s.blocks);
  const clearBlocks = useQueryStore((s) => s.clearBlocks);
  const setShowHistory = useQueryStore((s) => s.setShowHistory);
  const historyCount = useQueryStore((s) => s.history.length);
  const { theme, setTheme, themes } = useTheme();

  const ActiveIcon = themeIcons[theme];

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-5 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <div className="h-3 w-3 rounded-full bg-[#FF5F57] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]" />
          <div className="h-3 w-3 rounded-full bg-[#FEBC2E] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]" />
          <div className="h-3 w-3 rounded-full bg-[#28C840] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]" />
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-border" />

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-primary shadow-sm">
            <Braces className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-[13px] font-semibold tracking-tight text-card-foreground">
            QueryCraft
          </span>
          <span className="text-[10px] px-1.5 py-px rounded-md bg-secondary text-muted-foreground font-medium">
            v1.0
          </span>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <TooltipProvider delayDuration={300}>
          {/* Theme Switcher */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-card-foreground hover:bg-secondary/80"
                  >
                    <ActiveIcon className="h-4 w-4" />
                    <span className="sr-only">Switch theme</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-popover text-popover-foreground border shadow-lg"
              >
                <p className="text-xs">
                  Theme: {themes.find((t) => t.id === theme)?.label}
                </p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="w-52 rounded-xl shadow-xl"
            >
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Appearance
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {themes.map((t) => {
                const Icon = themeIcons[t.id];
                const isActive = theme === t.id;
                return (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`gap-3 rounded-lg py-2 cursor-pointer ${isActive ? "bg-accent text-accent-foreground" : ""}`}
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${isActive ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] font-medium">{t.label}</span>
                      <span className="text-[10px] text-muted-foreground leading-none">
                        {t.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* History */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-card-foreground hover:bg-secondary/80"
                onClick={() => setShowHistory(true)}
              >
                <Clock className="h-4 w-4" />
                <span className="sr-only">Query History</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-popover text-popover-foreground border shadow-lg"
            >
              <p className="text-xs">
                History{historyCount > 0 ? ` (${historyCount})` : ""}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Clear */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={clearBlocks}
                disabled={blocks.length === 0}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Clear canvas</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-popover text-popover-foreground border shadow-lg"
            >
              <p className="text-xs">Clear All</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
