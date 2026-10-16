import type { ComponentType } from "react";
import type { IconProps } from "@tabler/icons-react";
import {
  // IconBuildingBank,
  IconCreditCard,
  IconDashboard,
  IconHome,
  IconInfoCircle,
  IconReceipt,
} from "@tabler/icons-react";

export type NavItem = {
  path: string;
  label: string;
  icon: ComponentType<IconProps>;
  isActive: (pathname: string) => boolean;
};

export const NAV_ITEMS: NavItem[] = [
  {
    path: "/",
    label: "Home",
    icon: IconHome,
    isActive: (pathname) => pathname === "/",
  },
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: IconDashboard,
    isActive: (pathname) => pathname.includes("/dashboard"),
  },
  {
    path: "/expenses",
    label: "Expenses",
    icon: IconReceipt,
    isActive: (pathname) => pathname.includes("/expenses"),
  },
  // {
  //   path: "/bank-accounts",
  //   label: "Bank Accounts",
  //   icon: IconBuildingBank,
  //   isActive: (pathname) => pathname.includes("/bank-accounts"),
  // },
  {
    path: "/credit-card",
    label: "Credit Card",
    icon: IconCreditCard,
    isActive: (pathname) => pathname.includes("/credit-card"),
  },
  {
    path: "/about",
    label: "About",
    icon: IconInfoCircle,
    isActive: (pathname) => pathname.includes("/about"),
  },
];
