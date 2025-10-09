"use client";

export default function Footer() {
  return (
    <footer
      className="relative z-10 border-t border-gray-800/50 backdrop-blur-sm"
      data-oid="jacn44a"
    >
      <div className="max-w-7xl mx-auto px-4 py-16" data-oid="ljhdf:t">
        <div className="grid md:grid-cols-4 gap-8 mb-12" data-oid="pajiqbg">
          <div data-oid="cbvgb5r">
            <div
              className="flex items-center space-x-3 mb-6"
              data-oid="ff0:7se"
            >
              <div
                className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white"
                data-oid="m4s4_g:"
              >
                M
              </div>
              <span className="text-xl font-bold text-white" data-oid="vb_5_na">
                MetaMuse
              </span>
            </div>
            <p className="text-gray-400 mb-6" data-oid="kxt0-bw">
              Building the future of AI companions on blockchain technology.
            </p>
            <div className="flex space-x-4" data-oid="oup.8_k">
              {["🐦", "📘", "💼", "📸"].map((emoji, index) => (
                <div
                  key={index}
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                  data-oid=":k08:7:"
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>

          {[
            {
              title: "Product",
              links: ["Features", "Documentation"],
            },
            {
              title: "Resources",
              links: ["Community"],
            },
          ].map((section, index) => (
            <div key={index} data-oid="ep88j3t">
              <h4 className="text-white font-semibold mb-6" data-oid="glrafnv">
                {section.title}
              </h4>
              <ul className="space-y-4" data-oid="deg36jo">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex} data-oid="upc3u5r">
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition-colors"
                      data-oid="91a.f0t"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="pt-8 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center"
          data-oid="pdiw7pd"
        >
          <p className="text-gray-400 mb-4 md:mb-0" data-oid="z64du:q">
            © 2025 MetaMuses. All rights reserved. Built with ❤️ for the
            future.
          </p>
          <div
            className="flex space-x-6 text-gray-400 text-sm"
            data-oid="7p7fi2d"
          >
            <a
              href="#"
              className="hover:text-white transition-colors"
              data-oid="icd9i0h"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="hover:text-white transition-colors"
              data-oid="4qljk5l"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="hover:text-white transition-colors"
              data-oid="wh4.cvh"
            >
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
