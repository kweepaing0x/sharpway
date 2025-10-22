import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { Store } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const ApprovalQueue: React.FC = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingStores();
  }, []);

  const fetchPendingStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (error: any) {
      console.error('Error fetching pending stores:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (storeId: string, status: 'approved' | 'rejected') => {
    setProcessingId(storeId);
    try {
      const { error } = await supabase
        .from('stores')
        .update({ 
          approval_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId);

      if (error) throw error;

      // Update local state
      setStores(stores.filter(store => store.id !== storeId));
      
      // TODO: Send notification email to store owner
    } catch (error: any) {
      console.error('Error updating store status:', error);
      setError(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/stores')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Stores
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Store Approval Queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and approve pending store applications
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading pending stores...</p>
        </div>
      ) : stores.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
              <p className="mt-1 text-gray-500">No pending store applications to review.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {stores.map(store => (
            <Card key={store.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{store.name}</span>
                  <span className="px-2 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
                    Pending Review
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Store Details</h4>
                    <div className="space-y-2">
                      <p className="text-gray-900">{store.description}</p>
                      <p className="text-sm text-gray-600">
                        Category: <span className="font-medium">{store.category}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Location: <span className="font-medium">{store.location}</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Payment Methods</h4>
                    <div className="space-y-1">
                      {Object.entries(store.payment_methods).map(([method, enabled]) => (
                        method !== 'wallet_addresses' && (
                          <p key={method} className="text-sm text-gray-600">
                            {method.toUpperCase()}: 
                            <span className={`ml-2 ${enabled ? 'text-green-600' : 'text-red-600'}`}>
                              {enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </p>
                        )
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    variant="secondary"
                    onClick={() => handleApproval(store.id, 'rejected')}
                    isLoading={processingId === store.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleApproval(store.id, 'approved')}
                    isLoading={processingId === store.id}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApprovalQueue;