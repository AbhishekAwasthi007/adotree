const API_BASE_URL = 'http://localhost:8000/api/v1';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Global API Fetch helper supporting auto-token insertion and auto-refresh
async function fetchAPI(endpoint: string, options: RequestOptions = {}) {
  const headers = { ...options.headers };
  
  // Attach Access JWT Token if present
  const accessToken = localStorage.getItem('access_token');
  if (accessToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Set default Content-Type to JSON if not uploading multipart form data
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle Token Refresh logic on 401 errors
  if (response.status === 401 && accessToken) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const newTokens = await refreshResponse.json();
          localStorage.setItem('access_token', newTokens.access_token);
          localStorage.setItem('refresh_token', newTokens.refresh_token);

          // Retry original request with the fresh token
          headers['Authorization'] = `Bearer ${newTokens.access_token}`;
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
          return await handleResponse(retryResponse);
        } else {
          // Refresh token expired or reuse detected
          clearTokens();
          window.location.reload();
        }
      } catch (err) {
        clearTokens();
        window.location.reload();
      }
    }
  }

  return await handleResponse(response);
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    let errorMessage = 'Something went wrong';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  if (response.status === 204) return null;
  return await response.json();
}

function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export const api = {
  // Authentication
  auth: {
    sendOTP: (mobile: string) =>
      fetchAPI('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ mobile }),
      }),
    verifyOTP: async (mobile: string, otp: string, loginAs?: string, name?: string) => {
      const data = await fetchAPI('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ mobile, otp, login_as: loginAs || null, name: name || null }),
      });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      return data;
    },
    logout: async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          await fetchAPI('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
        } catch {}
      }
      clearTokens();
    },
    getMe: () => fetchAPI('/users/me'),
    updateMe: (payload: { name?: string; profile_image?: string }) =>
      fetchAPI('/users/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
  },

  // Trees Catalog
  trees: {
    list: (type?: string, search?: string) => {
      let query = '';
      const params = new URLSearchParams();
      if (type) params.append('fruit_type', type);
      if (search) params.append('search_query', search);
      const queryString = params.toString();
      if (queryString) query = `?${queryString}`;
      return fetchAPI(`/trees${query}`);
    },
    get: (id: string) => fetchAPI(`/trees/${id}`),
  },
  // Farms Catalog (used internally by Farmer OS for tree registration locations)
  farms: {
    list: () => fetchAPI('/farms/'),
    create: (payload: { name: string; cover_image: string; gallery: string[]; soil_type: string; farm_size: number }) =>
      fetchAPI('/farms/', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
  // Adoptions and Orchard
  adoptions: {
    createOrder: (treeId: string, customTreeName?: string, occasionType?: string, dedicationMessage?: string) =>
      fetchAPI('/adoptions/', {
        method: 'POST',
        body: JSON.stringify({
          tree_id: treeId,
          custom_tree_name: customTreeName,
          occasion_type: occasionType,
          dedication_message: dedicationMessage,
          adoption_duration: 12, // Default to 12 months
        }),
      }),
    verifyPayment: (payload: {
      tree_id: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      custom_tree_name?: string;
      occasion_type?: string;
      dedication_message?: string;
    }) =>
      fetchAPI('/payments/verify', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getMyOrchard: () => fetchAPI('/adoptions/my-orchard'),
  },

  // Live Stream & Ceremonies
  ceremonies: {
    get: (adoptionId: string) => fetchAPI(`/ceremonies/${adoptionId}`),
  },

  // Timeline / Memories
  memories: {
    list: (adoptionId: string) => fetchAPI(`/memories/${adoptionId}`),
  },

  // Admin Portal & Analytics
  admin: {
    getUsers: () => fetchAPI('/admin/users'),
    getFarmers: () => fetchAPI('/admin/farmers'),
    approveFarmer: (farmerId: string, verified: boolean) =>
      fetchAPI(`/admin/farmer/approve?farmer_id=${farmerId}&verified=${verified}`, {
        method: 'PUT',
      }),
    getAnalytics: () => fetchAPI('/admin/analytics'),
  },

  // Farmer Dashboard Panel
  farmer: {
    getTrees: () => fetchAPI('/farmer/trees'),
    createTree: (payload: {
      farm_id: string;
      fruit_type: string;
      tree_age: number;
      health_score: number;
      expected_yield: number;
      price: number;
      tree_images: string[];
      live_camera_enabled: boolean;
    }) =>
      fetchAPI('/farmer/tree', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    updateTree: (id: string, payload: any) =>
      fetchAPI(`/farmer/tree/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    uploadStory: (title: string, description: string, media?: string[], treeId?: string) => {
      const params = new URLSearchParams({ title, description });
      if (treeId) params.append('tree_id', treeId);
      if (media?.length) media.forEach(m => params.append('media', m));
      return fetchAPI(`/farmer/story?${params.toString()}`, { method: 'POST' });
    },
    createHarvest: (payload: { tree_id: string; quantity: number; quality_grade: string }) =>
      fetchAPI('/farmer/harvest', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    controlLivestream: (treeId: string, isLive: boolean, streamUrl?: string) => {
      const params = new URLSearchParams({ tree_id: treeId, is_live: String(isLive) });
      if (streamUrl) params.append('stream_url', streamUrl);
      return fetchAPI(`/farmer/livestream?${params.toString()}`, {
        method: 'POST',
      });
    },
    uploadImage: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetchAPI('/farmer/upload-image', {
        method: 'POST',
        body: formData,
      });
    },
  },

  // Chat
  chat: {
    getConversations: () => fetchAPI('/chat/conversations'),
    getMessages: (adoptionId: string) => fetchAPI(`/chat/messages/${adoptionId}`),
    sendMessage: (adoptionId: string, message: string) =>
      fetchAPI('/chat/send', {
        method: 'POST',
        body: JSON.stringify({ adoption_id: adoptionId, message }),
      }),
  },

  // WebSockets Helper
  websockets: {
    getUserSocket: (onMessage: (event: string, data: any) => void) => {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      
      const wsUrl = `ws://localhost:8000/api/v1/ws/user?token=${token}`;
      const socket = new WebSocket(wsUrl);
      
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          onMessage(payload.event, payload.data);
        } catch {}
      };
      
      return socket;
    },
    getAdoptionSocket: (adoptionId: string, onMessage: (event: string, data: any) => void) => {
      const wsUrl = `ws://localhost:8000/api/v1/ws/adoption/${adoptionId}`;
      const socket = new WebSocket(wsUrl);
      
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          onMessage(payload.event, payload.data);
        } catch {}
      };
      
      return socket;
    }
  }
};
