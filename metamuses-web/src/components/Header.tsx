"use client";

import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { icon: "🏠", label: "Home", href: "/" },
    { icon: "🎨", label: "Mint Muse AI", href: "/mint" },
    { icon: "💬", label: "Chat", href: "/chat" },
    // { icon: "📊", label: "Dashboard", href: "/dashboard" },
  ];

  return (
    <nav className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto backdrop-blur-sm">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
            M
          </div>
          <div className="pulse-ring w-12 h-12 top-0 left-0"></div>
        </div>
        <div>
          <span className="text-2xl font-bold hero-gradient-text">
            MetaMuses
          </span>
        </div>
      </div>

      <div className="hidden lg:flex items-center space-x-8 text-gray-300 font-medium">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={index}
              href={item.href}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all hover:bg-white/5 ${
                isActive ? "text-white bg-white/10" : "hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>

      <ConnectButton />
    </nav>
  );
}
