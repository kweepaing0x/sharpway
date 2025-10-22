import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { Clock, CheckCircle } from 'lucide-react';
import { TIME_ZONES } from '../../../utils/timeZoneUtils';
import { useTimeZoneStore } from '../../../stores/useTimeZoneStore';
import { getCurrentTimeInTimeZone, formatTime } from '../../../utils/timeZoneUtils';
import { format } from 'date-fns';

const TimeZoneSettings: React.FC = () => {
  const { adminTimeZone, setAdminTimeZone } = useTimeZoneStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleTimeZoneChange = (timeZone: string) => {
    setLoading(true);
    
    try {
      setAdminTimeZone(timeZone);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating time zone:', error);
    } finally {
      setLoading(false);
    }
  };

  const mmtTime = getCurrentTimeInTimeZone(TIME_ZONES.MMT);
  const ictTime = getCurrentTimeInTimeZone(TIME_ZONES.ICT);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Time Zone Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md animate-in fade-in duration-200">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Time zone settings updated successfully!</span>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-medium mb-3">Admin Panel Time Zone</h3>
          <p className="text-sm text-gray-500 mb-4">
            Choose the time zone for the admin panel. This affects how times are displayed in the admin interface.
            All working hours are still stored in Myanmar Time (MMT) regardless of this setting.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Myanmar Time Option */}
            <div 
              className={`
                border-2 rounded-lg p-4 cursor-pointer transition-all
                ${adminTimeZone === TIME_ZONES.MMT 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'}
              `}
              onClick={() => handleTimeZoneChange(TIME_ZONES.MMT)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Myanmar Time (MMT)</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    UTC+6:30
                  </p>
                  <p className="text-sm font-medium mt-2">
                    Current time: {format(mmtTime, 'h:mm a')}
                  </p>
                </div>
                <div className={`
                  w-5 h-5 rounded-full border
                  ${adminTimeZone === TIME_ZONES.MMT 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-300'}
                `}>
                  {adminTimeZone === TIME_ZONES.MMT && (
                    <CheckCircle className="h-5 w-5 text-white" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Thailand Time Option */}
            <div 
              className={`
                border-2 rounded-lg p-4 cursor-pointer transition-all
                ${adminTimeZone === TIME_ZONES.ICT 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'}
              `}
              onClick={() => handleTimeZoneChange(TIME_ZONES.ICT)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Thailand Time (ICT)</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    UTC+7:00
                  </p>
                  <p className="text-sm font-medium mt-2">
                    Current time: {format(ictTime, 'h:mm a')}
                  </p>
                </div>
                <div className={`
                  w-5 h-5 rounded-full border
                  ${adminTimeZone === TIME_ZONES.ICT 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-300'}
                `}>
                  {adminTimeZone === TIME_ZONES.ICT && (
                    <CheckCircle className="h-5 w-5 text-white" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-700">Important Note</h4>
          <p className="mt-2 text-sm text-blue-600">
            All store working hours are stored and displayed in Myanmar Time (MMT) for consistency. 
            This setting only affects how times are displayed in the admin panel.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeZoneSettings;