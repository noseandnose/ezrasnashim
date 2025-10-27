import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import axiosClient from '@/lib/axiosClient';
import { useQuery } from '@tanstack/react-query';
import { Bell, Plus, ArrowLeft, Save, Edit, Trash2, Clock } from 'lucide-react';
import { Link } from 'wouter';
import { format, parseISO } from 'date-fns';
import type { ScheduledNotification } from '@shared/schema';

export default function AdminScheduledNotifications() {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    title: '',
    message: ''
  });
  const [editingNotification, setEditingNotification] = useState<ScheduledNotification | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Set up authorization headers for authenticated requests
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${adminPassword}`
  });

  // Fetch all scheduled notifications if authenticated
  const { data: notifications, refetch: refetchNotifications } = useQuery({
    queryKey: ['/api/scheduled-notifications'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      try {
        const response = await axiosClient.get('/api/scheduled-notifications', {
          headers: getAuthHeaders()
        });
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 401) {
          setIsAuthenticated(false);
          throw new Error('Authentication expired');
        }
        throw error;
      }
    },
    enabled: isAuthenticated,
  });

  const handleLogin = async () => {
    if (!adminPassword) {
      toast({
        title: 'Password Required',
        description: 'Please enter the admin password.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Test authentication by trying to fetch notifications
      await axiosClient.get('/api/scheduled-notifications', {
        headers: { 'Authorization': `Bearer ${adminPassword}` }
      });
      setIsAuthenticated(true);
      toast({
        title: 'Login Successful',
        description: 'You are now authenticated as admin.',
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast({
          title: 'Authentication Failed',
          description: 'Invalid admin password.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Login Error',
          description: 'Unable to authenticate. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditNotification = (notification: ScheduledNotification) => {
    setEditingNotification(notification);
    setFormData({
      scheduledDate: notification.scheduledDate,
      scheduledTime: notification.scheduledTime,
      title: notification.title,
      message: notification.message
    });
  };

  const handleCancelEdit = () => {
    setEditingNotification(null);
    setFormData({
      scheduledDate: '',
      scheduledTime: '',
      title: '',
      message: ''
    });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.scheduledDate || !formData.scheduledTime || !formData.message) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in date, time, title, and message content.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const notificationData = {
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        title: formData.title.trim(),
        message: formData.message.trim()
      };

      if (editingNotification) {
        // Update existing notification
        await axiosClient.put(
          `/api/scheduled-notifications/${editingNotification.id}`,
          notificationData,
          { headers: getAuthHeaders() }
        );
        toast({
          title: 'Notification Updated',
          description: 'The scheduled notification has been successfully updated.',
        });
      } else {
        // Create new notification
        await axiosClient.post(
          '/api/scheduled-notifications',
          notificationData,
          { headers: getAuthHeaders() }
        );
        toast({
          title: 'Notification Created',
          description: 'New scheduled notification has been created.',
        });
      }

      // Invalidate cache for all scheduled notification queries
      await queryClient.invalidateQueries({ queryKey: ['/api/scheduled-notifications'] });
      
      // Reset form
      handleCancelEdit();
      
      // Refetch to show updated list
      await refetchNotifications();
    } catch (error: any) {
      console.error('Error saving notification:', error);
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        toast({
          title: 'Authentication Expired',
          description: 'Please log in again.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Save Failed',
          description: error.response?.data?.message || 'Failed to save notification. Please try again.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this scheduled notification?')) {
      return;
    }

    try {
      await axiosClient.delete(`/api/scheduled-notifications/${id}`, {
        headers: getAuthHeaders()
      });
      
      toast({
        title: 'Notification Deleted',
        description: 'The scheduled notification has been deleted.',
      });

      // Invalidate cache and refetch
      await queryClient.invalidateQueries({ queryKey: ['/api/scheduled-notifications'] });
      await refetchNotifications();
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        toast({
          title: 'Authentication Expired',
          description: 'Please log in again.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Delete Failed',
          description: 'Failed to delete notification. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTimeStr = `${date}T${time}`;
      return format(parseISO(dateTimeStr), 'MMM dd, yyyy h:mm a');
    } catch (error) {
      return `${date} at ${time}`;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <Bell className="w-12 h-12 text-purple-500" />
            </div>
            <h1 className="text-2xl font-bold">Scheduled Notifications Admin</h1>
            <p className="text-gray-600">Enter admin password to continue</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter admin password"
                data-testid="input-admin-password"
              />
            </div>
            <Button 
              onClick={handleLogin} 
              className="w-full"
              data-testid="button-login"
            >
              Login
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Link href="/admin">
              <Button variant="outline" className="w-full" data-testid="link-back-admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold">Scheduled Notifications</h1>
          </div>
          <Link href="/admin">
            <Button variant="outline" data-testid="link-back-admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>

        {/* Form Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            {editingNotification ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingNotification ? 'Edit Notification' : 'Create New Notification'}
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                  data-testid="input-scheduled-date"
                />
              </div>
              <div>
                <Label htmlFor="scheduledTime">Scheduled Time *</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                  data-testid="input-scheduled-time"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter notification title"
                data-testid="input-title"
              />
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Enter notification message"
                rows={4}
                data-testid="input-message"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex-1"
                data-testid="button-save"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : editingNotification ? 'Update Notification' : 'Create Notification'}
              </Button>
              {editingNotification && (
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  disabled={isSaving}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Notifications List */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            All Scheduled Notifications
          </h2>

          {!notifications || notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No scheduled notifications found.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification: ScheduledNotification) => (
                <Card key={notification.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{notification.title}</h3>
                        {notification.sent && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Sent
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700">{notification.message}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Scheduled for: {formatDateTime(notification.scheduledDate, notification.scheduledTime)}</span>
                      </div>
                      {notification.sentAt && (
                        <p className="text-sm text-gray-500">
                          Sent at: {format(new Date(notification.sentAt), 'MMM dd, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditNotification(notification)}
                        variant="outline"
                        size="sm"
                        data-testid={`button-edit-${notification.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(notification.id)}
                        variant="destructive"
                        size="sm"
                        data-testid={`button-delete-${notification.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
