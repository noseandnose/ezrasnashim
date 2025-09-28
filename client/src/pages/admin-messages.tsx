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
import { MessageSquare, Plus, ArrowLeft, Save, Edit, Trash2, Bell, ChefHat } from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import type { Message } from '@shared/schema';

export default function AdminMessages() {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    message: ''
  });
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Set up authorization headers for authenticated requests
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${adminPassword}`
  });

  // Fetch upcoming messages if authenticated
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/messages', { upcoming: true }],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      try {
        const response = await axiosClient.get('/api/messages?upcoming=true', {
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
      // Test authentication by trying to fetch messages
      await axiosClient.get('/api/messages?upcoming=true', {
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

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setFormData({
      date: message.date,
      title: message.title,
      message: message.message
    });
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setFormData({
      date: '',
      title: '',
      message: ''
    });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.date || !formData.message) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in date, title, and message content.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const messageData = {
        date: formData.date,
        title: formData.title,
        message: formData.message
      };

      let response;
      if (editingMessage) {
        // Update existing message
        response = await axiosClient.put(`/api/messages/${editingMessage.id}`, messageData, {
          headers: getAuthHeaders()
        });
        toast({
          title: 'Message Updated!',
          description: `Message for ${format(new Date(formData.date), "MMMM d, yyyy")} has been updated successfully.`,
        });
      } else {
        // Create new message
        response = await axiosClient.post('/api/messages', messageData, {
          headers: getAuthHeaders()
        });
        toast({
          title: 'Message Created!',
          description: `Message for ${format(new Date(formData.date), "MMMM d, yyyy")} has been saved successfully.`,
        });
      }

      if (response.data) {
        // Clear form
        setFormData({
          date: '',
          title: '',
          message: ''
        });
        setEditingMessage(null);
        
        // Refresh messages list and invalidate cache
        refetchMessages();
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        toast({
          title: 'Authentication Error',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: error?.response?.data?.message || error?.message || 'Failed to save message.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMessage = async (message: Message) => {
    if (!confirm(`Are you sure you want to delete the message for ${format(new Date(message.date), "MMMM d, yyyy")}?`)) {
      return;
    }

    try {
      await axiosClient.delete(`/api/messages/${message.id}`, {
        headers: getAuthHeaders()
      });
      toast({
        title: 'Message Deleted',
        description: `Message for ${format(new Date(message.date), "MMMM d, yyyy")} has been deleted.`,
      });
      
      // Refresh messages list and invalidate cache
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    } catch (error: any) {
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        toast({
          title: 'Authentication Error',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: error?.response?.data?.message || error?.message || 'Failed to delete message.',
          variant: 'destructive'
        });
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blush/10 to-white p-4">
        <div className="max-w-md mx-auto mt-20">
          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Admin Login - Messages
            </h1>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter admin password"
                  data-testid="input-admin-password"
                />
              </div>
              <Button 
                onClick={handleLogin} 
                className="w-full"
                data-testid="button-admin-login"
              >
                Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blush/10 to-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/admin/notifications">
              <Button variant="outline" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <MessageSquare className="w-8 h-8" />
              Message Management
            </h1>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/notifications">
              <Button variant="outline" size="sm" data-testid="link-admin-notifications">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
            </Link>
            <Link to="/admin/recipes">
              <Button variant="outline" size="sm" data-testid="link-admin-recipes">
                <ChefHat className="w-4 h-4 mr-2" />
                Recipes
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Message Form */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {editingMessage ? 'Edit Message' : 'Create New Message'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  data-testid="input-message-date"
                />
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Message title"
                  data-testid="input-message-title"
                />
              </div>

              <div>
                <Label htmlFor="message">Content</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Message content..."
                  rows={8}
                  data-testid="textarea-message-content"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex-1"
                  data-testid="button-save-message"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : editingMessage ? 'Update Message' : 'Create Message'}
                </Button>
                {editingMessage && (
                  <Button 
                    onClick={handleCancelEdit}
                    variant="outline"
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Upcoming Messages List */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Messages</h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages && messages.length > 0 ? (
                messages.map((message: Message) => (
                  <div key={message.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{message.title}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(message.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                          {message.message}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditMessage(message)}
                          data-testid={`button-edit-message-${message.id}`}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteMessage(message)}
                          data-testid={`button-delete-message-${message.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No upcoming messages found.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}