// Single icon system for the whole app, backed by lucide-react.
// Use <Icon name="trophy" /> everywhere instead of emoji so glyphs render
// crisply and consistently. Names are semantic; map them to lucide here.
import {
  Home, Compass, Coins, Users, LayoutGrid, Inbox, BarChart3, Store, Zap, Trophy,
  BookUser, CreditCard, Wand2, LogOut, MoreHorizontal, Gift, Ticket, Settings,
  Medal, Sparkles, PiggyBank, Bot, Heart, HandHeart, MapPin, Map as MapIcon, Phone,
  Lock, Check, X, ShoppingBag, Building2, ChevronLeft, ChevronRight, ChevronDown, Flower2,
  Dumbbell, UtensilsCrossed, Stethoscope, Plane, BookOpen, Drama, Smartphone, Clock,
} from "lucide-react";

type IconCmp = React.ComponentType<{ size?: number | string; className?: string; strokeWidth?: number | string }>;

const ICONS = {
  // nav / shell
  home: Home, discover: Compass, coin: Coins, team: Users, grid: LayoutGrid,
  inbox: Inbox, chart: BarChart3, people: Users, store: Store, bolt: Zap,
  trophy: Trophy, passport: BookUser, card: CreditCard, genie: Wand2,
  logout: LogOut, more: MoreHorizontal,
  // content
  gift: Gift, ticket: Ticket, settings: Settings, medal: Medal, sparkles: Sparkles,
  piggy: PiggyBank, bot: Bot, heart: Heart, kudos: HandHeart, pin: MapPin,
  map: MapIcon, phone: Phone, lock: Lock, check: Check, x: X, shopping: ShoppingBag,
  building: Building2, chevronLeft: ChevronLeft, chevronRight: ChevronRight, chevronDown: ChevronDown, clock: Clock,
  // passport / offer categories
  wellness: Flower2, fitness: Dumbbell, food: UtensilsCrossed, health: Stethoscope,
  travel: Plane, learning: BookOpen, culture: Drama, telecom: Smartphone,
} satisfies Record<string, IconCmp>;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 24,
  className,
  strokeWidth = 1.8,
}: {
  name: IconName | (string & {});
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const Cmp: IconCmp = ICONS[name as IconName] ?? LayoutGrid;
  return <Cmp size={size} className={className} strokeWidth={strokeWidth} />;
}
