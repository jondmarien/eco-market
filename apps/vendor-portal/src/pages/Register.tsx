import React from 'react';
import { Link } from 'react-router-dom';

const Register: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-lg bg-vendor-600">
            <span className="text-white font-bold text-xl">V</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Become a Vendor
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join EcoMarket and start selling your products
          </p>
        </div>
        
        <div className="card">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Vendor Registration
            </h3>
            <p className="text-gray-600 mb-6">
              Registration is currently being processed through our business development team.
              Please contact us to get started.
            </p>
            
            <div className="space-y-4">
              <button className="btn-primary w-full">
                📧 Contact Business Development
              </button>
              
              <div className="text-sm text-gray-500">
                <p>Or email us directly at:</p>
                <a href="mailto:vendors@ecomarket.com" className="text-vendor-600 hover:text-vendor-500">
                  vendors@ecomarket.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/login"
            className="font-medium text-vendor-600 hover:text-vendor-500"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
