import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-xl shadow-md border dark:border-gray-700">
      <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">About the Smart Hospital Management System (SHMS)</h1>
      <div className="mt-6 prose prose-lg max-w-none text-gray-600 dark:text-gray-300 dark:prose-invert">
        <p>
          The Smart Hospital Management System (SHMS) is a forward-thinking digital solution meticulously designed to address the critical inefficiencies prevalent in modern hospitals. We tackle challenges such as overcrowded Outpatient Departments (OPDs), cumbersome manual patient admissions, and inefficient inventory tracking head-on.
        </p>
        <p>
          By providing a unified, intelligent platform, SHMS automates key hospital workflows, including queue management, patient triage, and inventory monitoring. Our goal is to create a seamless, efficient, and patient-centric healthcare environment.
        </p>
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mt-8">Key Innovations</h2>
        <ul>
          <li><strong>OPD Module:</strong> We utilize digital tokens coupled with AI-based wait time predictions to intelligently manage patient flow, reduce waiting times, and enhance the patient experience.</li>
          <li><strong>Admission System:</strong> Our system automates the admission process by considering critical factors like patient severity, doctor availability, and real-time bed occupancy, ensuring timely care for those who need it most.</li>
          <li><strong>Inventory Management:</strong> Gain unparalleled visibility into medicine and consumable stocks. Receive automated alerts for low or expired items and leverage machine learning for predictive restocking, preventing stockouts and reducing waste.</li>
          <li><strong>Analytics Dashboard:</strong> Our powerful dashboard offers real-time insights into patient flow, resource utilization, and overall hospital operations, empowering administrators to make data-driven decisions.</li>
        </ul>
        <p>
          Built with cutting-edge technologies like React.js and designed for interoperability with national digital health networks through FHIR-compliant APIs, SHMS is a scalable, robust, and impactful solution poised to redefine hospital efficiency and the quality of patient care delivery.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
