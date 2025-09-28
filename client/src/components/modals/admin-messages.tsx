@@ .. @@
   // Fetch upcoming messages if authenticated
   const { data: messages, refetch: refetchMessages } = useQuery({
     queryKey: ['/api/messages', { upcoming: true }],
-    queryFn: async () => {
-      if (!isAuthenticated) return [];
-      try {
-        const response = await axiosClient.get('/api/messages?upcoming=true', {
-          headers: getAuthHeaders()
-        });
-        return response.data;
-      } catch (error: any) {
-        if (error.response?.status === 401) {
-          setIsAuthenticated(false);
-          throw new Error('Authentication expired');
-        }
-        throw error;
-      }
-    },
     enabled: isAuthenticated,
   });