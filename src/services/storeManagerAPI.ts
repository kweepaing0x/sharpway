const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

class StoreManagerAPI {
  private getAuthHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getStore(token: string) {
    const response = await fetch(`${BACKEND_URL}/api/store-manager/store`, {
      headers: this.getAuthHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch store');
    }
    
    return response.json();
  }

  async updateStore(token: string, storeData: any) {
    const response = await fetch(`${BACKEND_URL}/api/store-manager/store`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(storeData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update store');
    }
    
    return response.json();
  }

  async getProducts(token: string) {
    const response = await fetch(`${BACKEND_URL}/api/store-manager/products`, {
      headers: this.getAuthHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    return response.json();
  }

  async createProduct(token: string, productData: any) {
    const response = await fetch(`${BACKEND_URL}/api/store-manager/products`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create product');
    }
    
    return response.json();
  }

  async getProduct(token: string, productId: string) {
    const response = await fetch(`${BACKEND_URL}/api/store-manager/products/${productId}`, {
      headers: this.getAuthHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }
    
    return response.json();
  }

  async updateProduct(token: string, productId: string, productData: any) {
    const response = await fetch(`${BACKEND_URL}/api/store-manager/products/${productId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update product');
    }
    
    return response.json();
  }

  async deleteProduct(token: string, productId: string) {
    const response = await fetch(`${BACKEND_URL}/api/store-manager/products/${productId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete product');
    }
    
    return response.json();
  }

  async getOrders(token: string) {
    const response = await fetch(`${BACKEND_URL}/api/store-manager/orders`, {
      headers: this.getAuthHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    return response.json();
  }

  async getOrder(token: string, orderId: string) {
    const response = await fetch(`${BACKEND_URL}/api/store-manager/orders/${orderId}`, {
      headers: this.getAuthHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }
    
    return response.json();
  }

  async updateOrderStatus(token: string, orderId: string, status: string) {
    const response = await fetch(`${BACKEND_URL}/api/store-manager/orders/${orderId}/status`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update order status');
    }
    
    return response.json();
  }

  async uploadImage(token: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BACKEND_URL}/api/store-manager/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    return response.json();
  }

  async getStats(token: string) {
    const response = await fetch(`${BACKEND_URL}/api/store-manager/stats`, {
      headers: this.getAuthHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    
    return response.json();
  }
}

export const storeManagerAPI = new StoreManagerAPI();

