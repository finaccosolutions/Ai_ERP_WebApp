// src/pages/Auth/Login.tsx
import React, { useState } from 'react';
import { Building, Mail, Lock, Bot, User, Eye, EyeOff, Phone, Globe, CheckCircle } from 'lucide-react'; // Import CheckCircle
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import Card from '../../components/UI/Card';

const countries = [
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' }, // India as default
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', dialCode: '+971' },
];

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default to India
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false); // Renamed for clarity
  const [showConfirmPasswordText, setShowConfirmPasswordText] = useState(false); // Renamed for clarity
  const [showVerificationMessage, setShowVerificationMessage] = useState(false); // New state for verification message
  
  const { login, signUp } = useAuth();
  const { theme } = useTheme();

  const validateForm = () => {
    if (!email || !password) {
      setError('Please fill in all required fields');
      return false;
    }

    if (isSignUp) {
      if (!fullName) {
        setError('Please enter your full name');
        return false;
      }
      if (!mobile) {
        setError('Please enter your mobile number');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowVerificationMessage(false); // Hide verification message on new submission

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      let success = false;
      
      if (isSignUp) {
        success = await signUp(email, password, fullName, mobile);
        if (success) {
          setError('');
          setShowVerificationMessage(true); // Show verification message
          // Clear form fields after successful sign-up
          setPassword('');
          setConfirmPassword('');
          setFullName('');
          setMobile('');
          // Optionally switch to login mode after successful sign-up
          setIsSignUp(false);
        } else {
          setError('Sign up failed. Please try again.');
        }
      } else {
        success = await login(email, password);
        if (!success) {
          setError('Invalid email or password. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || (isSignUp ? 'Sign up failed. Please try again.' : 'Login failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setShowVerificationMessage(false); // Hide verification message when switching modes
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setMobile('');
    setEmail(''); // Clear email when switching modes
  };

  return (
    <div className={`min-h-screen ${theme.isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-850' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'} flex`}>
      {/* Left Side - Information */}
      <div className={`hidden lg:flex lg:w-1/2 ${theme.isDark ? 'bg-gray-800' : 'bg-white'} flex-col justify-center px-12`}>
        <div className="max-w-md">
          <div className={`
            h-16 w-16 bg-gradient-to-r ${theme.primaryGradient}
            ${theme.borderRadius} flex items-center justify-center shadow-xl mb-8
            transform hover:scale-105 transition-transform duration-300
          `}>
            <Building size={32} className="text-white" />
          </div>
          
          <h1 className={`text-4xl font-bold ${theme.isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
            Welcome to ERP Pro
          </h1>
          
          <p className={`text-lg ${theme.isDark ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
            The most advanced AI-powered business management system designed for global enterprises.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className={`
                p-2 bg-gradient-to-r ${theme.primaryGradient} rounded-lg
                transform hover:scale-110 transition-transform duration-300
              `}>
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className={`font-semibold ${theme.isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                  AI-Powered Intelligence
                </h3>
                <p className={`text-sm ${theme.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Smart automation and predictive analytics for better business decisions
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className={`
                p-2 bg-gradient-to-r ${theme.primaryGradient} rounded-lg
                transform hover:scale-110 transition-transform duration-300
              `}>
                <Globe size={20} className="text-white" />
              </div>
              <div>
                <h3 className={`font-semibold ${theme.isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                  Global Multi-Country Support
                </h3>
                <p className={`text-sm ${theme.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Manage businesses across multiple countries with localized compliance
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className={`
                p-2 bg-gradient-to-r ${theme.primaryGradient} rounded-lg
                transform hover:scale-110 transition-transform duration-300
              `}>
                <Building size={20} className="text-white" />
              </div>
              <div>
                <h3 className={`font-semibold ${theme.isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                  Complete Business Suite
                </h3>
                <p className={`text-sm ${theme.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Sales, Purchase, Inventory, Accounting, HR, CRM, and Manufacturing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          {/* Mobile Header */}
          <div className="lg:hidden text-center">
            <div className={`
              mx-auto h-16 w-16 bg-gradient-to-r ${theme.primaryGradient}
              ${theme.borderRadius} flex items-center justify-center shadow-xl mb-4
            `}>
              <Building size={32} className="text-white" />
            </div>
            <h2 className={`text-3xl font-bold ${theme.isDark ? 'text-white' : 'text-gray-900'}`}>
              ERP Pro
            </h2>
          </div>

          {/* Form Header */}
          <div className="text-center">
            <h2 className={`text-3xl font-bold ${theme.isDark ? 'text-white' : 'text-gray-900'}`}>
              {isSignUp ? 'Create Your Account' : 'Welcome Back'}
            </h2>
            <p className={`mt-2 text-lg ${theme.isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {isSignUp 
                ? 'Join thousands of businesses worldwide' 
                : 'Sign in to your business management system'
              }
            </p>
          </div>

          {/* Main Form Card */}
          <Card className={`p-8 ${theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white/90'} backdrop-blur-sm`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                {/* Full Name Field - Only for Sign Up */}
                {isSignUp && (
                  <FormField
                    label="Full Name"
                    type="text"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Enter your full name"
                    required
                    icon={<User size={18} className="text-gray-400" />}
                  />
                )}
                
                {/* Email Field */}
                <FormField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="Enter your email address"
                  required
                  icon={<Mail size={18} className="text-gray-400" />}
                />

                {/* Mobile Number Field - Only for Sign Up */}
                {isSignUp && (
                  <div className="space-y-2">
                    <label className={`block text-sm font-medium ${theme.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch">
                      {/* Country Selector */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className={`
                            flex items-center space-x-2 px-3 py-2.5 border border-gray-300
                            ${theme.borderRadius} border-r-0 rounded-r-none
                            ${theme.isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent h-full
                          `}
                        >
                          <span className="text-lg">{selectedCountry.flag}</span>
                          <span className="text-sm">{selectedCountry.dialCode}</span>
                        </button>
                        
                        {showCountryDropdown && (
                          <div className={`
                            absolute top-full left-0 mt-1 w-64 ${theme.isDark ? 'bg-gray-700' : 'bg-white'} 
                            border ${theme.isDark ? 'border-gray-600' : 'border-gray-300'} 
                            ${theme.borderRadius} ${theme.shadowLevel} z-50 max-h-60 overflow-y-auto
                          `}>
                            {countries.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(country);
                                  setShowCountryDropdown(false);
                                }}
                                className={`
                                  w-full px-3 py-2 text-left hover:bg-gray-100 
                                  ${theme.isDark ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100'}
                                  flex items-center space-x-3
                                `}
                              >
                                <span className="text-lg">{country.flag}</span>
                                <span className="text-sm">{country.dialCode}</span>
                                <span className="text-sm">{country.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Mobile Input */}
                      <div className="relative flex-1">
                        <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="Enter mobile number"
                          required
                          className={`
                            w-full pl-10 pr-3 py-2.5 border border-gray-300
                            ${theme.borderRadius} rounded-l-none border-l-0 h-full
                            ${theme.isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          `}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Password Field */}
                <div className="space-y-2">
                  <FormField
                    label="Password"
                    type="password" // Set type to password, visibility handled by FormField
                    value={password}
                    onChange={setPassword}
                    placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                    required
                    icon={<Lock size={18} className="text-gray-400" />}
                    showToggleVisibility={true} // Enable toggle
                    onToggleVisibility={() => setShowPasswordText(!showPasswordText)}
                    isPasswordVisible={showPasswordText}
                  />
                  {isSignUp && (
                    <p className={`text-xs ${theme.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Password must be at least 6 characters long
                    </p>
                  )}
                </div>

                {/* Confirm Password Field - Only for Sign Up */}
                {isSignUp && (
                  <div className="space-y-2">
                    <FormField
                      label="Confirm Password"
                      type="password" // Set type to password, visibility handled by FormField
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="Confirm your password"
                      required
                      icon={<Lock size={18} className="text-gray-400" />}
                      showToggleVisibility={true} // Enable toggle
                      onToggleVisibility={() => setShowConfirmPasswordText(!showConfirmPasswordText)}
                      isPasswordVisible={showConfirmPasswordText}
                    />
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="text-red-600 text-sm font-medium">
                      {error}
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Message */}
              {showVerificationMessage && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={20} className="text-green-600" />
                    <div className="text-green-600 text-sm font-medium">
                      Verification email sent to <span className="font-bold">{email}</span>. Please check your inbox.
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 text-lg font-semibold"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                  </div>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>

            {/* Switch Mode Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className={`text-sm ${theme.isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </p>
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors duration-200 hover:underline"
                >
                  {isSignUp ? 'Sign In Here' : 'Create Account'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Login;
