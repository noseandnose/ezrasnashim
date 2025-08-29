import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Send, Bell, Clock, Users, CheckCircle, XCircle, ArrowLeft, ChefHat } from 'lucide-react';
import { Link } from 'wouter';

export default function AdminNotifications() {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [requireInteraction, setRequireInteraction] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Fetch notification history if authenticated
  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ['/api/push/history', adminPassword],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/push/history?adminPassword=${encodeURIComponent(adminPassword)}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const handleLogin = () => {
    if (adminPassword) {
      setIsAuthenticated(true);
    }
  };

  const handleSendNotification = async () => {
    if (!title || !body) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both title and body for the notification.',
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await apiRequest('POST', '/api/push/send', {
        title,
        body,
        url,
        requireInteraction,
        adminPassword
      });

      // Access the actual data from the Axios response
      const result = response.data;

      if (result.success) {
        toast({
          title: 'Notification Sent!',
          description: result.message,
        });
        
        // Clear form
        setTitle('');
        setBody('');
        setUrl('/');
        setRequireInteraction(false);
        
        // Refresh history
        refetchHistory();
      } else {
        toast({
          title: 'Failed to Send',
          description: result.message || 'No active subscriptions found.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || error?.message || 'Failed to send notification.',
        variant: 'destructive'
      });
      
      // If unauthorized, reset authentication
      if (error?.response?.status === 401) {
        setIsAuthenticated(false);
        setAdminPassword('');
      }
    } finally {
      setIsSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blush/10 to-white p-4">
        <div className="max-w-md mx-auto mt-20">
          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
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
                />
              </div>
              <Button onClick={handleLogin} className="w-full">
                Login
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to App
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blush/10 to-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Push Notifications Admin
          </h1>
          <div className="flex gap-2">
            <Link href="/admin/recipes">
              <Button variant="outline">
                <ChefHat className="w-4 h-4 mr-2" />
                Recipes Admin
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Send Notification Form */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Send Notification</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification title"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Notification message"
                  rows={4}
                  maxLength={500}
                />
              </div>

              <div>
                <Label htmlFor="url">Click URL (optional)</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requireInteraction"
                  checked={requireInteraction}
                  onChange={(e) => setRequireInteraction(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="requireInteraction" className="cursor-pointer">
                  Require user interaction to dismiss
                </Label>
              </div>

              <Button 
                onClick={handleSendNotification} 
                disabled={isSending || !title || !body}
                className="w-full"
              >
                {isSending ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Notification
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Notification History */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Notifications</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {history && history.length > 0 ? (
                history.slice(0, 10).map((notification: any) => (
                  <div key={notification.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{notification.body}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notification.sentAt).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {notification.sentCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {notification.successCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-500" />
                        {notification.failureCount}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No notifications sent yet</p>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Templates */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Quick Templates</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setTitle('Shabbat Times Available');
                setBody('Check this week\'s Shabbat times in the app.');
                setUrl('/');
              }}
            >
              Shabbat Times
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTitle('Daily Torah Study');
                setBody('Today\'s Torah portion is ready for you.');
                setUrl('/?section=torah');
              }}
            >
              Torah Study
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTitle('Prayer Reminder');
                setBody('Time for Mincha prayers.');
                setUrl('/?section=tefilla');
              }}
            >
              Prayer Time
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTitle('New Campaign');
                setBody('Support our new tzedaka campaign.');
                setUrl('/?section=tzedaka');
              }}
            >
              Tzedaka
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}