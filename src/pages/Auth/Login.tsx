import React, { useState } from 'react';
import { Building, Mail, Lock, Bot, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import Card from '../../components/UI/Card';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      let success = false;
      
      if (isSignUp) {
        success = await signUp(email, password, fullName);
        if (success) {
          setError('');
          // Optionally switch to login mode after successful signup
          setIsSignUp(false);
          setPassword('');
          setConfirmPassword('');
          setFullName('');
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className={`
            mx-auto h-20 w-20 bg-gradient-to-r ${theme.primaryGradient} 
            ${theme.borderRadius} flex items-center justify-center shadow-xl
            transform hover:scale-105 transition-all duration-300
          `}>
            <Building size={40} className="text-white" />
          </div>
          <h2 className="mt-6 text-4xl font-bold text-gray-900">
            {isSignUp ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="mt-3 text-lg text-gray-600">
            {isSignUp 
              ? 'Join thousands of businesses using our AI-powered ERP' 
              : 'Sign in to your AI-powered business management system'
            }
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <Bot size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-600">AI-Powered Technology</span>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="p-8 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {/* Full Name Field - Only for Sign Up */}
              {isSignUp && (
                <div className="space-y-2">
                  <FormField
                    label="Full Name"
                    type="text"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Enter your full name"
                    required
                    icon={<User size={18} className="text-gray-400" />}
                  />
                </div>
              )}
              
              {/* Email Field */}
              <div className="space-y-2">
                <FormField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="Enter your email address"
                  required
                  icon={<Mail size={18} className="text-gray-400" />}
                />
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <div className="relative">
                  <FormField
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={setPassword}
                    placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                    required
                    icon={<Lock size={18} className="text-gray-400" />}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {isSignUp && (
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 6 characters long
                  </p>
                )}
              </div>

              {/* Confirm Password Field - Only for Sign Up */}
              {isSignUp && (
                <div className="space-y-2">
                  <div className="relative">
                    <FormField
                      label="Confirm Password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="Confirm your password"
                      required
                      icon={<Lock size={18} className="text-gray-400" />}
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
              <p className="text-sm text-gray-600 mb-3">
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

          {/* Demo Information */}
          {!isSignUp && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-center">
                <p className="text-sm text-blue-800 font-medium mb-1">
                  Demo Access
                </p>
                <p className="text-xs text-blue-600">
                  Use any valid email and password to explore the system
                </p>
              </div>
            </div>
          )}

          {/* Features Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Bot size={16} className="text-green-600" />
                </div>
                <p className="text-xs text-gray-600">AI-Powered</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Building size={16} className="text-blue-600" />
                </div>
                <p className="text-xs text-gray-600">Multi-Company</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By {isSignUp ? 'creating an account' : 'signing in'}, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;