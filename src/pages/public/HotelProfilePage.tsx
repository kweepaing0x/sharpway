import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Hotel, HotelRoom } from '../../types';
import { Phone, MessageCircle, ArrowLeft, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import BottomNavigation from '../../components/layout/BottomNavigation';
import { generateHotelCheckInMessage, openTelegramLink } from '../../utils/telegram';

const HotelProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        setLoading(true);

        const { data: hotelData, error: hotelError } = await supabase
          .from('hotels')
          .select('*')
          .eq('username', username)
          .eq('is_active', true)
          .eq('approval_status', 'approved')
          .maybeSingle();

        if (hotelError) throw hotelError;
        if (!hotelData) {
          navigate('/hotels');
          return;
        }

        setHotel(hotelData);

        const { data: roomsData, error: roomsError } = await supabase
          .from('hotel_rooms')
          .select('*')
          .eq('hotel_id', hotelData.id)
          .order('floor_number')
          .order('room_number');

        if (roomsError) throw roomsError;
        setRooms(roomsData || []);
      } catch (error: any) {
        console.error('Error fetching hotel:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHotel();
  }, [username, navigate]);

  const handleRoomClick = (room: HotelRoom) => {
    if (room.availability_status === 'available') {
      setSelectedRoom(room);
    }
  };

  const handleCheckIn = (room: HotelRoom) => {
    if (hotel) {
      const message = generateHotelCheckInMessage(hotel.name, room.room_number, room.room_type);
      openTelegramLink(hotel.telegram_contact, message);
    }
  };

  const handlePhoneCall = () => {
    if (hotel?.phone_number) {
      window.location.href = `tel:${hotel.phone_number}`;
    }
  };

  const handleTelegramContact = () => {
    if (hotel) {
      openTelegramLink(hotel.telegram_contact, `Hello! I'm interested in booking a room at ${hotel.name}.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="w-12 h-12 border-3 border-[#00D9FF]/30 border-t-[#00D9FF] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hotel) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] shadow-lg border-b border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/hotels')}
            className="flex items-center gap-2 px-4 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white rounded-xl transition-all btn-animate mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Hotels
          </button>

          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {hotel.logo_url ? (
                <img
                  src={hotel.logo_url}
                  alt={hotel.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 flex items-center justify-center">
                  <span className="text-3xl font-bold text-green-600 dark:text-green-300">
                    {hotel.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {hotel.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-3">{hotel.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {hotel.location}
                </span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                  {hotel.category}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            {hotel.phone_number && (
              <Button onClick={handlePhoneCall} variant="secondary" className="flex-1">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
            )}
            <Button onClick={handleTelegramContact} variant="primary" className="flex-1">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact
            </Button>
          </div>
        </div>
      </div>

      {hotel.channel_url && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <iframe
              src={hotel.channel_url}
              className="w-full h-96"
              title={`${hotel.name} Channel`}
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Available Rooms</h2>

        {rooms.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No rooms available</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleRoomClick(room)}
                disabled={room.availability_status === 'booked'}
                className={`relative p-4 rounded-lg text-center transition-all ${
                  room.availability_status === 'available'
                    ? 'bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 cursor-pointer'
                    : 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-60'
                }`}
              >
                {room.room_type === 'VIP' && (
                  <span className="absolute top-1 right-1 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded font-semibold">
                    VIP
                  </span>
                )}
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {room.room_number}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Floor {room.floor_number}
                </div>
                <div className="text-xs font-medium mt-1">
                  {room.availability_status === 'available' ? (
                    <span className="text-green-700 dark:text-green-300">Available</span>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400">Booked</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Room {selectedRoom.room_number}
              </h3>
              <button
                onClick={() => setSelectedRoom(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Room Type:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedRoom.room_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Floor:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedRoom.floor_number}
                </span>
              </div>
              {selectedRoom.price_per_night && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Price per night:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${selectedRoom.price_per_night}
                  </span>
                </div>
              )}
              {selectedRoom.amenities && (
                <div>
                  <span className="text-gray-600 dark:text-gray-300 block mb-1">Amenities:</span>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {selectedRoom.amenities}
                  </p>
                </div>
              )}
            </div>

            {selectedRoom.room_images && selectedRoom.room_images.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Images:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedRoom.room_images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Room ${selectedRoom.room_number} - ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => handleCheckIn(selectedRoom)}
              variant="primary"
              className="w-full"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Check In via Telegram
            </Button>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
};

export default HotelProfilePage;
