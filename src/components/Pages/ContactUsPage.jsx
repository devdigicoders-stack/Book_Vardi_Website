import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function ContactUsPage() {
  const { isAuthenticated, userProfile, addToast } = useCart();
  const [formData, setFormData] = useState({
    name: isAuthenticated ? userProfile?.name || '' : '',
    email: isAuthenticated ? userProfile?.email || '' : '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      addToast('Message sent successfully! We will get back to you soon.', 'success');
      setFormData((prev) => ({ ...prev, subject: '', message: '' })); // clear just the message parts
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Banner */}
      <div className="bg-brand-teal text-white py-12 px-4 border-b border-white/10 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-yellow/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
            Get In Touch
          </h1>
          <p className="text-white/80 max-w-xl mx-auto text-sm sm:text-base">
            Have a question about your order, our products, or want to partner with us? We'd love to hear from you.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 mt-10 md:mt-14">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          
          {/* Contact Details (Left) */}
          <div className="w-full md:w-1/3 space-y-6 md:space-y-8">
            <div>
              <h3 className="font-display text-xl font-extrabold text-brand-teal mb-4 uppercase tracking-wider">
                Contact Information
              </h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Fill out the form and our team will get back to you within 24 hours. For urgent queries, please call us.
              </p>
            </div>
            
            <div className="space-y-5">
              <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Call Us</h4>
                  <p className="text-sm font-bold text-gray-900">+91 98765 43210</p>
                  <p className="text-xs text-gray-500 mt-0.5">Mon - Sat, 9am to 6pm</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-brand-pink/10 text-brand-pink flex items-center justify-center shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email Us</h4>
                  <p className="text-sm font-bold text-gray-900">support@bookvardi.in</p>
                  <p className="text-xs text-gray-500 mt-0.5">We reply within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-brand-yellow/20 text-brand-teal flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Head Office</h4>
                  <p className="text-sm font-bold text-gray-900 leading-relaxed">
                    Book Vardi Tower, Sector 14,<br />
                    Gurugram, Haryana 122001
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form (Right) */}
          <div className="w-full md:w-2/3">
            <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl shadow-brand-teal/5 border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <MessageCircle className="text-brand-yellow" size={24} />
                <h2 className="font-display text-2xl font-extrabold text-brand-teal">Send us a Message</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Jane Doe"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="jane@example.com"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="subject" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="How can we help you?"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    placeholder="Write your message here..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all resize-y"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-brand-teal hover:bg-brand-teal-light text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
