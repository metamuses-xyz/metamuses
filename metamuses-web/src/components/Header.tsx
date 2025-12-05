"use client";

import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [showSocialsDropdown, setShowSocialsDropdown] = useState(false);

  const navItems = [
    { icon: "🏠", label: "Home", href: "/" },
    { icon: "🎨", label: "Mint Muse AI", href: "/mint" },
    { icon: "💬", label: "Chat", href: "/chat" },
    { icon: "🔌", label: "Plugins", href: "/plugins" },
  ];

  const socialLinks = [
    { icon: "👥", label: "Discord", href: "https://discord.gg/eBrDRvPet2" },
    { icon: "𝕏", label: "X", href: "https://x.com/metamuses_xyz" },
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

        {/* Socials Dropdown */}
        <div
          className="relative"
          onMouseEnter={() => setShowSocialsDropdown(true)}
          onMouseLeave={() => setShowSocialsDropdown(false)}
        >
          <button className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all hover:bg-white/5 hover:text-white">
            <span>🌐</span>
            <span>Socials</span>
            <span className="text-xs">▼</span>
          </button>

          {showSocialsDropdown && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-lg shadow-xl overflow-hidden">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
                >
                  <span>{social.icon}</span>
                  <span>{social.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConnectButton />
    </nav>
  );
}
