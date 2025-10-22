import { Context, Markup } from 'telegraf';
import { supabase, formatCurrency, escapeMarkdown } from '../../lib/supabaseClient';

export async function viewProductsAction(ctx: Context) {
  try {
    // Extract store ID from callback data
    const callbackData = ctx.callbackQuery?.data;
    if (!callbackData) {
      return ctx.reply('Invalid store selection.');
    }

    const storeId = callbackData.split('_')[2]; // view_products_${storeId}
    if (!storeId) {
      return ctx.reply('Invalid store selection.');
    }

    // Fetch store info
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('name')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      await ctx.answerCbQuery('Store not found');
      return ctx.reply('Sorry, I could not find this store.');
    }

    // Fetch products for this store
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .eq('in_stock', true)
      .eq('is_active', true)
      .order('name');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      await ctx.answerCbQuery('Error loading products');
      return ctx.reply('Sorry, I could not load products for this store.');
    }

    if (!products || products.length === 0) {
      await ctx.answerCbQuery();
      return ctx.editMessageText(
        `🏪 *${escapeMarkdown(store.name)}*\n\n❌ No products available at the moment.`,
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Store Details', `store_${storeId}`)]
          ]).reply_markup
        }
      );
    }

    // Format products message
    let message = `🏪 *${escapeMarkdown(store.name)} - Products*\n\n`;
    
    products.slice(0, 10).forEach((product, index) => { // Limit to first 10 products
      message += `${index + 1}\\. *${escapeMarkdown(product.name)}*\n`;
      if (product.description) {
        message += `   ${escapeMarkdown(product.description.substring(0, 100))}${product.description.length > 100 ? '...' : ''}\n`;
      }
      message += `   💰 ${formatCurrency(product.price)}\n`;
      message += `   📦 Stock: ${product.stock_quantity}\n\n`;
    });

    if (products.length > 10) {
      message += `_\\.\\.\\. and ${products.length - 10} more products_\n\n`;
    }

    // Create action buttons
    const buttons = [
      [Markup.button.callback('🛒 Start Shopping', `start_shopping_${storeId}`)],
      [Markup.button.callback('🔙 Back to Store Details', `store_${storeId}`)]
    ];

    // Edit the message with products list
    await ctx.editMessageText(
      message,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      }
    );

    // Answer the callback query
    await ctx.answerCbQuery();

  } catch (error) {
    console.error('Error in view products action:', error);
    await ctx.answerCbQuery('Error loading products');
    ctx.reply('Sorry, something went wrong while loading products.');
  }
}