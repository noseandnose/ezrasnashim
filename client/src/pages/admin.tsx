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
import { MessageSquare, Plus, Save, Edit, Trash2, Bell, ChefHat, Send, Clock, Users, CheckCircle, XCircle, Image, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { Message } from '@shared/schema';
import { ObjectUploader } from '@/components/ObjectUploader';
import type { UploadResult } from '@uppy/core';

type AdminTab = 'messages' | 'recipes' | 'inspirations' | 'notifications';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('messages');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Messages state
  const [messageFormData, setMessageFormData] = useState({
    date: '',
    title: '',
    message: ''
  });
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isSavingMessage, setIsSavingMessage] = useState(false);

  // Recipes state
  const [recipeFormData, setRecipeFormData] = useState({
    date: '',
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
    servings: '',
    prepTime: '',
    cookTime: '',
    difficulty: 'easy',
    imageUrl: '',
    tags: '',
    thankYouMessage: ''
  });
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);

  // Table inspirations state
  const [inspirationFormData, setInspirationFormData] = useState({
    fromDate: '',
    untilDate: '',
    title: '',
    content: '',
    mediaUrl1: '',
    mediaType1: 'image',
    mediaUrl2: '',
    mediaType2: 'image',
    mediaUrl3: '',
    mediaType3: 'image',
    mediaUrl4: '',
    mediaType4: 'image',
    mediaUrl5: '',
    mediaType5: 'image'
  });
  const [editingInspiration, setEditingInspiration] = useState(null);
  const [isSavingInspiration, setIsSavingInspiration] = useState(false);

  // Notifications state
  const [notificationData, setNotificationData] = useState({
    title: '',
    body: '',
    url: '/',
    requireInteraction: false
  });
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  // Set up authorization headers for authenticated requests
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${adminPassword}`
  });

  // Messages API calls
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/messages', { upcoming: true }],
    queryFn: async () => {
      if (!isAuthenticated || activeTab !== 'messages') return [];
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
    enabled: isAuthenticated && activeTab === 'messages',
  });

  // Recipes API calls
  const { data: recipes, refetch: refetchRecipes } = useQuery({
    queryKey: ['/api/table/recipes'],
    queryFn: async () => {
      if (!isAuthenticated || activeTab !== 'recipes') return [];
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/table/recipes`);
      if (!response.ok) throw new Error('Failed to fetch recipes');
      return response.json();
    },
    enabled: isAuthenticated && activeTab === 'recipes',
  });

  // Table inspirations API calls
  const { data: inspirations, refetch: refetchInspirations } = useQuery({
    queryKey: ['/api/table/inspirations'],
    queryFn: async () => {
      if (!isAuthenticated || activeTab !== 'inspirations') return [];
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/table/inspirations`);
      if (!response.ok) throw new Error('Failed to fetch inspirations');
      return response.json();
    },
    enabled: isAuthenticated && activeTab === 'inspirations',
  });

  // Notifications API calls
  const { data: notificationHistory, refetch: refetchNotificationHistory } = useQuery({
    queryKey: ['/api/push/history'],
    queryFn: async () => {
      if (!isAuthenticated || activeTab !== 'notifications') return [];
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/push/history?adminPassword=${encodeURIComponent(adminPassword)}`);
      if (!response.ok) throw new Error('Failed to fetch notification history');
      return response.json();
    },
    enabled: isAuthenticated && activeTab === 'notifications',
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
          description: 'Invalid admin password. Please try again.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Login Error',
          description: 'An error occurred during login.',
          variant: 'destructive'
        });
      }
    }
  };

  // Messages functions
  const handleMessageSubmit = async () => {
    if (!messageFormData.date || !messageFormData.message) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in both date and message content.',
        variant: 'destructive'
      });
      return;
    }

    setIsSavingMessage(true);
    try {
      const messageData = {
        date: messageFormData.date,
        title: messageFormData.title || null,
        content: messageFormData.message
      };

      let response;
      if (editingMessage) {
        response = await axiosClient.put(`/api/messages/${editingMessage.id}`, messageData, {
          headers: getAuthHeaders()
        });
      } else {
        response = await axiosClient.post('/api/messages', messageData, {
          headers: getAuthHeaders()
        });
      }

      if (response.status === 200 || response.status === 201) {
        toast({
          title: 'Success',
          description: editingMessage ? 'Message updated successfully!' : 'Message created successfully!',
        });

        setMessageFormData({ date: '', title: '', message: '' });
        setEditingMessage(null);
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        await refetchMessages();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save message',
        variant: 'destructive'
      });
    } finally {
      setIsSavingMessage(false);
    }
  };

  const handleDeleteMessage = async (message: Message) => {
    if (!confirm(`Are you sure you want to delete the message for ${message.date}?`)) {
      return;
    }

    try {
      await axiosClient.delete(`/api/messages/${message.id}`, {
        headers: getAuthHeaders()
      });
      
      toast({
        title: 'Message Deleted',
        description: 'The message has been successfully deleted.',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      await refetchMessages();
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.response?.data?.message || 'Failed to delete message',
        variant: 'destructive'
      });
    }
  };

  // Image upload functions
  const handleImageUpload = async (type: 'recipe' | 'inspiration', field?: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/objects/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const { uploadURL } = await response.json();
      return { method: 'PUT' as const, url: uploadURL };
    } catch (error) {
      toast({
        title: 'Upload Error',
        description: 'Failed to get upload URL',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleImageUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>, type: 'recipe' | 'inspiration', field?: string) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadURL = result.successful[0].uploadURL;
        
        // Set ACL policy for the uploaded image
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/images/upload-complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageURL: uploadURL })
        });
        
        if (response.ok) {
          const { objectPath } = await response.json();
          const fullImageUrl = `${window.location.origin}${objectPath}`;
          
          if (type === 'recipe') {
            setRecipeFormData(prev => ({ ...prev, imageUrl: fullImageUrl }));
          } else if (type === 'inspiration' && field) {
            setInspirationFormData(prev => ({ ...prev, [field]: fullImageUrl }));
          }
          
          toast({
            title: 'Image Uploaded',
            description: 'Image uploaded successfully!'
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Upload Error',
        description: 'Failed to complete image upload',
        variant: 'destructive'
      });
    }
  };

  // Recipe functions
  const handleRecipeSubmit = async () => {
    if (!recipeFormData.title || !recipeFormData.date || !recipeFormData.ingredients || !recipeFormData.instructions) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in title, date, ingredients, and instructions.',
        variant: 'destructive'
      });
      return;
    }

    setIsSavingRecipe(true);
    try {
      const recipeData = {
        ...recipeFormData,
        tags: recipeFormData.tags || null,
        thankYouMessage: recipeFormData.thankYouMessage || null
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/table/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData)
      });

      if (response.ok) {
        toast({
          title: 'Recipe Created',
          description: 'Recipe has been successfully created!',
        });
        setRecipeFormData({
          date: '', title: '', description: '', ingredients: '', instructions: '',
          servings: '', prepTime: '', cookTime: '', difficulty: 'easy', imageUrl: '', tags: '', thankYouMessage: ''
        });
        await refetchRecipes();
      } else {
        throw new Error('Failed to create recipe');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to create recipe. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSavingRecipe(false);
    }
  };

  // Table inspirations functions
  const handleInspirationSubmit = async () => {
    if (!inspirationFormData.title || !inspirationFormData.fromDate || !inspirationFormData.untilDate || !inspirationFormData.content) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in title, from date, until date, and content.',
        variant: 'destructive'
      });
      return;
    }

    setIsSavingInspiration(true);
    try {
      const inspirationData = {
        ...inspirationFormData,
        mediaUrl1: inspirationFormData.mediaUrl1 || null,
        mediaUrl2: inspirationFormData.mediaUrl2 || null,
        mediaUrl3: inspirationFormData.mediaUrl3 || null,
        mediaUrl4: inspirationFormData.mediaUrl4 || null,
        mediaUrl5: inspirationFormData.mediaUrl5 || null
      };

      let response;
      if (editingInspiration) {
        response = await fetch(`${import.meta.env.VITE_API_URL}/api/table/inspiration/${editingInspiration.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inspirationData)
        });
      } else {
        response = await fetch(`${import.meta.env.VITE_API_URL}/api/table/inspiration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inspirationData)
        });
      }

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingInspiration ? 'Inspiration updated successfully!' : 'Inspiration created successfully!',
        });
        setInspirationFormData({
          fromDate: '', untilDate: '', title: '', content: '',
          mediaUrl1: '', mediaType1: 'image', mediaUrl2: '', mediaType2: 'image',
          mediaUrl3: '', mediaType3: 'image', mediaUrl4: '', mediaType4: 'image',
          mediaUrl5: '', mediaType5: 'image'
        });
        setEditingInspiration(null);
        await refetchInspirations();
      } else {
        throw new Error('Failed to save inspiration');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save inspiration. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSavingInspiration(false);
    }
  };

  const handleDeleteInspiration = async (inspiration: any) => {
    if (!confirm(`Are you sure you want to delete the inspiration "${inspiration.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/table/inspiration/${inspiration.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({
          title: 'Inspiration Deleted',
          description: 'The inspiration has been successfully deleted.',
        });
        await refetchInspirations();
      } else {
        throw new Error('Failed to delete inspiration');
      }
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete inspiration',
        variant: 'destructive'
      });
    }
  };

  // Notification functions
  const handleSendNotification = async () => {
    if (!notificationData.title || !notificationData.body) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both title and body for the notification.',
        variant: 'destructive'
      });
      return;
    }

    setIsSendingNotification(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...notificationData,
          adminPassword
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Notification Sent',
          description: `Notification sent to ${result.successCount || 'all'} users.`,
        });
        setNotificationData({ title: '', body: '', url: '/', requireInteraction: false });
        await refetchNotificationHistory();
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error: any) {
      toast({
        title: 'Send Failed',
        description: 'Failed to send notification. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSendingNotification(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-rose-100 rounded-full">
                <MessageSquare className="w-8 h-8 text-rose-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Enter your admin password to continue</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                data-testid="input-admin-password"
                placeholder="Enter admin password"
                className="mt-1"
              />
            </div>
            
            <Button 
              onClick={handleLogin} 
              className="w-full bg-rose-600 hover:bg-rose-700"
              data-testid="button-admin-login"
            >
              Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage messages, recipes, and notifications</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm">
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'messages'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              data-testid="tab-messages"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'recipes'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              data-testid="tab-recipes"
            >
              <ChefHat className="w-4 h-4 mr-2" />
              Recipes
            </button>
            <button
              onClick={() => setActiveTab('inspirations')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'inspirations'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              data-testid="tab-inspirations"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Inspirations
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              data-testid="tab-notifications"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </button>
          </div>
        </div>

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Message Form */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-rose-600" />
                {editingMessage ? 'Edit Message' : 'Create New Message'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="message-date">Date *</Label>
                  <Input
                    id="message-date"
                    type="date"
                    value={messageFormData.date}
                    onChange={(e) => setMessageFormData(prev => ({ ...prev, date: e.target.value }))}
                    data-testid="input-message-date"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="message-title">Title (optional)</Label>
                  <Input
                    id="message-title"
                    value={messageFormData.title}
                    onChange={(e) => setMessageFormData(prev => ({ ...prev, title: e.target.value }))}
                    data-testid="input-message-title"
                    placeholder="Enter message title"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="message-content">Message Content *</Label>
                  <Textarea
                    id="message-content"
                    value={messageFormData.message}
                    onChange={(e) => setMessageFormData(prev => ({ ...prev, message: e.target.value }))}
                    data-testid="textarea-message-content"
                    placeholder="Enter your message content..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <Button 
                  onClick={handleMessageSubmit} 
                  disabled={isSavingMessage}
                  className="w-full bg-rose-600 hover:bg-rose-700"
                  data-testid="button-save-message"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingMessage ? 'Saving...' : (editingMessage ? 'Update Message' : 'Create Message')}
                </Button>

                {editingMessage && (
                  <Button 
                    onClick={() => {
                      setEditingMessage(null);
                      setMessageFormData({ date: '', title: '', message: '' });
                    }}
                    variant="outline"
                    className="w-full"
                    data-testid="button-cancel-edit"
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </Card>

            {/* Existing Messages */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Upcoming Messages</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages && messages.length > 0 ? (
                  messages.map((message: Message) => (
                    <div 
                      key={message.id} 
                      className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                      data-testid={`message-item-${message.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          {format(new Date(message.date), 'MMM dd, yyyy')}
                        </div>
                        {message.title && (
                          <div className="text-sm font-medium text-gray-700 mt-1">
                            {message.title}
                          </div>
                        )}
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {message.message}
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingMessage(message);
                            setMessageFormData({
                              date: message.date,
                              title: message.title || '',
                              message: message.message
                            });
                          }}
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
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No upcoming messages found
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Recipes Tab */}
        {activeTab === 'recipes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Recipe Form */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-rose-600" />
                Create New Recipe
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipe-date">Date *</Label>
                    <Input
                      id="recipe-date"
                      type="date"
                      value={recipeFormData.date}
                      onChange={(e) => setRecipeFormData(prev => ({ ...prev, date: e.target.value }))}
                      data-testid="input-recipe-date"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipe-difficulty">Difficulty</Label>
                    <select
                      id="recipe-difficulty"
                      value={recipeFormData.difficulty}
                      onChange={(e) => setRecipeFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                      data-testid="select-recipe-difficulty"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="recipe-title">Title *</Label>
                  <Input
                    id="recipe-title"
                    value={recipeFormData.title}
                    onChange={(e) => setRecipeFormData(prev => ({ ...prev, title: e.target.value }))}
                    data-testid="input-recipe-title"
                    placeholder="Recipe title"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="recipe-description">Description</Label>
                  <Textarea
                    id="recipe-description"
                    value={recipeFormData.description}
                    onChange={(e) => setRecipeFormData(prev => ({ ...prev, description: e.target.value }))}
                    data-testid="textarea-recipe-description"
                    placeholder="Brief description"
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="recipe-ingredients">Ingredients *</Label>
                  <Textarea
                    id="recipe-ingredients"
                    value={recipeFormData.ingredients}
                    onChange={(e) => setRecipeFormData(prev => ({ ...prev, ingredients: e.target.value }))}
                    data-testid="textarea-recipe-ingredients"
                    placeholder="List ingredients (one per line)"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="recipe-instructions">Instructions *</Label>
                  <Textarea
                    id="recipe-instructions"
                    value={recipeFormData.instructions}
                    onChange={(e) => setRecipeFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    data-testid="textarea-recipe-instructions"
                    placeholder="Step-by-step instructions"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="recipe-servings">Servings</Label>
                    <Input
                      id="recipe-servings"
                      value={recipeFormData.servings}
                      onChange={(e) => setRecipeFormData(prev => ({ ...prev, servings: e.target.value }))}
                      data-testid="input-recipe-servings"
                      placeholder="e.g., 4"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipe-prep-time">Prep Time</Label>
                    <Input
                      id="recipe-prep-time"
                      value={recipeFormData.prepTime}
                      onChange={(e) => setRecipeFormData(prev => ({ ...prev, prepTime: e.target.value }))}
                      data-testid="input-recipe-prep-time"
                      placeholder="e.g., 15 min"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipe-cook-time">Cook Time</Label>
                    <Input
                      id="recipe-cook-time"
                      value={recipeFormData.cookTime}
                      onChange={(e) => setRecipeFormData(prev => ({ ...prev, cookTime: e.target.value }))}
                      data-testid="input-recipe-cook-time"
                      placeholder="e.g., 30 min"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="recipe-thank-you">Thank You Message</Label>
                  <Textarea
                    id="recipe-thank-you"
                    value={recipeFormData.thankYouMessage}
                    onChange={(e) => setRecipeFormData(prev => ({ ...prev, thankYouMessage: e.target.value }))}
                    data-testid="textarea-recipe-thank-you"
                    placeholder="Custom thank you message (supports markdown links)"
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <Button 
                  onClick={handleRecipeSubmit} 
                  disabled={isSavingRecipe}
                  className="w-full bg-rose-600 hover:bg-rose-700"
                  data-testid="button-save-recipe"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingRecipe ? 'Creating...' : 'Create Recipe'}
                </Button>
              </div>
            </Card>

            {/* Existing Recipes */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Recipes</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recipes && recipes.length > 0 ? (
                  recipes.slice(0, 10).map((recipe: any) => (
                    <div 
                      key={recipe.id} 
                      className="p-3 bg-gray-50 rounded-lg"
                      data-testid={`recipe-item-${recipe.id}`}
                    >
                      <div className="font-medium text-sm text-gray-900">
                        {format(new Date(recipe.date), 'MMM dd, yyyy')} - {recipe.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {recipe.description || 'No description'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recipes found
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Send Notification Form */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Send className="w-5 h-5 mr-2 text-rose-600" />
                Send Push Notification
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notification-title">Title *</Label>
                  <Input
                    id="notification-title"
                    value={notificationData.title}
                    onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
                    data-testid="input-notification-title"
                    placeholder="Notification title"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notification-body">Body *</Label>
                  <Textarea
                    id="notification-body"
                    value={notificationData.body}
                    onChange={(e) => setNotificationData(prev => ({ ...prev, body: e.target.value }))}
                    data-testid="textarea-notification-body"
                    placeholder="Notification message"
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notification-url">URL (optional)</Label>
                  <Input
                    id="notification-url"
                    value={notificationData.url}
                    onChange={(e) => setNotificationData(prev => ({ ...prev, url: e.target.value }))}
                    data-testid="input-notification-url"
                    placeholder="e.g., /torah"
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notification-require-interaction"
                    checked={notificationData.requireInteraction}
                    onChange={(e) => setNotificationData(prev => ({ ...prev, requireInteraction: e.target.checked }))}
                    data-testid="checkbox-notification-require-interaction"
                    className="rounded"
                  />
                  <Label htmlFor="notification-require-interaction">Require user interaction</Label>
                </div>

                <Button 
                  onClick={handleSendNotification} 
                  disabled={isSendingNotification}
                  className="w-full bg-rose-600 hover:bg-rose-700"
                  data-testid="button-send-notification"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSendingNotification ? 'Sending...' : 'Send Notification'}
                </Button>
              </div>
            </Card>

            {/* Notification History */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Notifications</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notificationHistory && notificationHistory.length > 0 ? (
                  notificationHistory.slice(0, 10).map((notification: any, index: number) => (
                    <div 
                      key={index} 
                      className="p-3 bg-gray-50 rounded-lg"
                      data-testid={`notification-item-${index}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">
                            {notification.title}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {notification.body}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {format(new Date(notification.sentAt), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          <div className="text-xs text-gray-500 flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {notification.successCount || 0}
                          </div>
                          {notification.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No notifications sent yet
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}