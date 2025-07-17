// src/pages/User/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Image, Save, Upload, Edit, Briefcase, CreditCard, Building, Lock, Eye, EyeOff } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FormField from '../../components/UI/FormField';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../contexts/NotificationContext';

interface ProfilePageProps {
  activeSection: string; // e.g., 'profile-personal', 'profile-password'
}

function ProfilePage({ activeSection }: ProfilePageProps) {
  const { theme } = useTheme();
  const { user, updateUser, hasPermission } = useAuth();
  const { showNotification } = useNotification();

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [department, setDepartment] = useState(user?.department || ''); // Assuming department is part of user object
  const [designation, setDesignation] = useState(user?.designation || ''); // Assuming designation is part of user object
  const [employeeId, setEmployeeId] = useState(user?.employeeId || ''); // Assuming employeeId is part of user object
  
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordChangeErrors, setPasswordChangeErrors] = useState<Record<string, string>>({});

  // Determine if employee details fields should be read-only
  const isEmployeeDetailsReadOnly = !hasPermission('hr_employee_details', 'edit');

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
      setMobile(user.mobile || '');
      setAvatarUrl(user.avatar || '');
      // Fetch additional profile details if they are not in the initial user context
      // This would typically be done by fetching from the user_profiles table
      const fetchProfileDetails = async () => {
        if (user.id) {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('department, designation, employee_id')
            .eq('id', user.id)
            .single();
          if (error) {
            console.error('Error fetching additional profile details:', error);
          } else if (data) {
            setDepartment(data.department || '');
            setDesignation(data.designation || '');
            setEmployeeId(data.employee_id || '');
          }
        }
      };
      fetchProfileDetails();
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateProfileForm = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email address';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) return;
    setLoading(true);
    setErrors({});

    try {
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user?.id}.${fileExt}`;
        const filePath = fileName; 

        const { data: uploadData, error: uploadError } = await supabase.storage // Added data: uploadData
          .from('avatars')
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error('Supabase Storage Upload Error:', uploadError); // Log upload error
          throw uploadError;
        }
        console.log('Supabase Storage Upload Success:', uploadData); // Log upload success
        newAvatarUrl = supabase.storage.from('avatars').getPublicUrl(filePath).data.publicUrl;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
          phone: mobile,
          avatar_url: newAvatarUrl,
          ...(isEmployeeDetailsReadOnly ? {} : {
            department: department,
            designation: designation,
            employee_id: employeeId,
          }),
        })
        .eq('id', user?.id)
        .select();

      if (error) {
        console.error('Supabase Profile Update Error:', error); // Log update error
        throw error;
      }
      console.log('Supabase Profile Update Success:', data); // Log update success

      updateUser({
        name: fullName,
        mobile: mobile,
        avatar: newAvatarUrl,
        department: department,
        designation: designation,
        employeeId: employeeId,
      });

      showNotification('Profile updated successfully!', 'success');
      setIsEditing(false);
      setAvatarFile(null);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setErrors({ submit: err.message || 'Failed to update profile.' });
      showNotification(err.message || 'Failed to update profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validatePasswordChangeForm = () => {
    const newErrors: Record<string, string> = {};
    if (!currentPassword) newErrors.currentPassword = 'Current password is required.';
    if (!newPassword) newErrors.newPassword = 'New password is required.';
    if (newPassword.length < 6) newErrors.newPassword = 'New password must be at least 6 characters long.';
    if (newPassword !== confirmNewPassword) newErrors.confirmNewPassword = 'New passwords do not match.';
    if (currentPassword === newPassword) newErrors.newPassword = 'New password cannot be the same as current password.';
    
    setPasswordChangeErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordChangeForm()) return;
    setLoading(true);
    setPasswordChangeErrors({});

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Supabase Password Update Error:', error); // Log password update error
        throw error;
      }
      console.log('Supabase Password Update Success:', data); // Log password update success

      showNotification('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      console.error('Error changing password:', err);
      setPasswordChangeErrors({ submit: err.message || 'Failed to change password.' });
      showNotification(err.message || 'Failed to change password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>User Profile</h1>
          <p className={theme.textSecondary}>Manage your personal information and preferences.</p>
        </div>
        {activeSection === 'profile-personal' && !isEditing && (
          <Button icon={<Edit size={16} />} onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>

      {activeSection === 'profile-personal' && (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Full Name"
              value={fullName}
              onChange={setFullName}
              icon={<User size={18} />}
              readOnly={!isEditing}
              error={errors.fullName}
            />
            <FormField
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              icon={<Mail size={18} />}
              readOnly // Email is typically read-only from profile, managed by auth
              error={errors.email}
            />
            <FormField
              label="Mobile Number"
              value={mobile}
              onChange={setMobile}
              icon={<Phone size={18} />}
              readOnly={!isEditing}
              error={errors.mobile}
            />
          </div>

          <h3 className={`text-lg font-semibold ${theme.textPrimary} mt-6 mb-4`}>Employment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Department"
              value={department}
              onChange={setDepartment}
              icon={<Building size={18} />}
              readOnly={!isEditing || isEmployeeDetailsReadOnly} // Read-only if not editing or no HR permission
            />
            <FormField
              label="Designation"
              value={designation}
              onChange={setDesignation}
              icon={<Briefcase size={18} />}
              readOnly={!isEditing || isEmployeeDetailsReadOnly} // Read-only if not editing or no HR permission
            />
            <FormField
              label="Employee ID"
              value={employeeId}
              onChange={setEmployeeId}
              icon={<CreditCard size={18} />}
              readOnly={!isEditing || isEmployeeDetailsReadOnly} // Read-only if not editing or no HR permission
            />
            {isEmployeeDetailsReadOnly && (
              <p className="text-sm text-yellow-600 mt-2 md:col-span-2">
                * Employee details can only be edited by HR or Admin.
              </p>
            )}
          </div>

          <h3 className={`text-lg font-semibold ${theme.textPrimary} mt-6 mb-4`}>Profile Picture</h3>
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center bg-gray-100">
              {avatarUrl ? (
                <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-gray-400" />
              )}
            </div>
            {isEditing && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload" className={`
                  inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium
                  text-gray-700 bg-white hover:bg-gray-50 cursor-pointer
                `}>
                  <Upload size={16} className="mr-2" />
                  Upload New Photo
                </label>
                {avatarFile && <p className="text-sm text-gray-500 mt-2">{avatarFile.name}</p>}
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="p-3 mt-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{errors.submit}</p>
            </div>
          )}

          {isEditing && (
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => { setIsEditing(false); setErrors({}); }}>Cancel</Button>
              <Button onClick={handleSaveProfile} disabled={loading} icon={<Save size={16} />}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </Card>
      )}

      {activeSection === 'profile-password' && (
        <Card className="p-6">
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Change Password</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter current password"
              icon={<Lock size={18} />}
              showToggleVisibility={true}
              onToggleVisibility={() => setShowCurrentPassword(!showCurrentPassword)}
              isPasswordVisible={showCurrentPassword}
              error={passwordChangeErrors.currentPassword}
            />
            <FormField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Enter new password"
              icon={<Lock size={18} />}
              showToggleVisibility={true}
              onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
              isPasswordVisible={showNewPassword}
              error={passwordChangeErrors.newPassword}
            />
            <FormField
              label="Confirm New Password"
              type="password"
              value={confirmNewPassword}
              onChange={setConfirmNewPassword}
              placeholder="Confirm new password"
              icon={<Lock size={18} />}
              showToggleVisibility={true}
              onToggleVisibility={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
              isPasswordVisible={showConfirmNewPassword}
              error={passwordChangeErrors.confirmNewPassword}
            />
          </div>
          {passwordChangeErrors.submit && (
            <div className="p-3 mt-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{passwordChangeErrors.submit}</p>
            </div>
          )}
          <div className="flex justify-end mt-6">
            <Button onClick={handleChangePassword} disabled={loading} icon={<Save size={16} />}>
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default ProfilePage;
