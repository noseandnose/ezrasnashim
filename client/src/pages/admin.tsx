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
import { MessageSquare, Plus, Save, Edit, Trash2, Bell, ChefHat, Send, Clock, Users, CheckCircle, XCircle, Image, Calendar, Scroll, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import type { Message, TableInspiration, ScheduledNotification, ParshaVort } from '@shared/schema';
import { InlineImageUploader } from '@/components/InlineImageUploader';
import type { UploadResult } from '@uppy/core';

type AdminTab = 'messages' | 'recipes' | 'inspirations' | 'notifications' | 'parsha-vorts' | 'analytics';

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
  const [editingInspiration, setEditingInspiration] = useState<TableInspiration | null>(null);
  const [isSavingInspiration, setIsSavingInspiration] = useState(false);

  // Notifications state (unified: instant or scheduled based on date/time fields)
  const [notificationData, setNotificationData] = useState({
    title: '',
    body: '',
    url: '/',
    requireInteraction: false,
    scheduledDate: '', // Optional: if empty, send instantly
    scheduledTime: ''  // Optional: if empty, send instantly
  });
  const [editingNotification, setEditingNotification] = useState<ScheduledNotification | null>(null);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [isValidatingSubscriptions, setIsValidatingSubscriptions] = useState(false);

  // Parsha Vorts state
  const [parshaVortFormData, setParshaVortFormData] = useState({
    fromDate: '',
    untilDate: '',
    title: '',
    content: '',
    audioUrl: '',
    videoUrl: '',
    speaker: '',
    speakerWebsite: '',
    thankYouMessage: ''
  });
  const [editingParshaVort, setEditingParshaVort] = useState<ParshaVort | null>(null);
  const [isSavingParshaVort, setIsSavingParshaVort] = useState(false);

  // Analytics state
  const [analyticsStartDate, setAnalyticsStartDate] = useState('');
  const [analyticsEndDate, setAnalyticsEndDate] = useState('');
  const [dateRangeStats, setDateRangeStats] = useState<any>(null);
  const [weekComparison, setWeekComparison] = useState<any>(null);
  const [monthComparison, setMonthComparison] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Set up authorization headers for authenticated requests
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${adminPassword}`
  });

  // Messages API calls
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['admin-messages-upcoming'],
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
    queryKey: ['admin-table-recipes'],
    queryFn: async () => {
      if (!isAuthenticated || activeTab !== 'recipes') return [];
      try {
        const response = await axiosClient.get('/api/table/recipes', {
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
    enabled: isAuthenticated && activeTab === 'recipes',
  });

  // Table inspirations API calls
  const { data: inspirations, refetch: refetchInspirations } = useQuery({
    queryKey: ['admin-table-inspirations'],
    queryFn: async () => {
      if (!isAuthenticated || activeTab !== 'inspirations') return [];
      try {
        const response = await axiosClient.get('/api/table/inspirations', {
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
    enabled: isAuthenticated && activeTab === 'inspirations',
  });

  // Notifications API calls (fetches both instant and scheduled)
  const { data: notificationHistory, refetch: refetchNotificationHistory } = useQuery({
    queryKey: ['admin-push-history'],
    queryFn: async () => {
      if (!isAuthenticated || activeTab !== 'notifications') return [];
      try {
        const response = await axiosClient.get('/api/push/history', {
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
    enabled: isAuthenticated && activeTab === 'notifications',
  });

  const { data: scheduledNotifications, refetch: refetchScheduledNotifications } = useQuery({
    queryKey: ['admin-scheduled-notifications'],
    queryFn: async () => {
      if (!isAuthenticated || activeTab !== 'notifications') return [];
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
    enabled: isAuthenticated && activeTab === 'notifications',
  });

  const { data: subscriptions, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['admin-push-subscriptions'],
    queryFn: async () => {
      if (!isAuthenticated || activeTab !== 'notifications') return [];
      try {
        const response = await axiosClient.get('/api/push/subscriptions', {
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
    enabled: isAuthenticated && activeTab === 'notifications',
  });

  const { data: queueStatus, refetch: refetchQueueStatus } = useQuery({
    queryKey: ['admin-push-queue-status'],
    queryFn: async () => {
      if (!isAuthenticated || activeTab !== 'notifications') return null;
      try {
        const response = await axiosClient.get('/api/push/queue-status', {
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
    enabled: isAuthenticated && activeTab === 'notifications',
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Parsha Vorts API calls
  const { data: parshaVorts, refetch: refetchParshaVorts } = useQuery({
    queryKey: ['admin-parsha-vorts'],
    queryFn: async () => {
      if (!isAuthenticated || activeTab !== 'parsha-vorts') return [];
      try {
        const response = await axiosClient.get('/api/table/vorts', {
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
    enabled: isAuthenticated && activeTab === 'parsha-vorts',
  });


  const handleLogin = async () => {
    const trimmedPassword = adminPassword.trim();
    if (!trimmedPassword) {
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
        headers: { 'Authorization': `Bearer ${trimmedPassword}` }
      });
      // Store the trimmed password for future API calls
      setAdminPassword(trimmedPassword);
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
        title: messageFormData.title || '',
        message: messageFormData.message
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

        // Invalidate cache BEFORE clearing form to use correct date
        queryClient.invalidateQueries({ queryKey: ['admin-messages-upcoming'] });
        queryClient.invalidateQueries({ queryKey: [`/api/messages/${messageData.date}`] });
        await refetchMessages();
        
        setMessageFormData({ date: '', title: '', message: '' });
        setEditingMessage(null);
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

      queryClient.invalidateQueries({ queryKey: ['/api/messages', { upcoming: true }] });
      // Also invalidate the specific date query so it's removed from home page immediately
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${message.date}`] });
      await refetchMessages();
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.response?.data?.message || 'Failed to delete message',
        variant: 'destructive'
      });
    }
  };

  // Media upload functions (handles images, videos, and audio)
  const handleMediaUpload = async () => {
    try {
      const response = await axiosClient.post('/api/objects/upload', {}, {
        headers: getAuthHeaders()
      });
      const { uploadURL } = response.data;
      return { method: 'PUT' as const, url: uploadURL };
    } catch (error: any) {
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        toast({
          title: 'Authentication Failed',
          description: 'Please login again to upload media.',
          variant: 'destructive'
        });
      } else if (error.response?.status === 503) {
        // Object storage not available in production
        toast({
          title: 'Upload Not Available',
          description: error.response?.data?.message || 'Media upload is only available in the Replit development environment. Please use direct URLs instead.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Upload Error',
          description: error.response?.data?.message || 'Failed to get upload URL',
          variant: 'destructive'
        });
      }
      throw error;
    }
  };

  const handleMediaUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>, type: 'recipe' | 'inspiration', field?: string) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const uploadURL = uploadedFile.uploadURL;
        
        // Set ACL policy for the uploaded media (works for all types)
        const response = await axiosClient.post('/api/objects/upload-complete', {
          objectURL: uploadURL
        }, {
          headers: getAuthHeaders()
        });
        
        if (response.status === 200) {
          const { objectPath } = response.data;
          // If objectPath is already a full URL (CDN), use it as-is; otherwise prepend origin
          const fullMediaUrl = objectPath.startsWith('http') 
            ? objectPath 
            : `${window.location.origin}${objectPath}`;
          
          if (type === 'recipe') {
            setRecipeFormData(prev => ({ ...prev, imageUrl: fullMediaUrl }));
          } else if (type === 'inspiration' && field) {
            setInspirationFormData(prev => ({ ...prev, [field]: fullMediaUrl }));
          }
          
          // Get media type from file info for better toast message
          const fileType = uploadedFile.type || 'media';
          const mediaType = fileType.startsWith('image/') ? 'Image' : 
                           fileType.startsWith('video/') ? 'Video' :
                           fileType.startsWith('audio/') ? 'Audio' : 'Media';
          
          toast({
            title: `${mediaType} Uploaded`,
            description: `${mediaType} uploaded successfully!`
          });
        }
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        toast({
          title: 'Authentication Failed',
          description: 'Please login again to upload media.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Upload Error',
          description: 'Failed to complete media upload',
          variant: 'destructive'
        });
      }
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

      const response = await axiosClient.post('/api/table/recipe', recipeData, {
        headers: getAuthHeaders()
      });

      if (response.status === 200 || response.status === 201) {
        toast({
          title: 'Recipe Created',
          description: 'Recipe has been successfully created!',
        });
        setRecipeFormData({
          date: '', title: '', description: '', ingredients: '', instructions: '',
          servings: '', prepTime: '', cookTime: '', difficulty: 'easy', imageUrl: '', tags: '', thankYouMessage: ''
        });
        queryClient.invalidateQueries({ queryKey: ['admin-table-recipes'] });
        await refetchRecipes();
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
      // Only include mediaType when mediaUrl exists for data integrity
      const inspirationData = {
        ...inspirationFormData,
        mediaUrl1: inspirationFormData.mediaUrl1 || null,
        mediaType1: inspirationFormData.mediaUrl1 ? inspirationFormData.mediaType1 : null,
        mediaUrl2: inspirationFormData.mediaUrl2 || null,
        mediaType2: inspirationFormData.mediaUrl2 ? inspirationFormData.mediaType2 : null,
        mediaUrl3: inspirationFormData.mediaUrl3 || null,
        mediaType3: inspirationFormData.mediaUrl3 ? inspirationFormData.mediaType3 : null,
        mediaUrl4: inspirationFormData.mediaUrl4 || null,
        mediaType4: inspirationFormData.mediaUrl4 ? inspirationFormData.mediaType4 : null,
        mediaUrl5: inspirationFormData.mediaUrl5 || null,
        mediaType5: inspirationFormData.mediaUrl5 ? inspirationFormData.mediaType5 : null
      };

      let response;
      if (editingInspiration) {
        response = await axiosClient.put(`/api/table/inspiration/${editingInspiration.id}`, inspirationData, {
          headers: getAuthHeaders()
        });
      } else {
        response = await axiosClient.post('/api/table/inspiration', inspirationData, {
          headers: getAuthHeaders()
        });
      }

      if (response.status === 200 || response.status === 201) {
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
        queryClient.invalidateQueries({ queryKey: ['admin-table-inspirations'] });
        await refetchInspirations();
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
      const response = await axiosClient.delete(`/api/table/inspiration/${inspiration.id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 200 || response.status === 204) {
        toast({
          title: 'Inspiration Deleted',
          description: 'The inspiration has been successfully deleted.',
        });
        queryClient.invalidateQueries({ queryKey: ['admin-table-inspirations'] });
        await refetchInspirations();
      }
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete inspiration',
        variant: 'destructive'
      });
    }
  };

  // Parsha Vorts functions
  const handleParshaVortSubmit = async () => {
    if (!parshaVortFormData.title || !parshaVortFormData.fromDate || !parshaVortFormData.untilDate) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in title, from date, and until date.',
        variant: 'destructive'
      });
      return;
    }

    // At least one of audioUrl or videoUrl must be provided
    if (!parshaVortFormData.audioUrl && !parshaVortFormData.videoUrl) {
      toast({
        title: 'Missing Media',
        description: 'Please provide at least one of audio URL or video URL.',
        variant: 'destructive'
      });
      return;
    }

    setIsSavingParshaVort(true);
    try {
      const vortData = {
        ...parshaVortFormData,
        content: parshaVortFormData.content || null,
        audioUrl: parshaVortFormData.audioUrl || null,
        videoUrl: parshaVortFormData.videoUrl || null,
        speaker: parshaVortFormData.speaker || null,
        speakerWebsite: parshaVortFormData.speakerWebsite || null,
        thankYouMessage: parshaVortFormData.thankYouMessage || null
      };

      let response;
      if (editingParshaVort) {
        response = await axiosClient.put(`/api/table/vort/${editingParshaVort.id}`, vortData, {
          headers: getAuthHeaders()
        });
      } else {
        response = await axiosClient.post('/api/table/vort', vortData, {
          headers: getAuthHeaders()
        });
      }

      if (response.status === 200 || response.status === 201) {
        toast({
          title: 'Success',
          description: editingParshaVort ? 'Parsha Vort updated successfully!' : 'Parsha Vort created successfully!',
        });
        setParshaVortFormData({
          fromDate: '', untilDate: '', title: '', content: '',
          audioUrl: '', videoUrl: '', speaker: '', speakerWebsite: '', thankYouMessage: ''
        });
        setEditingParshaVort(null);
        queryClient.invalidateQueries({ queryKey: ['admin-parsha-vorts'] });
        await refetchParshaVorts();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save Parsha Vort. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSavingParshaVort(false);
    }
  };

  const handleDeleteParshaVort = async (vort: any) => {
    if (!confirm(`Are you sure you want to delete the Parsha Vort "${vort.title}"?`)) {
      return;
    }

    try {
      const response = await axiosClient.delete(`/api/table/vort/${vort.id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 200 || response.status === 204) {
        toast({
          title: 'Parsha Vort Deleted',
          description: 'The Parsha Vort has been successfully deleted.',
        });
        queryClient.invalidateQueries({ queryKey: ['admin-parsha-vorts'] });
        await refetchParshaVorts();
      }
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete Parsha Vort',
        variant: 'destructive'
      });
    }
  };

  // Notification functions (handles both instant and scheduled)
  const handleSendNotification = async () => {
    if (!notificationData.title || !notificationData.body) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both title and body for the notification.',
        variant: 'destructive'
      });
      return;
    }

    const hasDate = notificationData.scheduledDate.trim() !== '';
    const hasTime = notificationData.scheduledTime.trim() !== '';
    
    // Both date AND time must be provided to schedule, otherwise send instantly
    const isScheduled = hasDate && hasTime;

    setIsSendingNotification(true);
    try {
      if (isScheduled) {
        // Schedule the notification
        const scheduledData = {
          scheduledDate: notificationData.scheduledDate,
          scheduledTime: notificationData.scheduledTime,
          title: notificationData.title,
          message: notificationData.body
        };

        let response;
        if (editingNotification) {
          response = await axiosClient.patch(`/api/scheduled-notifications/${editingNotification.id}`, scheduledData, {
            headers: getAuthHeaders()
          });
        } else {
          response = await axiosClient.post('/api/scheduled-notifications', scheduledData, {
            headers: getAuthHeaders()
          });
        }

        if (response.status === 200 || response.status === 201) {
          toast({
            title: editingNotification ? 'Notification Updated' : 'Notification Scheduled',
            description: `Notification ${editingNotification ? 'updated' : 'scheduled'} for ${notificationData.scheduledDate} at ${notificationData.scheduledTime}`,
          });
          setNotificationData({ title: '', body: '', url: '/', requireInteraction: false, scheduledDate: '', scheduledTime: '' });
          setEditingNotification(null);
          queryClient.invalidateQueries({ queryKey: ['admin-scheduled-notifications'] });
          await refetchScheduledNotifications();
        }
      } else {
        // Send instantly
        const instantData = {
          title: notificationData.title,
          body: notificationData.body,
          url: notificationData.url,
          requireInteraction: notificationData.requireInteraction
        };

        const response = await axiosClient.post('/api/push/send', instantData, {
          headers: getAuthHeaders()
        });

        if (response.status === 200 || response.status === 201) {
          toast({
            title: 'Notification Sent',
            description: `Notification sent to ${response.data.successCount || 'all'} users.`,
          });
          setNotificationData({ title: '', body: '', url: '/', requireInteraction: false, scheduledDate: '', scheduledTime: '' });
          queryClient.invalidateQueries({ queryKey: ['admin-push-history'] });
          await refetchNotificationHistory();
        }
      }
    } catch (error: any) {
      toast({
        title: isScheduled ? 'Schedule Failed' : 'Send Failed',
        description: `Failed to ${isScheduled ? 'schedule' : 'send'} notification. Please try again.`,
        variant: 'destructive'
      });
    } finally {
      setIsSendingNotification(false);
    }
  };

  const handleValidateSubscriptions = async () => {
    setIsValidatingSubscriptions(true);
    try {
      const response = await axiosClient.post('/api/push/validate-subscriptions', {}, {
        headers: getAuthHeaders()
      });

      if (response.status === 200) {
        const { validCount, invalidCount, totalChecked } = response.data;
        toast({
          title: 'Validation Complete',
          description: `Checked ${totalChecked} subscriptions: ${validCount} valid, ${invalidCount} invalid.`,
        });
        await refetchSubscriptions();
        await refetchQueueStatus();
      }
    } catch (error: any) {
      toast({
        title: 'Validation Failed',
        description: 'Failed to validate subscriptions. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsValidatingSubscriptions(false);
    }
  };

  const handleDeleteScheduledNotification = async (notification: ScheduledNotification) => {
    if (!confirm(`Are you sure you want to delete the scheduled notification "${notification.title}"?`)) {
      return;
    }

    try {
      await axiosClient.delete(`/api/scheduled-notifications/${notification.id}`, {
        headers: getAuthHeaders()
      });
      
      toast({
        title: 'Notification Deleted',
        description: 'The scheduled notification has been successfully deleted.',
      });

      queryClient.invalidateQueries({ queryKey: ['admin-scheduled-notifications'] });
      await refetchScheduledNotifications();
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete notification',
        variant: 'destructive'
      });
    }
  };

  // Analytics functions
  const handleLoadDateRangeStats = async () => {
    if (!analyticsStartDate || !analyticsEndDate) {
      toast({
        title: 'Missing Dates',
        description: 'Please select both start and end dates',
        variant: 'destructive'
      });
      return;
    }

    setIsLoadingAnalytics(true);
    try {
      const response = await axiosClient.get(
        `/api/analytics/stats/range?startDate=${analyticsStartDate}&endDate=${analyticsEndDate}`,
        { headers: getAuthHeaders() }
      );
      setDateRangeStats(response.data);
      toast({
        title: 'Analytics Loaded',
        description: 'Successfully loaded analytics for the selected date range'
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
      }
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleLoadWeekComparison = async () => {
    setIsLoadingAnalytics(true);
    try {
      const response = await axiosClient.get('/api/analytics/stats/compare?period=week', {
        headers: getAuthHeaders()
      });
      setWeekComparison(response.data);
      toast({
        title: 'Week Comparison Loaded',
        description: 'Successfully loaded week over week comparison'
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
      }
      toast({
        title: 'Error',
        description: 'Failed to load week comparison',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleLoadMonthComparison = async () => {
    setIsLoadingAnalytics(true);
    try {
      const response = await axiosClient.get('/api/analytics/stats/compare?period=month', {
        headers: getAuthHeaders()
      });
      setMonthComparison(response.data);
      toast({
        title: 'Month Comparison Loaded',
        description: 'Successfully loaded month over month comparison'
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
      }
      toast({
        title: 'Error',
        description: 'Failed to load month comparison',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingAnalytics(false);
    }
  };


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen admin-bg-gradient flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 admin-icon-bg rounded-full">
                <MessageSquare className="w-8 h-8 admin-icon-text" />
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
              className="w-full admin-btn-primary"
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
    <div className="min-h-screen admin-bg-gradient">
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
                  ? 'admin-tab-active'
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
                  ? 'admin-tab-active'
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
                  ? 'admin-tab-active'
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
                  ? 'admin-tab-active'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              data-testid="tab-notifications"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('parsha-vorts')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'parsha-vorts'
                  ? 'admin-tab-active'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              data-testid="tab-parsha-vorts"
            >
              <Scroll className="w-4 h-4 mr-2" />
              Parsha Vorts
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'admin-tab-active'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              data-testid="tab-analytics"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
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
                  className="w-full admin-btn-primary"
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

                {/* Recipe Image Upload */}
                <InlineImageUploader
                  label="Recipe Image"
                  value={recipeFormData.imageUrl}
                  onChange={(url) => setRecipeFormData(prev => ({ ...prev, imageUrl: url }))}
                  onGetUploadParameters={() => handleMediaUpload()}
                  onComplete={(result) => handleMediaUploadComplete(result, 'recipe')}
                  placeholder="Or paste image URL here"
                />

                <Button 
                  onClick={handleRecipeSubmit} 
                  disabled={isSavingRecipe}
                  className="w-full admin-btn-primary"
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
              <div className="space-y-3 max-h-[700px] overflow-y-auto">
                {recipes && recipes.length > 0 ? (
                  recipes.slice(0, 15).map((recipe: any) => {
                    const recipeDate = new Date(recipe.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isFuture = recipeDate >= today;
                    
                    return (
                      <div 
                        key={recipe.id} 
                        className="p-3 bg-gray-50 rounded-lg"
                        data-testid={`recipe-item-${recipe.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              {format(new Date(recipe.date), 'MMM dd, yyyy')} - {recipe.title}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {recipe.description || 'No description'}
                            </div>
                          </div>
                          
                          {/* Only show edit/delete for future recipes */}
                          {isFuture && (
                            <div className="flex gap-2 ml-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Handle edit recipe - you can implement this later
                                  toast({
                                    title: "Edit Recipe",
                                    description: "Recipe editing feature coming soon"
                                  });
                                }}
                                data-testid={`button-edit-recipe-${recipe.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Handle delete recipe - you can implement this later
                                  if (confirm('Are you sure you want to delete this recipe?')) {
                                    toast({
                                      title: "Delete Recipe",
                                      description: "Recipe deletion feature coming soon"
                                    });
                                  }
                                }}
                                data-testid={`button-delete-recipe-${recipe.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recipes found
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Table Inspirations Tab */}
        {activeTab === 'inspirations' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Inspiration Form */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-rose-600" />
                {editingInspiration ? 'Edit' : 'Create New'} Table Inspiration
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="inspiration-from-date">From Date *</Label>
                    <Input
                      id="inspiration-from-date"
                      type="date"
                      value={inspirationFormData.fromDate}
                      onChange={(e) => setInspirationFormData(prev => ({ ...prev, fromDate: e.target.value }))}
                      data-testid="input-inspiration-from-date"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inspiration-until-date">Until Date *</Label>
                    <Input
                      id="inspiration-until-date"
                      type="date"
                      value={inspirationFormData.untilDate}
                      onChange={(e) => setInspirationFormData(prev => ({ ...prev, untilDate: e.target.value }))}
                      data-testid="input-inspiration-until-date"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="inspiration-title">Title *</Label>
                  <Input
                    id="inspiration-title"
                    value={inspirationFormData.title}
                    onChange={(e) => setInspirationFormData(prev => ({ ...prev, title: e.target.value }))}
                    onKeyDown={(e) => {
                      // Prevent space key from triggering button focus
                      if (e.key === ' ') {
                        e.stopPropagation();
                      }
                    }}
                    data-testid="input-inspiration-title"
                    placeholder="Inspiration title"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="inspiration-content">Content *</Label>
                  <Textarea
                    id="inspiration-content"
                    value={inspirationFormData.content}
                    onChange={(e) => setInspirationFormData(prev => ({ ...prev, content: e.target.value }))}
                    onKeyDown={(e) => {
                      // Prevent space key from triggering button focus
                      if (e.key === ' ') {
                        e.stopPropagation();
                      }
                    }}
                    data-testid="textarea-inspiration-content"
                    placeholder="Main inspiration content"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                {/* Media Uploads */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">Media Files (Images/Audio/Video)</h3>
                  
                  {[1, 2, 3, 4, 5].map(index => {
                    const mediaUrlField = `mediaUrl${index}` as keyof typeof inspirationFormData;
                    const mediaTypeField = `mediaType${index}` as keyof typeof inspirationFormData;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium text-gray-700">Media {index} Type:</Label>
                          <select
                            value={inspirationFormData[mediaTypeField]}
                            onChange={(e) => setInspirationFormData(prev => ({ 
                              ...prev, 
                              [mediaTypeField]: e.target.value 
                            }))}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white"
                          >
                            <option value="image">Image</option>
                            <option value="audio">Audio</option>
                            <option value="video">Video</option>
                          </select>
                        </div>
                        
                        <InlineImageUploader
                          label={`Upload ${inspirationFormData[mediaTypeField]} ${index}`}
                          value={inspirationFormData[mediaUrlField]}
                          onChange={(url) => setInspirationFormData(prev => ({ 
                            ...prev, 
                            [mediaUrlField]: url 
                          }))}
                          onGetUploadParameters={() => handleMediaUpload()}
                          onComplete={(result) => handleMediaUploadComplete(result, 'inspiration', mediaUrlField)}
                          placeholder={`Or paste ${inspirationFormData[mediaTypeField]} URL here`}
                          accept={
                            inspirationFormData[mediaTypeField] === 'image' ? 'image/*' : 
                            inspirationFormData[mediaTypeField] === 'audio' ? 'audio/*' : 
                            'video/*'
                          }
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleInspirationSubmit}
                    disabled={isSavingInspiration}
                    className="flex-1 admin-btn-primary"
                    data-testid="button-save-inspiration"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSavingInspiration ? 'Saving...' : (editingInspiration ? 'Update' : 'Create')} Inspiration
                  </Button>
                  
                  {editingInspiration && (
                    <Button 
                      onClick={() => {
                        setEditingInspiration(null);
                        setInspirationFormData({
                          fromDate: '', untilDate: '', title: '', content: '',
                          mediaUrl1: '', mediaType1: 'image', mediaUrl2: '', mediaType2: 'image',
                          mediaUrl3: '', mediaType3: 'image', mediaUrl4: '', mediaType4: 'image',
                          mediaUrl5: '', mediaType5: 'image'
                        });
                      }}
                      variant="outline"
                      data-testid="button-cancel-inspiration"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Recent Inspirations */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-rose-600" />
                Recent Table Inspirations
              </h2>
              
              {inspirations && inspirations.length > 0 ? (
                <div className="space-y-4 max-h-[700px] overflow-y-auto">
                  {inspirations.map((inspiration: any) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const untilDate = new Date(inspiration.untilDate);
                    const isFuture = untilDate >= today;
                    
                    return (
                      <div key={inspiration.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{inspiration.title}</h3>
                            <p className="text-sm text-gray-600">
                              {format(new Date(inspiration.fromDate), 'MMM d')} - {format(new Date(inspiration.untilDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                          
                          {/* Only show edit/delete for future inspirations */}
                          {isFuture && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingInspiration(inspiration);
                                  setInspirationFormData({
                                    fromDate: inspiration.fromDate,
                                    untilDate: inspiration.untilDate,
                                    title: inspiration.title,
                                    content: inspiration.content,
                                    mediaUrl1: inspiration.mediaUrl1 || '',
                                    mediaType1: inspiration.mediaType1 || 'image',
                                    mediaUrl2: inspiration.mediaUrl2 || '',
                                    mediaType2: inspiration.mediaType2 || 'image',
                                    mediaUrl3: inspiration.mediaUrl3 || '',
                                    mediaType3: inspiration.mediaType3 || 'image',
                                    mediaUrl4: inspiration.mediaUrl4 || '',
                                    mediaType4: inspiration.mediaType4 || 'image',
                                    mediaUrl5: inspiration.mediaUrl5 || '',
                                    mediaType5: inspiration.mediaType5 || 'image'
                                  });
                                }}
                                data-testid={`button-edit-inspiration-${inspiration.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteInspiration(inspiration)}
                                data-testid={`button-delete-inspiration-${inspiration.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2 leading-relaxed">{inspiration.content}</p>
                        
                        {/* Show media files if any */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map(index => {
                            const mediaUrl = inspiration[`mediaUrl${index}`];
                            const mediaType = inspiration[`mediaType${index}`];
                            if (mediaUrl) {
                              return (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-700">
                                  <Image className="w-3 h-3 mr-1" />
                                  {mediaType} {index}
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No table inspirations found
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Parsha Vorts Tab */}
        {activeTab === 'parsha-vorts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Parsha Vort Form */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-rose-600" />
                {editingParshaVort ? 'Edit' : 'Create New'} Parsha Vort
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vort-from-date">From Date *</Label>
                    <Input
                      id="vort-from-date"
                      type="date"
                      value={parshaVortFormData.fromDate}
                      onChange={(e) => setParshaVortFormData(prev => ({ ...prev, fromDate: e.target.value }))}
                      data-testid="input-vort-from-date"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vort-until-date">Until Date *</Label>
                    <Input
                      id="vort-until-date"
                      type="date"
                      value={parshaVortFormData.untilDate}
                      onChange={(e) => setParshaVortFormData(prev => ({ ...prev, untilDate: e.target.value }))}
                      data-testid="input-vort-until-date"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="vort-title">Title *</Label>
                  <Input
                    id="vort-title"
                    value={parshaVortFormData.title}
                    onChange={(e) => setParshaVortFormData(prev => ({ ...prev, title: e.target.value }))}
                    data-testid="input-vort-title"
                    placeholder="Parsha Vort title"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="vort-content">Content</Label>
                  <Textarea
                    id="vort-content"
                    value={parshaVortFormData.content}
                    onChange={(e) => setParshaVortFormData(prev => ({ ...prev, content: e.target.value }))}
                    data-testid="textarea-vort-content"
                    placeholder="Optional written content"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="vort-audio-url">Audio URL</Label>
                  <Input
                    id="vort-audio-url"
                    value={parshaVortFormData.audioUrl}
                    onChange={(e) => setParshaVortFormData(prev => ({ ...prev, audioUrl: e.target.value }))}
                    data-testid="input-vort-audio-url"
                    placeholder="Audio URL (at least one media required)"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="vort-video-url">Video URL</Label>
                  <Input
                    id="vort-video-url"
                    value={parshaVortFormData.videoUrl}
                    onChange={(e) => setParshaVortFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    data-testid="input-vort-video-url"
                    placeholder="Video URL (at least one media required)"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="vort-speaker">Speaker</Label>
                  <Input
                    id="vort-speaker"
                    value={parshaVortFormData.speaker}
                    onChange={(e) => setParshaVortFormData(prev => ({ ...prev, speaker: e.target.value }))}
                    data-testid="input-vort-speaker"
                    placeholder="Speaker name (optional)"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="vort-speaker-website">Speaker Website</Label>
                  <Input
                    id="vort-speaker-website"
                    value={parshaVortFormData.speakerWebsite}
                    onChange={(e) => setParshaVortFormData(prev => ({ ...prev, speakerWebsite: e.target.value }))}
                    data-testid="input-vort-speaker-website"
                    placeholder="Speaker website URL (optional)"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="vort-thank-you">Thank You Message</Label>
                  <Textarea
                    id="vort-thank-you"
                    value={parshaVortFormData.thankYouMessage}
                    onChange={(e) => setParshaVortFormData(prev => ({ ...prev, thankYouMessage: e.target.value }))}
                    data-testid="textarea-vort-thank-you"
                    placeholder="Custom thank you message (supports markdown links)"
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleParshaVortSubmit}
                    disabled={isSavingParshaVort}
                    className="flex-1 admin-btn-primary"
                    data-testid="button-save-vort"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSavingParshaVort ? 'Saving...' : (editingParshaVort ? 'Update' : 'Create')} Parsha Vort
                  </Button>
                  
                  {editingParshaVort && (
                    <Button 
                      onClick={() => {
                        setEditingParshaVort(null);
                        setParshaVortFormData({
                          fromDate: '', untilDate: '', title: '', content: '',
                          audioUrl: '', videoUrl: '', speaker: '', speakerWebsite: '', thankYouMessage: ''
                        });
                      }}
                      variant="outline"
                      data-testid="button-cancel-vort"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Recent Parsha Vorts */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Scroll className="w-5 h-5 mr-2 text-rose-600" />
                Recent Parsha Vorts
              </h2>
              
              {parshaVorts && parshaVorts.length > 0 ? (
                <div className="space-y-4 max-h-[700px] overflow-y-auto">
                  {parshaVorts.map((vort: any) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const untilDate = new Date(vort.untilDate);
                    const isFuture = untilDate >= today;
                    
                    return (
                      <div key={vort.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{vort.title}</h3>
                            <p className="text-sm text-gray-600">
                              {format(new Date(vort.fromDate), 'MMM d')} - {format(new Date(vort.untilDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                          
                          {/* Only show edit/delete for future vorts */}
                          {isFuture && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingParshaVort(vort);
                                  setParshaVortFormData({
                                    fromDate: vort.fromDate,
                                    untilDate: vort.untilDate,
                                    title: vort.title,
                                    content: vort.content || '',
                                    audioUrl: vort.audioUrl || '',
                                    videoUrl: vort.videoUrl || '',
                                    speaker: vort.speaker || '',
                                    speakerWebsite: vort.speakerWebsite || '',
                                    thankYouMessage: vort.thankYouMessage || ''
                                  });
                                }}
                                data-testid={`button-edit-vort-${vort.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteParshaVort(vort)}
                                data-testid={`button-delete-vort-${vort.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {vort.speaker && (
                          <p className="text-sm text-gray-700 mb-2">
                            <span className="font-medium">Speaker:</span> {vort.speaker}
                          </p>
                        )}
                        
                        {vort.content && (
                          <p className="text-sm text-gray-700 mb-2 leading-relaxed line-clamp-2">{vort.content}</p>
                        )}
                        
                        {/* Show media types available */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {vort.audioUrl && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                              Audio
                            </span>
                          )}
                          {vort.videoUrl && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                              Video
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No Parsha Vorts found
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-8">
            {/* Subscription Health Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Active Subscriptions */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-green-600">
                      {subscriptions?.filter((sub: any) => sub.subscribed).length || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-green-600 opacity-50" />
                </div>
              </Card>

              {/* Invalid Subscriptions */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Invalid Subscriptions</p>
                    <p className="text-2xl font-bold text-red-600">
                      {subscriptions?.filter((sub: any) => !sub.subscribed || (sub.validationFailures || 0) >= 3).length || 0}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600 opacity-50" />
                </div>
              </Card>

              {/* Retry Queue */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Retries</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {queueStatus?.queueSize || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600 opacity-50" />
                </div>
              </Card>
            </div>

            {/* Validation Button */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Subscription Validation</h3>
                  <p className="text-sm text-gray-600">
                    Test all subscriptions and remove invalid ones. Recommended to run every 24 hours.
                  </p>
                </div>
                <Button 
                  onClick={handleValidateSubscriptions} 
                  disabled={isValidatingSubscriptions}
                  className="admin-btn-primary"
                  data-testid="button-validate-subscriptions"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isValidatingSubscriptions ? 'Validating...' : 'Validate All'}
                </Button>
              </div>
            </Card>

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

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Optional:</strong> Schedule for later (leave empty to send instantly)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="notification-date">Date (optional)</Label>
                      <Input
                        id="notification-date"
                        type="date"
                        value={notificationData.scheduledDate}
                        onChange={(e) => setNotificationData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                        data-testid="input-notification-date"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notification-time">Time (optional)</Label>
                      <Input
                        id="notification-time"
                        type="time"
                        value={notificationData.scheduledTime}
                        onChange={(e) => setNotificationData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                        data-testid="input-notification-time"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSendNotification} 
                  disabled={isSendingNotification}
                  className="w-full admin-btn-primary"
                  data-testid="button-send-notification"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSendingNotification 
                    ? (notificationData.scheduledDate && notificationData.scheduledTime ? 'Scheduling...' : 'Sending...') 
                    : (notificationData.scheduledDate && notificationData.scheduledTime ? 'Schedule Notification' : 'Send Notification')
                  }
                </Button>

                {editingNotification && (
                  <Button 
                    onClick={() => {
                      setEditingNotification(null);
                      setNotificationData({ title: '', body: '', url: '/', requireInteraction: false, scheduledDate: '', scheduledTime: '' });
                    }}
                    variant="outline"
                    className="w-full"
                    data-testid="button-cancel-notification"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Card>

            {/* Notification History & Scheduled Notifications */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Notifications</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {/* Scheduled Notifications */}
                {scheduledNotifications && scheduledNotifications.length > 0 && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Scheduled</h3>
                    {scheduledNotifications.map((notification: ScheduledNotification) => (
                      <div 
                        key={notification.id} 
                        className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                        data-testid={`scheduled-notification-item-${notification.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              {notification.title}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </div>
                            <div className="text-xs text-gray-500 mt-2 flex items-center gap-3">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {format(new Date(notification.scheduledDate), 'MMM dd, yyyy')} at {notification.scheduledTime}
                              </span>
                              {notification.sent && notification.sentAt && (
                                <span className="flex items-center text-green-600">
                                  <CheckCircle className="w-3 h-3 inline mr-1" />
                                  Sent {format(new Date(notification.sentAt), 'MMM dd, HH:mm')}
                                </span>
                              )}
                              {!notification.sent && (
                                <span className="flex items-center text-blue-600">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                          {!notification.sent && (
                            <div className="flex gap-2 ml-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingNotification(notification);
                                  setNotificationData({
                                    title: notification.title,
                                    body: notification.message,
                                    url: '/',
                                    requireInteraction: false,
                                    scheduledDate: notification.scheduledDate,
                                    scheduledTime: notification.scheduledTime
                                  });
                                }}
                                data-testid={`button-edit-scheduled-${notification.id}`}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteScheduledNotification(notification)}
                                data-testid={`button-delete-scheduled-${notification.id}`}
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Sent Notifications */}
                {notificationHistory && notificationHistory.length > 0 && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">Sent</h3>
                    {notificationHistory.slice(0, 10).map((notification: any, index: number) => (
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
                    ))}
                  </>
                )}

                {(!notificationHistory || notificationHistory.length === 0) && (!scheduledNotifications || scheduledNotifications.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No notifications yet
                  </div>
                )}
              </div>
            </Card>
          </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Date Range Stats */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-rose-600" />
                Custom Date Range Analytics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="analytics-start-date">Start Date</Label>
                  <Input
                    id="analytics-start-date"
                    type="date"
                    value={analyticsStartDate}
                    onChange={(e) => setAnalyticsStartDate(e.target.value)}
                    className="mt-1"
                    data-testid="input-analytics-start-date"
                  />
                </div>
                <div>
                  <Label htmlFor="analytics-end-date">End Date</Label>
                  <Input
                    id="analytics-end-date"
                    type="date"
                    value={analyticsEndDate}
                    onChange={(e) => setAnalyticsEndDate(e.target.value)}
                    className="mt-1"
                    data-testid="input-analytics-end-date"
                  />
                </div>
              </div>

              <Button 
                onClick={handleLoadDateRangeStats}
                disabled={isLoadingAnalytics}
                className="w-full admin-btn-primary" 
                data-testid="button-load-analytics"
              >
                {isLoadingAnalytics ? 'Loading...' : 'Load Analytics'}
              </Button>

              {/* Stats will be displayed here after loading */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 font-medium">Total Users</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {dateRangeStats ? dateRangeStats.totalUsers.toLocaleString() : '-'}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 font-medium">Total Acts</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {dateRangeStats ? dateRangeStats.totalActs.toLocaleString() : '-'}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 font-medium">Tehillim</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {dateRangeStats ? dateRangeStats.totalTehillimCompleted.toLocaleString() : '-'}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 font-medium">Money Raised</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {dateRangeStats ? `$${(dateRangeStats.moneyRaised / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '$-'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Week over Week Comparison */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Week over Week Comparison
              </h2>

              <Button 
                onClick={handleLoadWeekComparison}
                disabled={isLoadingAnalytics}
                className="w-full admin-btn-primary mb-4" 
                data-testid="button-load-week-comparison"
              >
                {isLoadingAnalytics ? 'Loading...' : 'Load Week Comparison'}
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Week */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">This Week</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Users</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{weekComparison ? weekComparison.current.totalUsers.toLocaleString() : '-'}</span>
                        {weekComparison && (
                          <span className={`text-xs flex items-center ${weekComparison.changes.users > 0 ? 'text-green-600' : weekComparison.changes.users < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {weekComparison.changes.users > 0 ? <TrendingUp className="w-3 h-3" /> : weekComparison.changes.users < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                            {weekComparison.changes.users > 0 ? '+' : ''}{weekComparison.changes.users.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Total Acts</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{weekComparison ? weekComparison.current.totalActs.toLocaleString() : '-'}</span>
                        {weekComparison && (
                          <span className={`text-xs flex items-center ${weekComparison.changes.acts > 0 ? 'text-green-600' : weekComparison.changes.acts < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {weekComparison.changes.acts > 0 ? <TrendingUp className="w-3 h-3" /> : weekComparison.changes.acts < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                            {weekComparison.changes.acts > 0 ? '+' : ''}{weekComparison.changes.acts.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Tehillim</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{weekComparison ? weekComparison.current.totalTehillimCompleted.toLocaleString() : '-'}</span>
                        {weekComparison && (
                          <span className={`text-xs flex items-center ${weekComparison.changes.tehillim > 0 ? 'text-green-600' : weekComparison.changes.tehillim < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {weekComparison.changes.tehillim > 0 ? <TrendingUp className="w-3 h-3" /> : weekComparison.changes.tehillim < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                            {weekComparison.changes.tehillim > 0 ? '+' : ''}{weekComparison.changes.tehillim.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Money Raised</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{weekComparison ? `$${(weekComparison.current.moneyRaised / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '$-'}</span>
                        {weekComparison && (
                          <span className={`text-xs flex items-center ${weekComparison.changes.moneyRaised > 0 ? 'text-green-600' : weekComparison.changes.moneyRaised < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {weekComparison.changes.moneyRaised > 0 ? <TrendingUp className="w-3 h-3" /> : weekComparison.changes.moneyRaised < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                            {weekComparison.changes.moneyRaised > 0 ? '+' : ''}{weekComparison.changes.moneyRaised.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Previous Week */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Last Week</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Users</span>
                      <span className="font-semibold">{weekComparison ? weekComparison.previous.totalUsers.toLocaleString() : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Total Acts</span>
                      <span className="font-semibold">{weekComparison ? weekComparison.previous.totalActs.toLocaleString() : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Tehillim</span>
                      <span className="font-semibold">{weekComparison ? weekComparison.previous.totalTehillimCompleted.toLocaleString() : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Money Raised</span>
                      <span className="font-semibold">{weekComparison ? `$${(weekComparison.previous.moneyRaised / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '$-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Month over Month Comparison */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                Month over Month Comparison
              </h2>

              <Button 
                onClick={handleLoadMonthComparison}
                disabled={isLoadingAnalytics}
                className="w-full admin-btn-primary mb-4" 
                data-testid="button-load-month-comparison"
              >
                {isLoadingAnalytics ? 'Loading...' : 'Load Month Comparison'}
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Month */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">This Month</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Users</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{monthComparison ? monthComparison.current.totalUsers.toLocaleString() : '-'}</span>
                        {monthComparison && (
                          <span className={`text-xs flex items-center ${monthComparison.changes.users > 0 ? 'text-green-600' : monthComparison.changes.users < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {monthComparison.changes.users > 0 ? <TrendingUp className="w-3 h-3" /> : monthComparison.changes.users < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                            {monthComparison.changes.users > 0 ? '+' : ''}{monthComparison.changes.users.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Total Acts</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{monthComparison ? monthComparison.current.totalActs.toLocaleString() : '-'}</span>
                        {monthComparison && (
                          <span className={`text-xs flex items-center ${monthComparison.changes.acts > 0 ? 'text-green-600' : monthComparison.changes.acts < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {monthComparison.changes.acts > 0 ? <TrendingUp className="w-3 h-3" /> : monthComparison.changes.acts < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                            {monthComparison.changes.acts > 0 ? '+' : ''}{monthComparison.changes.acts.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Tehillim</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{monthComparison ? monthComparison.current.totalTehillimCompleted.toLocaleString() : '-'}</span>
                        {monthComparison && (
                          <span className={`text-xs flex items-center ${monthComparison.changes.tehillim > 0 ? 'text-green-600' : monthComparison.changes.tehillim < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {monthComparison.changes.tehillim > 0 ? <TrendingUp className="w-3 h-3" /> : monthComparison.changes.tehillim < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                            {monthComparison.changes.tehillim > 0 ? '+' : ''}{monthComparison.changes.tehillim.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Money Raised</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{monthComparison ? `$${(monthComparison.current.moneyRaised / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '$-'}</span>
                        {monthComparison && (
                          <span className={`text-xs flex items-center ${monthComparison.changes.moneyRaised > 0 ? 'text-green-600' : monthComparison.changes.moneyRaised < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {monthComparison.changes.moneyRaised > 0 ? <TrendingUp className="w-3 h-3" /> : monthComparison.changes.moneyRaised < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                            {monthComparison.changes.moneyRaised > 0 ? '+' : ''}{monthComparison.changes.moneyRaised.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Previous Month */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Last Month</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Users</span>
                      <span className="font-semibold">{monthComparison ? monthComparison.previous.totalUsers.toLocaleString() : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Total Acts</span>
                      <span className="font-semibold">{monthComparison ? monthComparison.previous.totalActs.toLocaleString() : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Tehillim</span>
                      <span className="font-semibold">{monthComparison ? monthComparison.previous.totalTehillimCompleted.toLocaleString() : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Money Raised</span>
                      <span className="font-semibold">{monthComparison ? `$${(monthComparison.previous.moneyRaised / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '$-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}