export function generateTelegramLink(username: string, message: string): string {
  const cleanUsername = username.replace(/^@/, '').replace(/^https?:\/\/(t\.me|telegram\.me)\//, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://t.me/${cleanUsername}?text=${encodedMessage}`;
}

export function openTelegramLink(username: string, message: string): void {
  const link = generateTelegramLink(username, message);
  window.open(link, '_blank');
}

export function generateStoreOrderMessage(storeName: string, items: Array<{ name: string; quantity: number; price: number }>): string {
  let message = `Hello! I want to buy the following items from ${storeName}:\n\n`;

  items.forEach((item, index) => {
    message += `${index + 1}. ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}\n`;
  });

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  message += `\nTotal: $${total.toFixed(2)}\n\nPlease confirm my order. Thank you!`;

  return message;
}

export function generateHotelCheckInMessage(hotelName: string, roomNumber: string, roomType: string): string {
  return `Hello! I want to check in to Room ${roomNumber} (${roomType}) at ${hotelName}. Please let me know the availability and booking process. Thank you!`;
}

export function generateTaxiHireMessage(driverName: string, vehicleType: string, location?: string): string {
  let message = `Hello ${driverName}! I want to hire your ${vehicleType} service`;
  if (location) {
    message += ` from ${location}`;
  }
  message += `. Please let me know your availability. Thank you!`;
  return message;
}
