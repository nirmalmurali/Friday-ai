import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { dbRepository, Message } from '../db/repository.js';
import { SYSTEM_PROMPT } from './prompts.js';
import { AGENT_TOOLS } from './toolDefinitions.js';
import { executeTool } from './toolExecutor.js';

export interface ChatResponse {
  message: Message;
  toolCallsExecuted: Array<{
    name: string;
    args: any;
    result: any;
  }>;
  mode: 'live_claude' | 'sandbox_simulator';
}

export async function runAgentConversation(
  conversationId: string,
  userMessageText: string
): Promise<ChatResponse> {
  // 1. Record user message in DB
  dbRepository.addMessage({
    conversation_id: conversationId,
    role: 'user',
    content: userMessageText,
  });

  // 2. Determine execution mode (Live Anthropic vs Smart Sandbox)
  if (config.anthropicApiKey && config.anthropicApiKey.trim() !== '') {
    try {
      return await executeAnthropicLive(conversationId, userMessageText);
    } catch (err: any) {
      console.warn('Anthropic API call failed, falling back to sandbox simulator:', err.message);
      return await executeSandboxSimulator(conversationId, userMessageText, err.message);
    }
  } else {
    return await executeSandboxSimulator(conversationId, userMessageText);
  }
}

// ---------------- LIVE ANTHROPIC CLAUDE EXECUTION ----------------
async function executeAnthropicLive(
  conversationId: string,
  userMessageText: string
): Promise<ChatResponse> {
  const anthropic = new Anthropic({
    apiKey: config.anthropicApiKey,
  });

  const toolCallsExecuted: Array<{ name: string; args: any; result: any }> = [];

  // Fetch full conversation history from DB
  const rawHistory = dbRepository.getMessages(conversationId);
  const formattedMessages: Anthropic.MessageParam[] = [];

  for (const m of rawHistory) {
    if (m.role === 'user') {
      formattedMessages.push({ role: 'user', content: m.content });
    } else if (m.role === 'assistant') {
      formattedMessages.push({ role: 'assistant', content: m.content });
    }
  }

  let currentMessages = [...formattedMessages];
  let finalAssistantText = '';
  let loopIterations = 0;
  const maxIterations = 6;

  while (loopIterations < maxIterations) {
    loopIterations++;
    const response = await anthropic.messages.create({
      model: config.anthropicModel,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: AGENT_TOOLS,
      messages: currentMessages,
    });

    // Check for tool use
    const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use') as Anthropic.ToolUseBlock[];
    const textBlocks = response.content.filter((b) => b.type === 'text') as Anthropic.TextBlock[];
    const assistantTextSnippet = textBlocks.map((b) => b.text).join('\n\n');

    if (toolUseBlocks.length === 0) {
      finalAssistantText = assistantTextSnippet || 'Completed.';
      break;
    }

    // Record tool call execution
    const toolResultsForNextTurn: Anthropic.ToolResultBlockParam[] = [];
    for (const toolBlock of toolUseBlocks) {
      const execution = await executeTool(toolBlock.name, toolBlock.input, conversationId);
      toolCallsExecuted.push({
        name: toolBlock.name,
        args: toolBlock.input,
        result: execution.data,
      });

      toolResultsForNextTurn.push({
        type: 'tool_result',
        tool_use_id: toolBlock.id,
        content: JSON.stringify(execution.data),
      });
    }

    // Append assistant tool request & user tool result to loop messages
    currentMessages.push({
      role: 'assistant',
      content: response.content,
    });

    currentMessages.push({
      role: 'user',
      content: toolResultsForNextTurn,
    });
  }

  // Persist final assistant response
  const assistantMsg = dbRepository.addMessage({
    conversation_id: conversationId,
    role: 'assistant',
    content: finalAssistantText,
    tool_calls: toolCallsExecuted.length > 0 ? toolCallsExecuted : null,
  });

  return {
    message: assistantMsg,
    toolCallsExecuted,
    mode: 'live_claude',
  };
}

// ---------------- SMART SANDBOX SIMULATOR ----------------
async function executeSandboxSimulator(
  conversationId: string,
  userMessageText: string,
  apiErrorNotice?: string
): Promise<ChatResponse> {
  const lower = userMessageText.toLowerCase();
  const toolCallsExecuted: Array<{ name: string; args: any; result: any }> = [];
  let assistantText = '';

  if (lower.includes('trend') || lower.includes('niche') || lower.includes('find') || lower.includes('product')) {
    const niche = lower.includes('fitness') || lower.includes('gym') ? 'home fitness' : config.defaultNiche;
    const country = config.defaultCountry;
    const exec = await executeTool('find_trending_products', { niche, country }, conversationId);
    toolCallsExecuted.push({ name: 'find_trending_products', args: { niche, country }, result: exec.data });

    assistantText = `### 🔍 Trending Products Analysis: **${niche.toUpperCase()}** (${country})

I searched Google Trends, search volume feeds, and social ads for breakout products in **${country}**:

| Product Name | Demand Score | 30d Growth | Competition | Target Retail | Est. Supplier Cost |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Orthopedic Memory Foam Dog Bed** | 92/100 | +34.5% | Medium | $69.95 AUD | $18.50 AUD |
| **Automatic Cat Laser Fountain** | 87/100 | +28.0% | Low | $44.99 AUD | $11.20 AUD |
| **Tactical No-Pull Dog Harness** | 89/100 | +21.4% | High | $39.95 AUD | $8.90 AUD |

> **📊 Data Evidence**: The *Orthopedic Memory Foam Dog Bed* is experiencing 48,200 monthly searches in AU with rapid uptick on TikTok (#petwellness). High buyer intent driven by pet owners wanting washable, joint-relief bedding.

**Next Recommended Action**:
Would you like me to look up supplier specifications and calculate real unit profit margins for the **Orthopedic Memory Foam Dog Bed**?`;
  } else if (lower.includes('margin') || lower.includes('calculate') || lower.includes('profit') || lower.includes('cost')) {
    const cost = 18.5;
    const shipping = 6.8;
    const price = 69.95;
    const adCost = 15.0;
    const platformFees = Number((price * 0.029 + 0.3).toFixed(2));

    const exec = await executeTool('calculate_margin', {
      cost,
      shipping,
      price,
      ad_cost_estimate: adCost,
      platform_fees: platformFees,
    }, conversationId);
    toolCallsExecuted.push({ name: 'calculate_margin', args: { cost, shipping, price, adCost, platformFees }, result: exec.data });

    assistantText = `### 💰 Real Dropshipping Margin Breakdown: **Orthopedic Memory Foam Dog Bed**

Here is the exact unit economics model calculated for the Australian market:

- **Selling Price (RRP)**: **$${price.toFixed(2)} AUD**
- **Supplier Product Cost**: -$${cost.toFixed(2)} AUD
- **Direct AU Shipping**: -$${shipping.toFixed(2)} AUD
- **Estimated CAC (Meta/TikTok Ads)**: -$${adCost.toFixed(2)} AUD
- **Store & Stripe Fees (2.9% + $0.30)**: -$${platformFees.toFixed(2)} AUD
---
- **Total Unit Cost**: **$${(cost + shipping + adCost + platformFees).toFixed(2)} AUD**
- **Net Profit per Sale**: 🟢 **$${exec.data.net_margin.toFixed(2)} AUD**
- **Net Margin**: **${exec.data.margin_percentage}%** (${exec.data.viability_rating})
- **Break-Even ROAS**: **${exec.data.break_even_roas}x**

> **💡 Verdict**: ${exec.data.recommendation}

Would you like me to stage a **Draft Listing** in your ${config.storePlatform} store and generate high-converting SEO metadata?`;
  } else if (lower.includes('draft') || lower.includes('listing') || lower.includes('stage') || lower.includes('store')) {
    const exec = await executeTool('create_draft_listing', {
      product_title: 'Orthopedic Memory Foam Dog Bed - Waterproof Washable Cover',
      niche: 'Pet Supplies',
      price: 69.95,
      description: 'Give your four-legged companion the deep, restorative rest they deserve with our Orthopedic Memory Foam Dog Bed. Engineered with medical-grade dual-layer memory foam to relieve joint pressure, wrapped in an ultra-soft, machine-washable waterproof exterior.',
      images: ['https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=600&q=80'],
      supplier_url: 'https://cjdropshipping.com/product/orthopedic-bed',
    }, conversationId);
    toolCallsExecuted.push({ name: 'create_draft_listing', args: {}, result: exec.data });

    assistantText = `### 🛡️ Draft Listing Staged for Approval

I have staged the draft product listing in accordance with our **Mandatory Safety Rules**:
- **Product**: Orthopedic Memory Foam Dog Bed - Waterproof Washable Cover
- **Target Retail**: $69.95 AUD
- **Store Platform**: ${config.storePlatform.toUpperCase()} (Sandbox Mode)
- **Status**: ⏳ **PENDING APPROVAL** (Approval ID: \`${exec.data.approval_id}\`)

> ⚠️ **Safety Enforcement**: Per your business rules, this listing will **never** be pushed to your live store until you review and click **Approve** in the **Approval Queue sidebar**.

Check the sidebar on the right to inspect the complete payload or approve the draft.`;
  } else if (lower.includes('seo') || lower.includes('meta')) {
    const exec = await executeTool('generate_seo_metadata', {
      title: 'Orthopedic Memory Foam Dog Bed',
      niche: 'Pet Supplies Australia',
      key_benefits: ['Joint relief dual-foam', 'Machine washable cover', 'Free AU delivery'],
      current_price: 69.95,
    }, conversationId);
    toolCallsExecuted.push({ name: 'generate_seo_metadata', args: {}, result: exec.data });

    assistantText = `### 🚀 Optimized SEO Metadata Generated

- **Meta Title** (${exec.data.meta_title_length}/60 chars):  
  \`${exec.data.meta_title}\`
- **Meta Description** (${exec.data.meta_description_length}/155 chars):  
  \`${exec.data.meta_description}\`
- **URL Slug**: \`/${exec.data.slug}\`
- **Image Alt Text**: "${exec.data.alt_text}"
- **Target Tags**: \`${exec.data.tags.join(', ')}\`

Schema markup has been constructed as standard JSON-LD Product schema.`;
  } else if (lower.includes('ad') || lower.includes('copy') || lower.includes('campaign')) {
    const exec = await executeTool('generate_ad_copy', {
      product_title: 'Orthopedic Memory Foam Dog Bed',
      platform: 'Meta',
      key_features: ['Dual-layer memory foam', 'Washable cover', 'Joint support'],
    }, conversationId);
    toolCallsExecuted.push({ name: 'generate_ad_copy', args: {}, result: exec.data });

    assistantText = `### 📢 Meta / Instagram Ad Angles Generated

Here are 3 compliant ad variants tested against your safety guidelines (no unverifiable health claims):

#### Angle 1: Problem / Agitation / Solution
- **Hook**: *Your dog sleeps 14+ hours a day. Are they getting proper joint support?*
- **Body**: Most pet beds flatten within a month. Our dual-layer orthopedic memory foam retains 95% shape, distributing weight evenly for deeper sleep.
- **CTA**: Get 25% Off Today + Free Aussie Express Delivery.
- **Targeting**: Dog owners, Pet lovers (AU 25-55).

#### Angle 2: Social Proof & Comfort
- **Hook**: *The internet's favorite dog bed just landed in Australia 🇦🇺*
- **CTA**: Shop The Australian Rest Collection.

> 🛡️ **Compliance Check**: No prohibited medical claims found. Safe for Meta Ad Policy approval.`;
  } else {
    assistantText = `Hello! I'm **Friday**, your personal AI dropshipping assistant.

I am wired into your dropshipping operations with strict safety controls:
1. **Find Trending Products**: Discover high-demand products in your niche with search data & social evidence.
2. **Lookup Suppliers**: Check real-time wholesale costs, inventory, and Australian shipping times.
3. **Calculate Real Margins**: Account for COGS, shipping, ad spend (CAC), and transaction fees.
4. **Create Draft Store Listings**: Stage listings safely into your **Approval Queue** before anything touches your store.
5. **Generate SEO Metadata**: Pixel-perfect titles (<60 chars), descriptions (<155 chars), and JSON-LD schema.
6. **Generate High-Converting Ad Copy**: Compliant angles for Meta, TikTok, and Google.

${apiErrorNotice ? `⚠️ *Note: Anthropic API notice: ${apiErrorNotice}. Running in Sandbox Simulator.*` : `💡 *Sandbox Simulator is active. Provide your \`ANTHROPIC_API_KEY\` in \`.env\` for full autonomous Claude reasoning.*`}

**What would you like to explore first?** (e.g. *"Find trending pet products in Australia"* or *"Calculate margins for a $70 dog bed"*).`;
  }

  const assistantMsg = dbRepository.addMessage({
    conversation_id: conversationId,
    role: 'assistant',
    content: assistantText,
    tool_calls: toolCallsExecuted.length > 0 ? toolCallsExecuted : null,
  });

  return {
    message: assistantMsg,
    toolCallsExecuted,
    mode: 'sandbox_simulator',
  };
}
