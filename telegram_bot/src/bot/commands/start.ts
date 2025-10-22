import { Context, Markup } from 'telegraf';
import { supabase } from '../../lib/supabaseClient';

export async function startCommand(ctx: Context) {
  try {
    // Fetch active and approved stores
    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, name, description')
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .order('display_order', { ascending: true, nullsLast: true })
      .order('name');

    if (error) {
      console.error('Error fetching stores:', error);
      return ctx.reply('Sorry, I could not fetch stores at the moment. Please try again later.');
    }

    if (!stores || stores.length === 0) {
      return ctx.reply('No active stores found at the moment. Please check back later!');
    }

    // Create inline keyboard with store names
    const buttons = stores.map(store =>
      Markup.button.callback(store.name, `store_${store.id}`)
    );

    // Send welcome message with store list
    const welcomeMessage = `🛍️ *Welcome to the Mall!*\n\nPlease select a store to browse:`;

    await ctx.reply(
      welcomeMessage,
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons, { columns: 2 }).reply_markup
      }
    );

  } catch (error) {
    console.error('Error in start command:', error);
    ctx.reply('Sorry, something went wrong. Please try again.');
  }
}