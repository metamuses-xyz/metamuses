"use client";

import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  const pathname = usePathname();
  const [showSocialsDropdown, setShowSocialsDropdown] = useState(false);
  const [showRewardsDropdown, setShowRewardsDropdown] = useState(false);
  const [showCompanionDropdown, setShowCompanionDropdown] = useState(false);

  const socialsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rewardsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const companionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (socialsTimerRef.current) clearTimeout(socialsTimerRef.current);
      if (rewardsTimerRef.current) clearTimeout(rewardsTimerRef.current);
      if (companionTimerRef.current) clearTimeout(companionTimerRef.current);
    };
  }, []);

  const handleCompanionEnter = () => {
    if (companionTimerRef.current) clearTimeout(companionTimerRef.current);
    setShowCompanionDropdown(true);
  };

  const handleCompanionLeave = () => {
    companionTimerRef.current = setTimeout(() => {
      setShowCompanionDropdown(false);
    }, 500);
  };

  const handleRewardsEnter = () => {
    if (rewardsTimerRef.current) clearTimeout(rewardsTimerRef.current);
    setShowRewardsDropdown(true);
  };

  const handleRewardsLeave = () => {
    rewardsTimerRef.current = setTimeout(() => {
      setShowRewardsDropdown(false);
    }, 500);
  };

  const handleSocialsEnter = () => {
    if (socialsTimerRef.current) clearTimeout(socialsTimerRef.current);
    setShowSocialsDropdown(true);
  };

  const handleSocialsLeave = () => {
    socialsTimerRef.current = setTimeout(() => {
      setShowSocialsDropdown(false);
    }, 500);
  };

  const navItems = [
    // { icon: "🏠", label: "Home", href: "/" },
    { icon: "🎨", label: "Mint Muse AI", href: "/mint" },
  ];

  const companionItems = [
    { icon: "💬", label: "Chat", href: "/chat" },
    { icon: "🔌", label: "Plugins", href: "/plugins" },
  ];

  const rewardsItems = [
    { icon: "🎯", label: "Points", href: "/points" },
    { icon: "🏆", label: "Leaderboard", href: "/leaderboard" },
  ];

  const socialLinks = [
    { icon: "👥", label: "Discord", href: "https://discord.gg/eBrDRvPet2" },
    { icon: "𝕏", label: "X", href: "https://x.com/metamuses_xyz" },
  ];

  return (
    <nav className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto backdrop-blur-sm">
      <Link href="/">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <Image
                src="/metamuses_logo_2.png"
                alt="MetaMuses Logo"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <div className="pulse-ring w-12 h-12 top-0 left-0"></div>
          </div>
          <div>
            <span className="text-2xl font-bold hero-gradient-text">
              MetaMuses
            </span>
          </div>
        </div>
      </Link>

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

        {/* Companion Dropdown */}
        <div
          className="relative"
          onMouseEnter={handleCompanionEnter}
          onMouseLeave={handleCompanionLeave}
        >
          <button
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all hover:bg-white/5 ${
              pathname === "/chat" || pathname === "/plugins"
                ? "text-white bg-white/10"
                : "hover:text-white"
            }`}
          >
            <span>🤖</span>
            <span>Companion</span>
            <span className="text-xs">▼</span>
          </button>

          {showCompanionDropdown && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-lg shadow-xl overflow-hidden">
              {companionItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={index}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                      isActive
                        ? "text-white bg-white/10"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Rewards Dropdown */}
        <div
          className="relative"
          onMouseEnter={handleRewardsEnter}
          onMouseLeave={handleRewardsLeave}
        >
          <button
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all hover:bg-white/5 ${
              pathname === "/points" || pathname === "/leaderboard"
                ? "text-white bg-white/10"
                : "hover:text-white"
            }`}
          >
            <span>🎁</span>
            <span>Rewards</span>
            <span className="text-xs">▼</span>
          </button>

          {showRewardsDropdown && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-lg shadow-xl overflow-hidden">
              {rewardsItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={index}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                      isActive
                        ? "text-white bg-white/10"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Socials Dropdown */}
        <div
          className="relative"
          onMouseEnter={handleSocialsEnter}
          onMouseLeave={handleSocialsLeave}
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
