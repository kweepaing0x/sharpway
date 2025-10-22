import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Store, Check, MapPin, CreditCard, DollarSign, Shield } from 'lucide-react';
import Button from '../../components/ui/Button';
import MainHeader from '../../components/layout/MainHeader';
import { useAppSettingsStore } from '../../stores/useAppSettingsStore';

const MarketingHomePage: React.FC = () => {
  const { contactLink } = useAppSettingsStore();
  
  return (
    <div className="min-h-screen bg-white">
      <MainHeader />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                The Complete Mall Management Solution
              </h1>
              <p className="text-xl md:text-2xl text-blue-100">
                Your one-stop platform for managing stores, products, and customer orders in a modern shopping mall experience.
              </p>
              <div className="pt-4">
                <a 
                  href={contactLink.startsWith('http') ? contactLink : `https://${contactLink}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button 
                    variant="secondary" 
                    className="mr-4 text-blue-600 bg-white hover:bg-gray-100"
                  >
                    Contact US
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  className="text-white border border-white hover:bg-white/10"
                  onClick={() => window.location.href = '#features'}
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="hidden md:block md:w-1/2">
              <div className="relative ml-10">
                <div className="absolute -left-8 -top-8 w-72 h-72 bg-blue-500 rounded-full opacity-20"></div>
                <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-400 rounded-full opacity-20"></div>
                <div className="relative bg-white rounded-lg shadow-xl p-6 text-gray-900">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Mall Management</h3>
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>Store management</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>Product catalogs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>Order processing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>Multi-payment support</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>Telegram notifications</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Streamline Your Mall Operations
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Our comprehensive set of features helps you manage every aspect of your shopping mall.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {[
              {
                icon: Store,
                title: 'Store Management',
                description: 'Create, manage and track stores across your mall with detailed analytics and reporting.'
              },
              {
                icon: ShoppingBag,
                title: 'Product Catalog',
                description: 'Powerful product management with categories, images, stock tracking and more.'
              },
              {
                icon: MapPin,
                title: 'Location Tracking',
                description: 'Help customers find stores with integrated floor plans and store locations.'
              },
              {
                icon: CreditCard,
                title: 'Multi-Payment Support',
                description: 'Support various payment methods including KPay, USDT, and cash on delivery.'
              },
              {
                icon: DollarSign,
                title: 'Revenue Tracking',
                description: 'Track revenue, commissions, and financial performance across all stores.'
              },
              {
                icon: Shield,
                title: 'Security & Permissions',
                description: 'Role-based access control with detailed audit logging and security features.'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="bg-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="md:flex md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Ready to streamline your mall management?
                </h2>
                <p className="mt-2 text-lg text-gray-600">
                  Get started today and transform your shopping mall experience.
                </p>
              </div>
              <div className="mt-6 md:mt-0">
                <a 
                  href={contactLink.startsWith('http') ? contactLink : `https://${contactLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="primary" className="text-lg px-8 py-3">
                    Contact Us
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Store className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">MyMall</span>
              </div>
              <p className="text-gray-400 max-w-md">
                MyMall provides comprehensive mall management solutions to help retail spaces 
                thrive in today's competitive market.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Reference</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li>
                  <a 
                    href={contactLink.startsWith('http') ? contactLink : `https://${contactLink}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8">
            <p className="text-gray-400 text-center">
              © {new Date().getFullYear()} MyMall. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingHomePage;