import React, { useState } from 'react';
import { Camera, Wallet, Zap } from 'lucide-react';
import { Budget } from '../types';

interface OnboardingFlowProps {
  onComplete: (budgets: Omit<Budget, 'id' | 'spent'>[]) => void;
}

export const SUGGESTED_BUDGETS: Omit<Budget, 'id' | 'spent'>[] = [
  { name: 'Groceries', budget: 2500 },
  { name: 'Takeaways', budget: 1200 },
  { name: 'Shopping', budget: 1500 },
  { name: 'Petrol & Transport', budget: 1800 },
  { name: 'Airtime & Data', budget: 500 },
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [budgets, setBudgets] = useState(SUGGESTED_BUDGETS);

  const steps = [
    {
      title: "Welcome to Balance",
      subtitle: "Your financial companion",
      content: (
        <div className="text-center space-y-8">
          <div className="w-20 h-20 mx-autorounded-full">
            <Zap className="w-10 h-10" />
          </div>
          <div className="">
            <h3 className="nedbank-text-large">Track → Balance → Thrive</h3>
            <p className="text-gray-500 nedbank-text-base leading-relaxed">
              Add expenses manually to track spending. When you go over, we'll help you rebalance instantly.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "How It Works",
      subtitle: "Three simple steps",
      content: (
        <div className="">
          <div className="nedbank-card">
            <div className="items-start space-x-4">
              <div className="w-10 h-10rounded-fullflex-shrink-0">
                <span className="text-sm font-medium">1</span>
              </div>
              <div>
                <h4 className="font-mediummb-2">Add Your Expenses</h4>
                <p className="text-gray-500 text-sm">Manually enter your purchases with merchant name, amount, and category.</p>
              </div>
            </div>
          </div>
          
          <div className="nedbank-card">
            <div className="items-start space-x-4">
              <div className="w-10 h-10rounded-fullflex-shrink-0">
                <span className="text-sm font-medium">2</span>
              </div>
              <div>
                <h4 className="font-mediummb-2">Track Your Spending</h4>
                <p className="text-gray-500 text-sm">Monitor your progress across categories with real-time budget tracking.</p>
              </div>
            </div>
          </div>
          
          <div className="nedbank-card">
            <div className="items-start space-x-4">
              <div className="w-10 h-10rounded-fullflex-shrink-0">
                <span className="text-sm font-medium">3</span>
              </div>
              <div>
                <h4 className="font-mediummb-2">Stay Balanced</h4>
                <p className="text-gray-500 text-sm">When you exceed a budget, easily rebalance across other categories.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Set Your Budgets",
      subtitle: "Customize your monthly spending limits",
      content: (
        <div className="">
          <p className="text-gray-500 text-center text-sm mb-8">
            Set your monthly budgets for spending categories. You can adjust these anytime.
          </p>
          
          <div className="">
            {budgets.map((budget, index) => (
              <div key={index} className="nedbank-card">
                <div className="">
                  <span className="font-medium">{budget.name}</span>
                  <div className="px-3 py-2">
                    <span className="text-gray-500 mr-2">R</span>
                    <nedbank-input
                      type="number"
                      value={budget.budget}
                      onChange={(e) => {
                        const newBudgets = [...budgets];
                        newBudgets[index] = { ...newBudgets[index], budget: parseInt(e.target.value) || 0 };
                        setBudgets(newBudgets);
                      }}
                      className="w-20 text-right bg-transparent-none focus:outline-none font-light"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(budgets);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="-1 flexpx-4 py-12">
        <div className="max-w-sm mx-auto w-full">
          {/* Progress Indicators */}
          <div className="space-x-2 mb-12">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep 
                    ? 'bg-gray-900' 
                    : index < currentStep 
                    ? 'bg-gray-600' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="text-center mb-8">
            <h1 className="nedbank-text-large mb-2">
              {steps[currentStep].title}
            </h1>
            <p className="text-gray-500 text-sm">
              {steps[currentStep].subtitle}
            </p>
          </div>

          <div className="mb-12">
            {steps[currentStep].content}
          </div>

          {/* Navigation */}
          <div className="">
            <button
              onClick={handlePrev}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={currentStep === 0}
            >
              Back
            </button>
            
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-teal-600font-mediumhover:from-blue-600 hover:to-teal-700 transition-all transform hover:scale-105"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
