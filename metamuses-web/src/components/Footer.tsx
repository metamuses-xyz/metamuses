"use client";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-gray-800/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white">
                M
              </div>
              <span className="text-xl font-bold text-white">MetaMuse</span>
            </div>
            <p className="text-gray-400 mb-6">
              Building the future of AI companions on blockchain technology.
            </p>
            {/*<div className="flex space-x-4">
              {["🐦", "📘", "💼", "📸"].map((emoji, index) => (
                <div
                  key={index}
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                >
                  {emoji}
                </div>
              ))}
            </div>*/}
          </div>

          {[
            {
              title: "Product",
              links: [
                { name: "Features", href: "#" },
                {
                  name: "Documentation",
                  href: "http://metamuses.gitbook.io/docs/",
                  external: true,
                },
              ],
            },
            {
              title: "Resources",
              links: [
                // { name: "Community", href: "#" },
                {
                  name: "Discord",
                  href: "https://discord.gg/EN58SSmF",
                  external: true,
                },
              ],
            },
          ].map((section, index) => (
            <div key={index}>
              <h4 className="text-white font-semibold mb-6">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">
            © 2025 MetaMuses. All rights reserved. Built with ❤️ for the
            future.
          </p>
          <div className="flex space-x-6 text-gray-400 text-sm">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
