// src/pages/Auth/ResetPassword.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../../components/UI/Card';
import FormField from '../../components/UI/FormField';
import Button from '../../components/UI/Button';
import { useNotification } from '../../contexts/NotificationContext';

function ResetPassword() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    // This effect runs when the component mounts or location changes.
    // It's crucial for handling the redirect from the email link.
    const handleAuthSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If no session, check URL for recovery token
        const params = new URLSearchParams(location.hash.substring(1)); // Parse hash for token
        const accessToken = params.get('access_token');
        const type = params.get('type');

        if (accessToken && type === 'recovery') {
          // Set the session from the URL token
          const { error: setSessionError } = await supabase.auth.setSession({ access_token: accessToken });
          if (setSessionError) {
            console.error('Error setting session from recovery link:', setSessionError);
            setError('Invalid or expired reset link. Please request a new one.');
            showNotification('Invalid or expired reset link. Please request a new one.', 'error');
          } else {
            // Session is now set, user can update password
            showNotification('Please set your new password.', 'info');
          }
        } else {
          // No session and no valid recovery token in URL
          setError('Access denied. Please use the link from your email or request a new reset.');
          showNotification('Access denied. Please use the link from your email or request a new reset.', 'error');
        }
      }
    };

    handleAuthSession();
  }, [location.hash, navigate, showNotification]);

  const validateForm = () => {
    if (!newPassword || !confirmNewPassword) {
      setError('Please fill in all password fields.');
      return false;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return false;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
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
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        setError(updateError.message);
        showNotification(updateError.message, 'error');
      } else {
        showNotification('Password successfully reset! Redirecting to login...', 'success');
        // Clear form and redirect to login
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Unexpected password reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
      showNotification(err.message || 'Failed to reset password. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-850' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'} flex items-center justify-center p-8`}>
      <Card className={`p-8 max-w-md w-full ${theme.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white/90'} backdrop-blur-sm`}>
        <div className="text-center mb-6">
          <Lock size={48} className={`mx-auto mb-4 ${theme.isDark ? 'text-white' : 'text-gray-900'}`} />
          <h2 className={`text-3xl font-bold ${theme.isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            Reset Your Password
          </h2>
          <p className={`text-lg ${theme.isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Enter your new password"
            required
            icon={<Lock size={18} className="text-gray-400" />}
            showToggleVisibility={true}
            onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
            isPasswordVisible={showNewPassword}
          />
          <FormField
            label="Confirm New Password"
            type="password"
            value={confirmNewPassword}
            onChange={setConfirmNewPassword}
            placeholder="Confirm your new password"
            required
            icon={<Lock size={18} className="text-gray-400" />}
            showToggleVisibility={true}
            onToggleVisibility={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
            isPasswordVisible={showConfirmNewPassword}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle size={20} className="text-red-600" />
                <div className="text-red-600 text-sm font-medium">
                  {error}
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 text-lg font-semibold"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Resetting Password...</span>
              </div>
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default ResetPassword;
