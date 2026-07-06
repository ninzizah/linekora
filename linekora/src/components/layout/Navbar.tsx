import { Link } from 'react-router-dom';
import { Shield, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();


  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                <Shield size={24} strokeWidth={2.5} />
              </div>
              <span className="font-sans text-xl font-bold tracking-tight text-gray-900">
                LINEKORA
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden items-center gap-8 md:flex">
            <Link to="/about" className="font-sans text-sm font-medium text-gray-600 hover:text-blue-600">About</Link>
            <Link to="/pricing" className="font-sans text-sm font-medium text-gray-600 hover:text-blue-600">Pricing</Link>
            <Link to="/contact" className="font-sans text-sm font-medium text-gray-600 hover:text-blue-600">Contact</Link>
            <Link to="/scams" className="font-sans text-sm font-medium text-gray-600 hover:text-blue-600">Safety</Link>
            
            {user ? (
              <Link to="/dashboard" className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 font-sans text-sm font-medium text-gray-900 hover:bg-gray-50">
                <User size={16} />
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="font-sans text-sm font-medium text-gray-600 hover:text-blue-600">Log in</Link>
                <Link to="/register" className="rounded-full bg-blue-600 px-6 py-2.5 font-sans text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200">
                  Join LINEKORA
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="border-b border-gray-100 bg-white p-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link to="/about" className="font-sans text-base font-medium text-gray-600">About</Link>
            <Link to="/pricing" className="font-sans text-base font-medium text-gray-600">Pricing</Link>
            <Link to="/contact" className="font-sans text-base font-medium text-gray-600">Contact</Link>
            <Link to="/scams" className="font-sans text-base font-medium text-gray-600">Safety</Link>
            <div className="h-px bg-gray-100" />
            {user ? (
              <Link to="/dashboard" className="font-sans text-base font-medium text-blue-600">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="font-sans text-base font-medium text-gray-600">Log in</Link>
                <Link to="/register" className="rounded-full bg-blue-600 px-6 py-3 text-center font-sans text-base font-bold text-white shadow-lg shadow-blue-200">
                  Join LINEKORA
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
