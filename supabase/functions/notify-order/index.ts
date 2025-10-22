import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Retry function with exponential backoff
async function retryFetch(url: string, options: any, maxRetries = 3): Promise<Response> {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      const errorData = await response.json();
      console.error(`Telegram API error (attempt ${attempt + 1}/${maxRetries}):`, errorData);
      lastError = `Status: ${response.status}, Message: ${JSON.stringify(errorData)}`;
      
      // Don't retry for certain error codes that won't benefit from retrying
      if (response.status === 400 || response.status === 401) {
        throw new Error(`Telegram API rejected request: ${lastError}`);
      }
    } catch (error) {
      console.error(`Fetch error (attempt ${attempt + 1}/${maxRetries}):`, error);
      lastError = error.message;
    }
    
    // Exponential backoff with jitter
    const delay = Math.floor(Math.random() * 1000) + Math.pow(2, attempt) * 500;
    console.log(`Retrying in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  throw new Error(`Maximum retries reached: ${lastError}`);
}

// Time zone definitions
const TIME_ZONES = {
  MMT: 'Asia/Yangon',  // Myanmar Time (UTC+6:30)
  ICT: 'Asia/Bangkok', // Thailand Time (UTC+7)
  UTC: 'UTC'
};

// Format date to a specific timezone
function formatDateToTimezone(date: Date, timezone: string): string {
  // Create formatter for the specified timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
    timeZone: timezone
  });
  
  return formatter.format(date);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      storeId, 
      telegramName, 
      transactionNumber, 
      shippingAddress,
      phoneNumber,
      remark,
      items,
      totalAmount,
      paymentMethod
    } = await req.json();

    // Fetch store information
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('name, telegram_bot_token, telegram_chat_id')
      .eq('id', storeId)
      .single();

    if (storeError) {
      console.error('Store fetch error:', storeError);
      throw new Error(`Failed to fetch store details: ${storeError.message}`);
    }
    
    if (!store) {
      throw new Error('Store not found');
    }

    const { telegram_bot_token, telegram_chat_id } = store;
    if (!telegram_bot_token || !telegram_chat_id) {
      throw new Error('Store telegram configuration not found or incomplete');
    }

    // Fetch the admin's timezone setting
    const { data: settingsData, error: settingsError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'adminTimeZone')
      .single();

    // Default to Myanmar Time if no setting is found
    let adminTimeZone = TIME_ZONES.MMT;
    
    if (!settingsError && settingsData?.value) {
      adminTimeZone = settingsData.value.toString();
    } else {
      console.log('Using default timezone: Myanmar Time');
    }
    
    // Format the current time in the admin's timezone
    const orderTime = formatDateToTimezone(new Date(), adminTimeZone);

    // Format order items for message
    const itemsList = items
      .map(item => `- ${item.name} x${item.quantity} (฿${item.price.toFixed(2)})`)
      .join('\n');

    // Create message - using plain text instead of HTML
    const message = `
🛍️ New Order Received!

Store: ${store.name}
Payment Method: ${paymentMethod.toUpperCase()}
Total Amount: ฿${totalAmount.toFixed(2)}

Customer Details:
Telegram: ${telegramName}
${phoneNumber ? `Phone: ${phoneNumber}` : ''}
${paymentMethod !== 'cod' ? `Transaction: ${transactionNumber}` : ''}
Shipping Address: ${shippingAddress}
${remark ? `\nRemark: ${remark}` : ''}

Items:
${itemsList}

Order Time: ${orderTime}
    `.trim();

    console.log('Sending message to Telegram API...');
    
    // Send to Telegram with retry logic
    try {
      const telegramResponse = await retryFetch(
        `https://api.telegram.org/bot${telegram_bot_token}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: telegram_chat_id,
            text: message,
            // Using plain text mode instead of HTML
            parse_mode: 'Markdown',
          }),
        }
      );

      const telegramResult = await telegramResponse.json();
      console.log('Telegram API response:', telegramResult);
      
      // Order successful, save to database if needed
      // This could be implemented in a future update

    } catch (telegramError) {
      console.error('Telegram notification failed:', telegramError);
      throw new Error(`Failed to send Telegram notification: ${telegramError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in notify-order function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack || 'No additional details available'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});