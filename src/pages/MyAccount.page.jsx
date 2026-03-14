import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Avatar, Badge, Modal } from '../components/common';
import { SubscriptionSection } from './admin/subscription/Subscription.page';
import { Mail, Phone, Edit, Key } from 'lucide-react';
import MyAccountProfileForm from './common/forms/MyAccountProfileForm';
import MyAccountChangePasswordForm from './common/forms/MyAccountChangePasswordForm';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { Toast } from '../utils/alert';
import { initializeFirebaseServices } from '../services/firebaseService';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const MyAccount = () => {
  const { user, fetchUserData, isTrialExpired, isAccountOwner } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstname: user?.firstname || '',
    lastname: user?.lastname || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleOpenEditModal = () => {
    setFormData({
      firstname: user?.firstname || '',
      lastname: user?.lastname || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setShowEditModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile update submission
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.firstname || !formData.lastname) {
      Toast.error('First name and last name are required');
      return;
    }

    if (!formData.email) {
      Toast.error('Email is required');
      return;
    }

    setIsUpdating(true);
    try {
      // Update user profile via API - include role to satisfy backend validation
      await userService.update(user.id, {
        ...formData,
        role: user.role, // Preserve current role
      });

      // Refresh user data from server
      await fetchUserData();

      Toast.success('Profile updated successfully!');
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle opening password modal
  const handleOpenPasswordModal = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowPasswordModal(true);
  };

  // Handle password input changes
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle password change submission
  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validation
    if (!passwordData.currentPassword) {
      Toast.error('Current password is required');
      return;
    }

    if (!passwordData.newPassword) {
      Toast.error('New password is required');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Toast.error('New passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      Toast.error('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { auth } = await initializeFirebaseServices();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Reauthenticate user with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);

      // Update password in Firebase
      await updatePassword(currentUser, passwordData.newPassword);

      Toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);

      // Handle specific Firebase errors
      if (error.code === 'auth/wrong-password') {
        Toast.error('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        Toast.error('New password is too weak');
      } else if (error.code === 'auth/requires-recent-login') {
        Toast.error('Please log out and log in again before changing password');
      } else {
        Toast.error(error.message || 'Failed to change password');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // If trial is expired and this is the account owner, force them into subscription section
  if (isTrialExpired && isAccountOwner) {
    return (
      <Layout title="My Account" subtitle="Your trial has ended. Choose a plan to continue using the app.">
        <div className="space-y-6">
          <SubscriptionSection defaultTab="my-plan" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Account" subtitle="Manage your account settings">
      <div className="space-y-6">
        {/* My Profile card */}
        <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-50">My Profile</h3>
              <button
                onClick={handleOpenEditModal}
                className="btn-secondary flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
            <div className="flex items-center gap-6">
              <Avatar src={user.avatar} name={user.fullname} size="xl" />
              <div className="flex-1">
                <h4 className="text-xl font-bold text-dark-50">{user.fullname}</h4>
                <p className="text-dark-500">{user.email}</p>
                <Badge variant="primary" size="lg">
                  {user.role}
                </Badge>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-dark-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <Mail className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Email</p>
                  <p className="font-semibold text-dark-50">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success-100 rounded-xl">
                  <Phone className="w-6 h-6 text-success-600" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Phone</p>
                  <p className="font-semibold text-dark-50">+1 234 567 8900</p>
                </div>
              </div>
            </div>
          </div>



          {/* Security Section */}
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-50 mb-6">Security</h3>

            <div className="space-y-4">
              {/* Password */}
              <div className="flex items-center justify-between p-4 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-100 rounded-xl">
                    <Key className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-dark-50">Password</h4>
                    <p className="text-sm text-dark-500">Last changed 30 days ago</p>
                  </div>
                </div>
                <button
                  onClick={handleOpenPasswordModal}
                  className="btn-secondary"
                >
                  Change Password
                </button>
              </div>

              {/* Two-Factor Authentication - Commented out for future use */}
              {/* <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-success-100 rounded-xl">
                    <Shield className="w-6 h-6 text-success-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-dark-50">Two-Factor Authentication</h4>
                    <p className="text-sm text-dark-500">Add an extra layer of security</p>
                  </div>
                </div>
                <button className="btn-primary">Enable 2FA</button>
              </div> */}
            </div>
          </div>

          {/* Active Sessions - Commented out for future use */}
          {/* <div className="card">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">Active Sessions</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-success-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-800">Current Session</p>
                    <p className="text-sm text-dark-500">Chrome on Windows • IP: 192.168.1.1</p>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-dark-200 rounded-lg">
                    <Clock className="w-5 h-5 text-dark-500" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-800">Mobile App</p>
                    <p className="text-sm text-dark-500">iOS • Last active 2 hours ago</p>
                  </div>
                </div>
                <button className="text-danger-600 hover:text-danger-700 text-sm font-medium">
                  Revoke
                </button>
              </div>
            </div>
          </div> */}

        {isAccountOwner && <SubscriptionSection defaultTab="billing" />}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Profile"
        size="md"
      >
        <MyAccountProfileForm
          user={user}
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleUpdateProfile}
          isSubmitting={isUpdating}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        size="md"
      >
        <MyAccountChangePasswordForm
          passwordData={passwordData}
          onChange={handlePasswordInputChange}
          onSubmit={handleChangePassword}
          isSubmitting={isChangingPassword}
          onCancel={() => setShowPasswordModal(false)}
        />
      </Modal>
    </Layout>
  );
};

export default MyAccount;
