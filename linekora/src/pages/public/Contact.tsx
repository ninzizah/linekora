import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Phone, Mail, MapPin, MessageSquare } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <h1 className="text-4xl font-black text-gray-900 font-sans tracking-tight mb-6">Get in touch</h1>
            <p className="text-xl text-gray-600 font-sans leading-relaxed mb-12">
              Have questions about verification or payments? Our support team is here to help you 24/7.
            </p>

            <div className="space-y-8">
              <div className="flex items-center gap-6 group">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white shadow-sm">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest font-sans">Phone / WhatsApp</p>
                  <p className="text-lg font-bold text-gray-900 font-sans">
                    <a href="https://wa.me/250783274084" target="_blank" rel="noopener noreferrer" className="hover:underline">+250 783 274 084</a>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 group">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white shadow-sm">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest font-sans">Email Support</p>
                  <p className="text-lg font-bold text-gray-900 font-sans">ndivelabs@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-6 group">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white shadow-sm">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest font-sans">Office Location</p>
                  <p className="text-lg font-bold text-gray-900 font-sans">Kicukiro, Kigali</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-[3rem] p-8 md:p-12 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 font-sans mb-8 flex items-center gap-2">
              <MessageSquare className="text-blue-600" />
              Send us a message
            </h3>
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 font-sans mb-2">First Name</label>
                  <input type="text" className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 outline-none font-sans" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 font-sans mb-2">Last Name</label>
                  <input type="text" className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 outline-none font-sans" placeholder="Doe" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 font-sans mb-2">Subject</label>
                <input type="text" className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 outline-none font-sans" placeholder="Payment Issue" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 font-sans mb-2">Message</label>
                <textarea rows={4} className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 outline-none font-sans resize-none" placeholder="How can we help?"></textarea>
              </div>
              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-sans font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
