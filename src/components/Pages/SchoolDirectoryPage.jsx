import React from 'react';
import { ArrowRight, School as SchoolIcon } from 'lucide-react';
import { KIT_BUNDLES } from '../../data/mockData';

export default function SchoolDirectoryPage({ onNavigate }) {
  // Extract unique schools from KIT_BUNDLES
  const uniqueSchools = [...new Set(KIT_BUNDLES.map(kit => kit.school))].sort();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Banner */}
      <div className="bg-brand-teal text-white py-12 px-4 border-b border-white/10 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-yellow/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
            School Directory
          </h1>
          <p className="text-white/80 max-w-xl mx-auto">
            Select your school to view customized uniform sets, book bundles, and other specific assets tailored for you.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {uniqueSchools.map((school) => {
            const kitForSchool = KIT_BUNDLES.find(k => k.school === school);
            
            return (
              <button
                key={school}
                className="group flex flex-col items-center bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-teal/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer text-center"
                onClick={() => onNavigate('school-details', school)}
              >
                <div className="w-24 h-24 rounded-full overflow-hidden mb-6 border-2 border-gray-100 group-hover:border-brand-yellow group-hover:ring-4 group-hover:ring-brand-yellow/20 transition-all bg-gray-50 shadow-xs flex items-center justify-center">
                  {kitForSchool && kitForSchool.image ? (
                     <img
                       src={kitForSchool.image}
                       alt={school}
                       className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                       loading="lazy"
                     />
                  ) : (
                     <SchoolIcon size={40} className="text-gray-400 group-hover:text-brand-teal transition-colors" />
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-brand-teal transition-colors">
                  {school}
                </h3>
                <div className="inline-flex items-center gap-1 text-sm font-bold text-brand-teal bg-brand-teal/5 group-hover:bg-brand-teal group-hover:text-white px-4 py-2 rounded-lg transition-colors mt-auto">
                  <span>View All Assets</span>
                  <ArrowRight size={16} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
