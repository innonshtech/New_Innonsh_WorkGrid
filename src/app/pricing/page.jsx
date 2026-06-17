'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const tiers = [
  {
    name: 'Trial',
    price: 'Free',
    description: '14 days full access to test the platform.',
    features: ['Up to 25 Employees', 'Core HR & Payroll', 'Attendance & Leaves', 'Basic Reporting'],
    missing: ['Priority Support', 'Custom Domain', 'Dedicated Account Manager'],
    cta: 'Start Free Trial',
    href: '/register',
    popular: false,
  },
  {
    name: 'Starter',
    price: '₹999/mo',
    description: 'Perfect for small businesses starting out.',
    features: ['Up to 50 Employees', 'Core HR & Payroll', 'Attendance & Leaves', 'Standard Support'],
    missing: ['Recruitment Module', 'Finance Module', 'Staff Augmentation'],
    cta: 'Get Started',
    href: '/register',
    popular: false,
  },
  {
    name: 'Growth',
    price: '₹2,999/mo',
    description: 'For growing companies with hiring needs.',
    features: ['Up to 200 Employees', 'Everything in Starter', 'Recruitment Module', 'Finance Module', 'Priority Support'],
    missing: ['Staff Augmentation', 'Custom Domain'],
    cta: 'Get Started',
    href: '/register',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '₹9,999/mo',
    description: 'Complete suite for large organizations.',
    features: ['Unlimited Employees', 'Everything in Growth', 'Staff Augmentation', 'API Access', 'Dedicated Account Manager', 'Custom Domain'],
    missing: [],
    cta: 'Contact Sales',
    href: '/register',
    popular: false,
  }
];

export default function PricingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          No hidden fees. No surprise charges. Choose the plan that best fits your company's size and needs.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-4 sm:grid-cols-2">
        {tiers.map((tier, index) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-2xl overflow-hidden bg-white border-2 flex flex-col ${
              tier.popular ? 'border-indigo-600 relative scale-105 z-10' : 'border-transparent'
            }`}
          >
            {tier.popular && (
              <div className="bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider text-center py-1 absolute top-0 w-full">
                Most Popular
              </div>
            )}
            
            <div className={`p-6 ${tier.popular ? 'pt-8' : ''} border-b border-gray-100 flex-1`}>
              <h2 className="text-2xl font-semibold text-gray-900">{tier.name}</h2>
              <p className="mt-2 text-sm text-gray-500 min-h-[40px]">{tier.description}</p>
              <p className="mt-6">
                <span className="text-4xl font-extrabold text-gray-900">{tier.price}</span>
              </p>
              
              <ul className="mt-8 space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="ml-3 text-sm text-gray-700">{feature}</p>
                  </li>
                ))}
                {tier.missing.map((feature) => (
                  <li key={feature} className="flex items-start opacity-50">
                    <div className="flex-shrink-0">
                      <X className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="ml-3 text-sm text-gray-500 line-through">{feature}</p>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-6 bg-gray-50 mt-auto">
              <Link href={tier.href}>
                <button
                  className={`w-full block text-center rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    tier.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-600'
                      : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-gray-50 focus:ring-indigo-500'
                  }`}
                >
                  {tier.cta}
                </button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
