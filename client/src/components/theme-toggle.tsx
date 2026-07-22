import { Check, Laptop, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
          title="Alterar tema"
          data-testid="button-theme-toggle"
        >
          {resolvedTheme === "light" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-xl p-1.5">
        <DropdownMenuItem onClick={() => setTheme("light")} data-testid="menu-theme-light">
          <Sun aria-hidden="true" />
          Claro
          {theme === "light" && <Check className="ml-auto" aria-hidden="true" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} data-testid="menu-theme-dark">
          <Moon aria-hidden="true" />
          Escuro
          {theme === "dark" && <Check className="ml-auto" aria-hidden="true" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} data-testid="menu-theme-system">
          <Laptop aria-hidden="true" />
          Sistema
          {theme === "system" && <Check className="ml-auto" aria-hidden="true" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
