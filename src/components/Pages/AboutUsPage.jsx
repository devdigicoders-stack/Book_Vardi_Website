import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Leaf,
  ShieldCheck,
  HeartHandshake,
  Smile,
  ArrowRight,
  Quote,
  CheckCircle2,
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight,
  Heart
} from 'lucide-react';
import {
  InstagramIcon,
  TwitterIcon,
  FacebookIcon
} from '../Common/SocialIcons';
import { ABOUT_DATA } from '../../data/mockData';

const ICON_MAP = {
  Leaf: Leaf,
  Smile: Smile,
  ShieldCheck: ShieldCheck,
  HeartHandshake: HeartHandshake
};

export default function AboutUsPage({ onNavigate }) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [hoveredValue, setHoveredValue] = useState(null);
  const [visibleSections, setVisibleSections] = useState({});

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = document.querySelectorAll('.scroll-reveal-target');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % ABOUT_DATA.testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonial((prev) =>
      prev === 0 ? ABOUT_DATA.testimonials.length - 1 : prev - 1
    );
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb & Hero Banner */}
      <section className="bg-gradient-to-b from-brand-teal via-brand-teal to-brand-teal-dark text-white py-16 lg:py-24 px-4 relative overflow-hidden">
        {/* Decorative Blurred Circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-pink/15 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-white/60 mb-6">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-brand-yellow transition-colors font-medium"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-white font-semibold">About Us</span>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 bg-brand-yellow/20 border border-brand-yellow/40 text-brand-yellow text-xs font-extrabold uppercase px-3 py-1 rounded-full mb-4 tracking-wider">
              <Sparkles size={13} />
              OUR PURPOSE & STORY
            </span>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
              Crafting Joy for Every Classroom &{' '}
              <span className="text-brand-yellow">
                Study Desk.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-white/80 leading-relaxed mt-6">
              {ABOUT_DATA.mission}
            </p>

            <div className="flex items-center gap-4 mt-8 flex-wrap">
              <button
                onClick={() => onNavigate('products')}
                className="inline-flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold px-6 py-3 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 text-sm"
              >
                <span>EXPLORE ALL SUPPLIES</span>
                <ArrowRight size={16} />
              </button>

              <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
                <CheckCircle2 size={16} className="text-brand-yellow" />
                <span>100% Student-Loved Since 2021</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Numbers Bar */}
      <section className="py-12 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {ABOUT_DATA.stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:border-brand-teal/30 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
              >
                <div className="font-display text-3xl sm:text-4xl font-extrabold text-brand-teal group-hover:text-brand-pink transition-colors">
                  {stat.value}
                </div>
                <div className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Brand Story & Timeline */}
      <section
        id="timeline-section"
        className={`py-20 bg-white border-b border-gray-100 scroll-reveal-target transition-all duration-700 ${
          visibleSections['timeline-section'] ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-4'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-pink bg-brand-pink/10 px-3 py-1 rounded-full">
              HOW WE GREW
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-teal tracking-tight mt-3">
              The Journey of Book Vardi
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              From late-night study sessions with leaking pens to supplying over 50,000 students across India.
            </p>
          </div>

          {/* Timeline Container */}
          <div className="relative max-w-4xl mx-auto">
            {/* Center Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-yellow via-brand-pink to-brand-teal transform -translate-x-1/2" />

            <div className="space-y-12">
              {ABOUT_DATA.milestones.map((item, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={idx}
                    className={`flex z-50 flex-col md:flex-row items-center gap-8 ${
                      isEven ? 'md:flex-row-reverse' : ''
                    } group`}
                  >
                    {/* Content Card */}
                    <div className="w-full md:w-1/2">
                      <div className="bg-gray-50 border border-gray-200 group-hover:border-brand-teal/40 group-hover:shadow-xl group-hover:bg-white transition-all duration-300 rounded-2xl p-6 relative">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="bg-brand-yellow/20 text-brand-teal-dark font-extrabold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Calendar size={12} />
                            {item.year}
                          </span>
                          <span className="text-xs font-bold text-gray-400">Milestone #{idx + 1}</span>
                        </div>
                        <h3 className="font-display text-lg font-extrabold text-brand-teal mb-2 group-hover:text-brand-pink transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Timeline Node Dot */}
                    <div className="hidden md:flex w-10 h-10 rounded-full bg-brand-teal text-brand-yellow items-center justify-center font-bold text-xs shadow-md border-4 border-white shrink-0 group-hover:scale-125 group-hover:bg-brand-yellow group-hover:text-brand-teal-dark transition-transform">
                      {idx + 1}
                    </div>

                    {/* Empty spacer for alignment */}
                    <div className="hidden md:block w-1/2" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Core Values Grid */}
      <section
        id="values-section"
        className={`py-20 bg-gray-50/70 border-b border-gray-100 scroll-reveal-target transition-all duration-700 ${
          visibleSections['values-section'] ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-4'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-teal bg-brand-teal/10 px-3 py-1 rounded-full">
              OUR PROMISES
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-teal tracking-tight mt-3">
              Values We Will Never Compromise On
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Every pencil, spiral notebook, and geometry box we ship carries these 4 pillars.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {ABOUT_DATA.values.map((val) => {
              const IconComp = ICON_MAP[val.icon] || Award;
              const isHovered = hoveredValue === val.id;

              return (
                <div
                  key={val.id}
                  onMouseEnter={() => setHoveredValue(val.id)}
                  onMouseLeave={() => setHoveredValue(null)}
                  className={`bg-white border rounded-2xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    isHovered
                      ? 'border-brand-teal shadow-xl -translate-y-2'
                      : 'border-gray-200 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          isHovered
                            ? 'bg-brand-yellow text-brand-teal-dark rotate-6 scale-110'
                            : 'bg-brand-teal/10 text-brand-teal'
                        }`}
                      >
                        <IconComp size={24} />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {val.badge}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-extrabold text-brand-teal mb-2">
                      {val.title}
                    </h3>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      {val.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-1 text-xs font-bold text-brand-teal">
                    <span>Book Vardi Certified</span>
                    <CheckCircle2 size={14} className="text-green-600" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Meet the Creators / Team Showcase */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-ochre bg-brand-ochre/10 px-3 py-1 rounded-full">
              PEOPLE BEHIND THE BRAND
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-teal tracking-tight mt-3">
              Meet the Passionate Team
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Designers, educators, and stationery lovers obsessed with creating the best learning experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {ABOUT_DATA.team.map((member, idx) => (
              <div
                key={idx}
                className={`bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 group ${
                  idx === 2 ? 'sm:col-span-2 md:col-span-1 sm:max-w-sm sm:mx-auto md:max-w-none' : ''
                }`}
              >
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-teal-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <div className="flex items-center gap-2">
                      <a href="#" className="w-8 h-8 rounded-full bg-white text-brand-teal flex items-center justify-center hover:bg-brand-yellow transition-colors">
                        <InstagramIcon size={14} />
                      </a>
                      <a href="#" className="w-8 h-8 rounded-full bg-white text-brand-teal flex items-center justify-center hover:bg-brand-yellow transition-colors">
                        <TwitterIcon size={14} />
                      </a>
                      <a href="#" className="w-8 h-8 rounded-full bg-white text-brand-teal flex items-center justify-center hover:bg-brand-yellow transition-colors">
                        <FacebookIcon size={14} />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <h4 className="font-display text-base font-extrabold text-brand-teal group-hover:text-brand-pink transition-colors">
                    {member.name}
                  </h4>
                  <div className="text-xs font-bold text-brand-ochre mb-2">
                    {member.role}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student & Teacher Testimonials Carousel */}
      <section className="py-20 bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 max-w-3xl text-center">
          <div className="w-12 h-12 rounded-full bg-brand-yellow/20 text-brand-yellow flex items-center justify-center mx-auto mb-6">
            <Quote size={24} />
          </div>

          <div className="min-h-[140px] flex items-center justify-center">
            <p className="font-display text-lg sm:text-xl md:text-2xl font-semibold leading-relaxed italic text-white/95">
              "{ABOUT_DATA.testimonials[activeTestimonial].quote}"
            </p>
          </div>

          <div className="mt-6">
            <div className="font-extrabold text-base text-brand-yellow">
              {ABOUT_DATA.testimonials[activeTestimonial].author}
            </div>
            <div className="text-xs text-white/60 mt-0.5">
              {ABOUT_DATA.testimonials[activeTestimonial].role}
            </div>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={prevTestimonial}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand-yellow hover:text-brand-teal-dark border border-white/20 flex items-center justify-center transition-all"
              aria-label="Previous Testimonial"
            >
              <ChevronLeft size={18} />
            </button>

            {ABOUT_DATA.testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`h-2 rounded-full transition-all ${
                  activeTestimonial === i ? 'w-6 bg-brand-yellow' : 'w-2 bg-white/30'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}

            <button
              onClick={nextTestimonial}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand-yellow hover:text-brand-teal-dark border border-white/20 flex items-center justify-center transition-all"
              aria-label="Next Testimonial"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-brand-yellow/20 via-amber-50 to-pink-50 border border-brand-yellow/40 flex flex-col md:flex-row items-center justify-between gap-8 shadow-md text-center md:text-left">
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-widest text-brand-teal mb-2">
                <Heart size={14} className="text-brand-pink fill-current" />
                JOIN THE LEARNING MOVEMENT
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-teal">
                Ready to Upgrade Your Study & Workspace?
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-xl">
                Explore 32+ non-toxic student notebooks, smooth gel pen sets, and artist sketchpads today.
              </p>
            </div>

            <button
              onClick={() => onNavigate('products')}
              className="inline-flex items-center gap-2 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm shrink-0"
            >
              <span>SHOP ALL PRODUCTS</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
