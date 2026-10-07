import {
  Briefcase,
  FileText,
  FlaskConical,
  Home,
  Info,
  Megaphone,
  PenLine,
  Search,
  StickyNote,
  Terminal,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Articles", href: "/articles", icon: FileText },
  { label: "Blogs", href: "/blogs", icon: PenLine },
  { label: "Notes", href: "/notes", icon: StickyNote },
  { label: "Posts", href: "/posts", icon: Megaphone },
  { label: "Labs", href: "/labs", icon: FlaskConical },
  { label: "Troubleshooting", href: "/troubleshooting", icon: Wrench },
  { label: "Command Atlas", href: "/commands", icon: Terminal },
  { label: "Interview Prep", href: "/interview", icon: Briefcase },
  { label: "Search", href: "/search", icon: Search },
  { label: "About", href: "/about", icon: Info },
];

export const MAIN_NAV = NAV_ITEMS.slice(0, 9);
export const UTILITY_NAV = NAV_ITEMS.slice(9);
