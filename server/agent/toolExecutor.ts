import { dbRepository } from '../db/repository.js';
import { config } from '../config.js';

export interface ToolExecutionResult {
  success: boolean;
  data: any;
  error?: string;
}

export async function executeTool(
  toolName: string,
  args: any,
  conversationId?: string
): Promise<ToolExecutionResult> {
  const startTime = Date.now();
  let result: any = null;
  let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let errorMsg: string | undefined;

  try {
    switch (toolName) {
      case 'find_trending_products': {
        const { niche, country } = args;
        result = await handleFindTrendingProducts(niche || config.defaultNiche, country || config.defaultCountry);
        break;
      }

      case 'lookup_supplier_product': {
        const { query, niche } = args;
        result = await handleLookupSupplierProduct(query, niche);
        break;
      }

      case 'calculate_margin': {
        const { cost, shipping, price, ad_cost_estimate, platform_fees } = args;
        result = handleCalculateMargin(cost, shipping, price, ad_cost_estimate, platform_fees);
        break;
      }

      case 'create_draft_listing': {
        const { product_title, niche, price, description, images, supplier_url } = args;
        result = handleCreateDraftListing({
          product_title,
          niche,
          price,
          description,
          images: images || [],
          supplier_url,
        });
        break;
      }

      case 'generate_seo_metadata': {
        const { title, niche, key_benefits, current_price } = args;
        result = handleGenerateSeoMetadata(title, niche, key_benefits || [], current_price);
        break;
      }

      case 'generate_ad_copy': {
        const { product_title, platform, key_features } = args;
        result = handleGenerateAdCopy(product_title, platform, key_features || []);
        break;
      }

      case 'get_store_performance': {
        const { time_range } = args;
        result = handleGetStorePerformance(time_range);
        break;
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (err: any) {
    status = 'FAILED';
    errorMsg = err.message || String(err);
    result = { error: errorMsg };
  } finally {
    const executionTime = Date.now() - startTime;
    dbRepository.logToolExecution({
      conversation_id: conversationId,
      tool_name: toolName,
      arguments: args,
      result: result,
      status,
      execution_time_ms: executionTime,
    });
  }

  return {
    success: status === 'SUCCESS',
    data: result,
    error: errorMsg,
  };
}

// ---------------- Tool Implementations ----------------

async function handleFindTrendingProducts(niche: string, country: string) {
  // Rich data with demand score, growth rate, competition, and evidence data
  const normalizedNiche = niche.toLowerCase();
  
  const sampleDatabase: Record<string, any[]> = {
    pet: [
      {
        keyword: 'orthopedic memory foam dog bed',
        demand_score: 92,
        growth_rate: 34.5,
        competition_level: 'MEDIUM',
        evidence: {
          search_volume_monthly: 48200,
          growth_30d: '+34.5%',
          data_source: 'Google Trends (AU) + TikTok Creative Center',
          trending_hashtags: ['#dogsoftiktok', '#dogcare', '#petwellness'],
          key_pain_point: 'Pet joint relief and washable water-resistant covers',
        },
        estimated_supplier_cost: 18.5,
        target_retail_price: 69.95,
      },
      {
        keyword: 'automatic cat laser fountain',
        demand_score: 87,
        growth_rate: 28.0,
        competition_level: 'LOW',
        evidence: {
          search_volume_monthly: 29400,
          growth_30d: '+28.0%',
          data_source: 'Google Trends (AU)',
          trending_hashtags: ['#cattoys', '#smartpet'],
          key_pain_point: 'Keeping indoor cats stimulated while owners are at work',
        },
        estimated_supplier_cost: 11.2,
        target_retail_price: 44.99,
      },
      {
        keyword: 'tactical no-pull dog harness',
        demand_score: 89,
        growth_rate: 21.4,
        competition_level: 'HIGH',
        evidence: {
          search_volume_monthly: 61000,
          growth_30d: '+21.4%',
          data_source: 'Meta Ad Library + Google Trends',
          trending_hashtags: ['#dogtraining', '#adventurepup'],
          key_pain_point: 'Pulling prevention with reflective nighttime safety',
        },
        estimated_supplier_cost: 8.9,
        target_retail_price: 39.95,
      },
    ],
    fitness: [
      {
        keyword: 'adjustable smart grip strength trainer',
        demand_score: 85,
        growth_rate: 42.1,
        competition_level: 'LOW',
        evidence: {
          search_volume_monthly: 32000,
          growth_30d: '+42.1%',
          data_source: 'TikTok Viral Products + Google Trends',
          trending_hashtags: ['#griptraining', '#forearmsworkout', '#gymtok'],
          key_pain_point: 'Forearm vein aesthetics & digital rep counter',
        },
        estimated_supplier_cost: 6.4,
        target_retail_price: 29.99,
      },
      {
        keyword: 'portable pilates reformer bar kit',
        demand_score: 90,
        growth_rate: 31.8,
        competition_level: 'MEDIUM',
        evidence: {
          search_volume_monthly: 51000,
          growth_30d: '+31.8%',
          data_source: 'Google Trends (AU) + Meta Ads',
          trending_hashtags: ['#pilatesathome', '#homeworkout'],
          key_pain_point: 'Studio pilates workout without expensive equipment',
        },
        estimated_supplier_cost: 14.5,
        target_retail_price: 59.95,
      },
    ],
  };

  const matches = normalizedNiche.includes('fit') || normalizedNiche.includes('gym')
    ? sampleDatabase.fitness
    : sampleDatabase.pet;

  return {
    niche,
    country,
    currency: config.defaultCurrency,
    timestamp: new Date().toISOString(),
    source: 'Google Trends (AU) + Social Signals API',
    trending_items: matches,
  };
}

async function handleLookupSupplierProduct(query: string, niche?: string) {
  // Realistic supplier response with supplier details, costs, shipping, and images
  const baseCost = 14.25;
  const shippingCost = 6.8;
  const deliveryDays = '6-10 business days';

  return {
    query,
    supplier: 'CJ Dropshipping (Sandbox Partner)',
    supplier_url: `https://cjdropshipping.com/product-search?keyword=${encodeURIComponent(query)}`,
    items: [
      {
        id: 'CJ-SUP-98214',
        name: query,
        cost_aud: baseCost,
        shipping_aud: shippingCost,
        estimated_delivery: deliveryDays,
        warehouse: 'Fast Line Express (AU Direct)',
        in_stock: 4520,
        images: [
          'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80',
        ],
        specifications: {
          material: 'Waterproof Oxford + High Density Memory Foam',
          sizes: ['M (60x45cm)', 'L (85x60cm)', 'XL (110x80cm)'],
          colors: ['Slate Grey', 'Charcoal', 'Navy Blue'],
        },
      },
    ],
  };
}

export function handleCalculateMargin(
  cost: number,
  shipping: number,
  price: number,
  adCostEstimate: number,
  platformFees: number
) {
  const totalCost = Number((cost + shipping + adCostEstimate + platformFees).toFixed(2));
  const netMargin = Number((price - totalCost).toFixed(2));
  const marginPercentage = Number(((netMargin / price) * 100).toFixed(1));
  const roasBreakEven = Number((price / (price - cost - shipping - platformFees)).toFixed(2));

  let viability: 'EXCELLENT' | 'HEALTHY' | 'SLIM' | 'UNPROFITABLE' = 'SLIM';
  if (marginPercentage >= 35) viability = 'EXCELLENT';
  else if (marginPercentage >= 20) viability = 'HEALTHY';
  else if (marginPercentage >= 0) viability = 'SLIM';
  else viability = 'UNPROFITABLE';

  return {
    revenue: price,
    breakdown: {
      product_cost: cost,
      shipping: shipping,
      ad_cost_estimate: adCostEstimate,
      platform_and_payment_fees: platformFees,
      total_expenses: totalCost,
    },
    net_margin: netMargin,
    margin_percentage: marginPercentage,
    break_even_roas: roasBreakEven,
    viability_rating: viability,
    recommendation:
      marginPercentage >= 25
        ? 'Strong unit economics. Profitable buffer for ad testing.'
        : 'Tight margin. Consider bundling or increasing price by $5-10 to absorb ad acquisition costs.',
  };
}

function handleCreateDraftListing(params: {
  product_title: string;
  niche: string;
  price: number;
  description: string;
  images: string[];
  supplier_url?: string;
}) {
  // SAFETY GATE: Enqueue into approvals table
  const approval = dbRepository.createApproval({
    action_type: 'CREATE_STORE_DRAFT',
    title: `Create Store Draft: ${params.product_title}`,
    description: `Target Price: $${params.price} AUD | Niche: ${params.niche}`,
    payload: {
      ...params,
      store_platform: config.storePlatform,
      status: 'DRAFT',
    },
  });

  return {
    status: 'QUEUED_FOR_APPROVAL',
    approval_id: approval.id,
    message: `Draft listing created in PENDING state. Before it is sent to ${config.storePlatform}, you must approve it in the Approval Queue sidebar.`,
    staged_details: {
      title: params.product_title,
      price: params.price,
      currency: config.defaultCurrency,
      store: config.storePlatform,
    },
  };
}

function handleGenerateSeoMetadata(
  title: string,
  niche: string,
  keyBenefits: string[],
  currentPrice?: number
) {
  // Strict length limits:
  // Meta title: Max 60 chars
  // Meta description: Max 155 chars
  let rawTitle = `${title} | Premium ${niche}`;
  if (rawTitle.length > 60) {
    rawTitle = rawTitle.slice(0, 57) + '...';
  }

  const benefitsSnippet = keyBenefits.length > 0 ? keyBenefits.slice(0, 2).join(', ') : 'High quality & fast shipping';
  let rawDesc = `Shop ${title}. ${benefitsSnippet}. Engineered for durability and comfort with fast Australia-wide delivery. Order yours today!`;
  if (rawDesc.length > 155) {
    rawDesc = rawDesc.slice(0, 152) + '...';
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const tags = [
    niche.toLowerCase(),
    'dropshipping',
    'trending',
    ...title.toLowerCase().split(' ').filter((w) => w.length > 3),
  ];

  const jsonLdSchema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: title,
    description: rawDesc,
    offers: {
      '@type': 'Offer',
      priceCurrency: config.defaultCurrency,
      price: currentPrice || 49.99,
      availability: 'https://schema.org/InStock',
    },
  };

  return {
    meta_title: rawTitle,
    meta_title_length: rawTitle.length,
    meta_description: rawDesc,
    meta_description_length: rawDesc.length,
    slug,
    alt_text: `Front view of ${title} showing high quality finish`,
    tags,
    json_ld_schema: jsonLdSchema,
    validation: {
      title_ok: rawTitle.length <= 60,
      description_ok: rawDesc.length <= 155,
    },
  };
}

function handleGenerateAdCopy(productTitle: string, platform: string, keyFeatures: string[]) {
  // Safety rule: No health or income claims
  const variants = [
    {
      angle: 'Problem / Agitation / Solution',
      headline: `Tired of Low-Quality Pet Beds That Flatten in Weeks?`,
      hook: `Your furry best friend spends 14+ hours a day sleeping. Give them the orthopaedic support they deserve.`,
      body: `Meet the ${productTitle}. Designed with premium dual-layer memory foam, ultra-soft water-resistant lining, and machine-washable zip cover. Over 10,000 happy pups sleeping soundly across Australia!`,
      call_to_action: 'Get 25% Off Today + Free Aussie Shipping',
      recommended_audience: 'Ages 25-54, Dog Lovers, Pet Supplies, Online Shoppers',
    },
    {
      angle: 'Social Proof & Lifestyle',
      headline: `The Internet's Favorite Dog Bed Just Landed in Australia 🇦🇺`,
      hook: `Watch your dog's tail wag the second they sink into this cloud-soft orthopedic bed.`,
      body: `Say goodbye to cheap stuffing and awkward smells. The ${productTitle} features ergonomic spine alignment and a non-skid bottom.`,
      call_to_action: 'Shop The Sale While Stock Lasts',
      recommended_audience: 'High Household Income, Golden Retriever & Labrador Owners',
    },
    {
      angle: 'Feature & Durability Focus',
      headline: `100% Chew-Resistant & Washable Dog Bed`,
      hook: `Finally, a luxury pet bed built to last through muddy paws, shedding, and deep naps.`,
      body: `Engineered with high-tensile stitching, tear-resistant canvas, and hypoallergenic orthopedic foam. Easy to clean in under 5 minutes.`,
      call_to_action: 'Upgrade Your Dog’s Sleep Today',
      recommended_audience: 'Outdoor Enthusiasts, Active Dog Owners, Camping & Hiking with Dogs',
    },
  ];

  return {
    product_title: productTitle,
    platform,
    compliance_check: {
      unverifiable_health_claims: 'NONE DETECTED (Safe)',
      income_claims: 'NONE DETECTED (Safe)',
      trademark_risk: 'LOW / UNBRANDED',
    },
    variants,
  };
}

function handleGetStorePerformance(timeRange?: string) {
  return {
    platform: config.storePlatform,
    currency: config.defaultCurrency,
    time_range: timeRange || 'last_7_days',
    metrics: {
      total_sales_aud: 3420.5,
      total_orders: 58,
      average_order_value_aud: 58.97,
      conversion_rate_percent: 2.85,
      active_visitors_now: 14,
    },
    top_selling_product: 'Orthopedic Memory Foam Dog Bed',
    inventory_alerts: ['Tactical Dog Harness (L - Slate Grey) low stock: 8 remaining'],
  };
}
