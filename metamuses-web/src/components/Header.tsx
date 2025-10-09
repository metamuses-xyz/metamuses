"use client";

import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { icon: "🏠", label: "Home", href: "/" },
    { icon: "🎨", label: "Mint Muse AI", href: "/mint" },
  ];

  return (
    <nav
      className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto backdrop-blur-sm"
      data-oid="38pil4q"
    >
      <div className="flex items-center space-x-3" data-oid="qs-a-g3">
        <div className="relative" data-oid="vtrmw65">
          <div
            className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
            data-oid="wsx7v5k"
          >
            M
          </div>
          <div
            className="pulse-ring w-12 h-12 top-0 left-0"
            data-oid="j3dl.yi"
          ></div>
        </div>
        <div data-oid="ji.efyf">
          <span
            className="text-2xl font-bold hero-gradient-text"
            data-oid="5nidb7t"
          >
            MetaMuses
          </span>
        </div>
      </div>

      <div
        className="hidden lg:flex items-center space-x-8 text-gray-300 font-medium"
        data-oid="ylow.6o"
      >
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={index}
              href={item.href}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all hover:bg-white/5 ${
                isActive ? "text-white bg-white/10" : "hover:text-white"
              }`}
              data-oid="04wo6pm"
            >
              <span data-oid="zvqht6t">{item.icon}</span>
              <span data-oid="eaor_yd">{item.label}</span>
            </a>
          );
        })}
      </div>

      <ConnectButton data-oid="phpj1v5" />
    </nav>
  );
}
