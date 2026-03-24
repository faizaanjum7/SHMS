import React from 'react';
import { Link } from 'react-router-dom';
import AIAssistant from '../components/AIAssistant';
import { TESTIMONIALS } from '../constants';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
    <p className="mt-2 text-gray-500 dark:text-gray-400">{description}</p>
  </div>
);

interface QuickAccessCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ icon, title, description, link }) => (
    <Link to={link} className="block bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all duration-300 border dark:border-gray-700 text-center">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mx-auto mb-4">
            {icon}
        </div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">{description}</p>
    </Link>
)

interface HowItWorksStepProps {
    step: string;
    title: string;
    description: string;
}

const HowItWorksStep: React.FC<HowItWorksStepProps> = ({ step, title, description }) => (
    <div className="flex items-start">
        <div className="flex-shrink-0 flex flex-col items-center mr-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold text-xl">
                {step}
            </div>
        </div>
        <div>
            <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h4>
            <p className="mt-1 text-gray-500 dark:text-gray-400">{description}</p>
        </div>
    </div>
);


interface TestimonialCardProps {
  quote: string;
  name: string;
  location: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, name, location }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border dark:border-gray-700 relative">
     <svg className="absolute top-4 left-4 w-10 h-10 text-emerald-100 dark:text-emerald-900" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M9.333 8h-2.667v-2.667c0-2.933 2.3-5.333 5.167-5.333h.167v2.667h-.167c-1.467 0-2.5 1.1-2.5 2.667v2.667zM25.333 8h-2.667v-2.667c0-2.933 2.3-5.333 5.167-5.333h.167v2.667h-.167c-1.467 0-2.5 1.1-2.5 2.667v2.667zM28 10.667h-12c-1.467 0-2.667 1.2-2.667 2.667v8c0 1.467 1.2 2.667 2.667 2.667h12c1.467 0 2.667-1.2 2.667-2.667v-8c0-1.467-1.2-2.667-2.667-2.667zM12 10.667h-8c-1.467 0-2.667 1.2-2.667 2.667v8c0 1.467 1.2 2.667 2.667 2.667h8c1.467 0 2.667-1.2 2.667-2.667v-8c0-1.467-1.2-2.667-2.667-2.667z" />
    </svg>
    <p className="relative text-gray-600 dark:text-gray-300 italic">"{quote}"</p>
    <div className="mt-4 text-right">
      <p className="font-bold text-gray-800 dark:text-gray-100">{name}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{location}</p>
    </div>
  </div>
);


const HomePage: React.FC = () => {
  const features = [
    {
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
      title: 'Smart Queue Management',
      description: 'Digital tokens and AI-based wait time predictions to reduce overcrowding in OPDs.',
    },
    {
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
      title: 'Automated Admissions',
      description: 'Streamlined patient admissions based on severity, doctor availability, and bed occupancy.',
    },
    {
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7s-1 1-1 4m18-4s1 1 1 4"></path></svg>,
      title: 'Real-Time Inventory',
      description: 'Track medicine and consumables with alerts for low stock and predictive restocking.',
    },
  ];

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-gray-900 dark:to-slate-800 rounded-3xl p-8 md:p-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 dark:text-gray-100 leading-tight">
              Smarter Healthcare,
              <br/>
              <span className="text-emerald-600 dark:text-emerald-400">Simplified for You.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto md:mx-0">
              A unified platform to streamline hospital workflows, enhance patient care, and improve operational efficiency.
            </p>
            <div className="mt-10">
              <Link
                to="/book-appointment"
                className="inline-block px-8 py-4 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-700 transition-transform transform hover:scale-105 duration-300 shadow-lg"
              >
                Book an Appointment Now
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
             <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path fill="#10B981" d="M48.4,-58.8C63.2,-48.9,76.2,-35.1,81.1,-19.1C86,-3.1,82.8,15,73.1,28.8C63.4,42.6,47.2,52.1,31.2,59.3C15.1,66.5,-0.7,71.4,-16.8,68.4C-32.9,65.4,-49.3,54.5,-60,40.1C-70.8,25.7,-75.9,7.8,-73.9,-9.2C-71.9,-26.1,-62.8,-42.1,-50.2,-52.5C-37.6,-62.9,-21.5,-67.7,-5,-66.2C11.5,-64.7,23.1,-56.9,33.5,-52.7C43.9,-48.5,53.2,-47.9,48.4,-58.8Z" transform="translate(100 100) scale(1.1)" className="opacity-20 dark:opacity-10" />
                <g transform="translate(50 50)" className="text-emerald-500">
                    <path d="M60,0 L60,0 C60,22.09139 46.5685425,40 30,40 L0,40" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"></path>
                    <path d="M0,60 L0,60 C22.09139,60 40,46.5685425 40,30 L40,0" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" transform="translate(40, 40) rotate(180)"></path>
                    <circle cx="50" cy="50" r="4" fill="currentColor"></circle>
                    <line x1="50" y1="20" x2="50" y2="35" stroke="currentColor" strokeWidth="4" strokeLinecap="round"></line>
                    <line x1="80" y1="50" x2="65" y2="50" stroke="currentColor" strokeWidth="4" strokeLinecap="round"></line>
                    <text x="35" y="65" fontFamily="Arial" fontSize="40" fontWeight="bold" fill="currentColor">+</text>
                </g>
             </svg>
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 -mt-24 md:-mt-32 relative z-10 px-4">
          <QuickAccessCard 
              icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>}
              title="Find a Doctor"
              description="Search our directory of top specialists."
              link="/doctors"
          />
           <QuickAccessCard 
              icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>}
              title="View Hospitals"
              description="Explore our state-of-the-art facilities."
              link="/hospitals"
          />
           <QuickAccessCard 
              icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>}
              title="Check Symptoms"
              description="Use our AI to find the right department."
              link="#ai-assistant"
          />
      </section>

      {/* How It Works Section */}
      <section>
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">Booking in 3 Easy Steps</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mt-2">Get medical care quickly and efficiently.</p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
              <HowItWorksStep step="1" title="Find Your Doctor" description="Use filters to find the perfect specialist for your needs." />
              <HowItWorksStep step="2" title="Select a Timeslot" description="Choose a convenient date and time from the doctor's schedule." />
              <HowItWorksStep step="3" title="Confirm & Visit" description="Book your slot instantly and get ready for your visit." />
          </div>
      </section>
      
      {/* Features Section */}
      <section>
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">Our Core Features</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mt-2">Powering the future of hospital operations.</p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section>
         <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">What Our Patients Say</h2>
         <p className="text-center text-gray-500 dark:text-gray-400 mt-2">Real stories from people we've helped.</p>
         <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TESTIMONIALS.map(testimonial => (
              <TestimonialCard key={testimonial.name} {...testimonial} />
            ))}
         </div>
      </section>

      {/* AI Assistant Section */}
      <section id="ai-assistant">
        <AIAssistant />
      </section>
    </div>
  );
};

export default HomePage;
