import React from "react";
import { Link } from "react-router-dom";
import BrandMark from "../../../../components/shared/BrandMark";

export default function FooterSection() {
  return (
    <footer className="py-10 px-4 border-t border-line/60 bg-n900/45">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-5 md:flex-row md:justify-between md:items-center">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <BrandMark className="w-6 h-6" />
          <span className="font-bold text-text-mid">NexusOne</span>
        </div>

        {/* Copyright */}
        <p className="text-text-dim text-xs text-center order-last md:order-none">
          © {new Date().getFullYear()} NexusOne. All rights reserved.
        </p>

        {/* Links */}
        <div className="flex items-center gap-5 text-sm text-text-dim">
          <Link to="/login" className="hover:text-white transition-colors">Log In</Link>
          <Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link>
          <Link to="#" className="hover:text-white transition-colors">Privacy</Link>
          <Link to="#" className="hover:text-white transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
