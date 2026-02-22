"use client";

import React from "react";

import { Braces, Sun, Moon, Monitor, Eye, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type Theme } from "@/hooks/use-theme";
import { useLocale, type Locale } from "@/hooks/use-locale";

const themeIcons: Record<Theme, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  midnight: Monitor,
  highcontrast: Eye,
};

const localeLabels: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  braille: "Braille",
};

export default function TopNav() {
  const { theme, setTheme, themes } = useTheme();
  const { locale, setLocale } = useLocale();

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-card-foreground hover:bg-secondary/80"
              aria-label="Language"
            >
              <Languages className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="w-40 rounded-xl shadow-xl">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Language
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(["en", "ru", "braille"] as const).map((l) => (
              <DropdownMenuItem
                key={l}
                onClick={() => setLocale(l)}
                className={`rounded-lg py-2 cursor-pointer ${locale === l ? "bg-accent text-accent-foreground" : ""}`}
              >
                <span className="text-[12px] font-medium">{localeLabels[l]}</span>
                {locale === l && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-card-foreground hover:bg-secondary/80"
              aria-label="Switch theme"
            >
              <ActiveIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
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
      </div>
    </header>
  );
}
