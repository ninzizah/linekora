import { Shield, Facebook, Twitter, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Shield size={20} strokeWidth={2.5} />
              </div>
              <span className="font-sans text-lg font-bold tracking-tight text-gray-900">
                LINEKORA
              </span>
            </Link>
            <p className="mt-4 font-sans text-sm text-gray-500 leading-relaxed">
              Find trusted work. Hire trusted people. The secure marketplace for verified talent and tasks.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="https://www.facebook.com/share/18uH4qiqLt/" target="_blank" rel="noopener noreferrer" title="Facebook">
                <Facebook size={20} className="text-gray-400 hover:text-blue-600 cursor-pointer" />
              </a>
              <a href="https://x.com/NdiveLabsLtd" target="_blank" rel="noopener noreferrer" title="Twitter / X">
                <Twitter size={20} className="text-gray-400 hover:text-blue-400 cursor-pointer" />
              </a>
              <a href="https://www.instagram.com/ndivelabs_ltd?igsh=b3AzN295d3RidTJt" target="_blank" rel="noopener noreferrer" title="Instagram">
                <Instagram size={20} className="text-gray-400 hover:text-pink-600 cursor-pointer" />
              </a>
              <a href="https://www.tiktok.com/@ndive.labs.ltd?_r=1&_t=ZS-97fYRgWpgZB" target="_blank" rel="noopener noreferrer" title="TikTok" className="text-gray-400 hover:text-black cursor-pointer transition-colors">
                {/* TikTok inline SVG — not available in lucide-react */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-gray-900">Platform</h3>
            <ul className="mt-4 space-y-2">
              <li><Link to="/register" className="font-sans text-sm text-gray-600 hover:text-blue-600">Find Jobs</Link></li>
              <li><Link to="/register" className="font-sans text-sm text-gray-600 hover:text-blue-600">Hire Workers</Link></li>
              <li><Link to="/register" className="font-sans text-sm text-gray-600 hover:text-blue-600">Get Verified</Link></li>
              <li><Link to="/pricing" className="font-sans text-sm text-gray-600 hover:text-blue-600">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-gray-900">Support</h3>
            <ul className="mt-4 space-y-2">
              <li><Link to="/contact" className="font-sans text-sm text-gray-600 hover:text-blue-600">Help Center</Link></li>
              <li><Link to="/scams" className="font-sans text-sm text-gray-600 hover:text-blue-600">Safety & Scams</Link></li>
              <li><Link to="/contact" className="font-sans text-sm text-gray-600 hover:text-blue-600">Contact Us</Link></li>
              <li><Link to="/about" className="font-sans text-sm text-gray-600 hover:text-blue-600">Verification Fees</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-gray-900">Legal</h3>
            <ul className="mt-4 space-y-2">
              <li><Link to="/legal?tab=privacy" className="font-sans text-sm text-gray-600 hover:text-blue-600">Privacy Policy</Link></li>
              <li><Link to="/legal?tab=terms" className="font-sans text-sm text-gray-600 hover:text-blue-600">Terms of Service</Link></li>
              <li><Link to="/legal?tab=cookies" className="font-sans text-sm text-gray-600 hover:text-blue-600">Cookie Policy</Link></li>
              <li><Link to="/legal?tab=refund" className="font-sans text-sm text-gray-600 hover:text-blue-600">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 border-t border-gray-200 pt-8 text-center">
          <p className="font-sans text-sm text-gray-500">
            © {new Date().getFullYear()} LINEKORA. All rights reserved. Built with trust in East Africa.
          </p>
        </div>
      </div>
    </footer>
  );
}
