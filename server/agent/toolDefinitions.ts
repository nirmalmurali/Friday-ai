import { Tool } from '@anthropic-ai/sdk/resources/messages.mjs';

export const AGENT_TOOLS: Tool[] = [
  {
    name: 'find_trending_products',
    description: 'Find high-potential trending products within a given niche and target country, analyzing search demand, growth rate, and competition.',
    input_schema: {
      type: 'object',
      properties: {
        niche: {
          type: 'string',
          description: 'The ecommerce niche, e.g. "pet products", "home fitness", "smart kitchen"',
        },
        country: {
          type: 'string',
          description: 'The target geographical market, e.g. "Australia", "United States", "United Kingdom"',
        },
      },
      required: ['niche', 'country'],
    },
  },
  {
    name: 'lookup_supplier_product',
    description: 'Query dropshipping supplier catalogs (e.g., CJ Dropshipping, AliExpress/DSers, Spocket) to retrieve unit cost, shipping rates, estimated delivery times, inventory levels, and image assets.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Product name or search keywords to lookup with suppliers',
        },
        niche: {
          type: 'string',
          description: 'Optional niche category',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'calculate_margin',
    description: 'Calculate detailed unit economics, net profit margin, ROI, and break-even metrics considering product cost, shipping, retail price, ad customer acquisition cost (CAC), and payment/platform transaction fees.',
    input_schema: {
      type: 'object',
      properties: {
        cost: {
          type: 'number',
          description: 'Base wholesale product cost per unit (in store currency)',
        },
        shipping: {
          type: 'number',
          description: 'Shipping cost to target country per unit',
        },
        price: {
          type: 'number',
          description: 'Suggested retail sale price on store',
        },
        ad_cost_estimate: {
          type: 'number',
          description: 'Estimated customer acquisition cost (CAC) per unit from advertising',
        },
        platform_fees: {
          type: 'number',
          description: 'Estimated transaction & platform processing fees (e.g. 2.9% + 0.30)',
        },
      },
      required: ['cost', 'shipping', 'price', 'ad_cost_estimate', 'platform_fees'],
    },
  },
  {
    name: 'create_draft_listing',
    description: 'Creates a proposed product listing staged in the Approval Queue as a DRAFT. Will NEVER publish directly without explicit human approval.',
    input_schema: {
      type: 'object',
      properties: {
        product_title: {
          type: 'string',
          description: 'Title of the product listing',
        },
        niche: {
          type: 'string',
          description: 'Product niche/category',
        },
        price: {
          type: 'number',
          description: 'Retail selling price (AUD or store currency)',
        },
        description: {
          type: 'string',
          description: 'Engaging, benefit-driven product description (HTML or Markdown)',
        },
        images: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of image URLs for the product',
        },
        supplier_url: {
          type: 'string',
          description: 'Source supplier URL for fulfillment reference',
        },
      },
      required: ['product_title', 'niche', 'price', 'description'],
    },
  },
  {
    name: 'generate_seo_metadata',
    description: 'Generate search-engine-optimized metadata adhering strictly to length limits: meta title (max 60 chars), meta description (max 155 chars), slug, descriptive image alt text, search tags, and valid JSON-LD Product schema markup.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Product name or draft title',
        },
        niche: {
          type: 'string',
          description: 'Target market / niche',
        },
        key_benefits: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of key features/benefits to incorporate',
        },
        current_price: {
          type: 'number',
          description: 'Product price for JSON-LD schema',
        },
      },
      required: ['title', 'niche'],
    },
  },
  {
    name: 'generate_ad_copy',
    description: 'Generate 3 to 5 targeted advertising angles/variants for Meta (Facebook/Instagram), TikTok, or Google Ads, complete with hook, body, call-to-action, and recommended audience targeting. Includes compliance screening against unverifiable claims.',
    input_schema: {
      type: 'object',
      properties: {
        product_title: {
          type: 'string',
          description: 'Title of the product',
        },
        platform: {
          type: 'string',
          enum: ['Meta', 'TikTok', 'Google'],
          description: 'Advertising platform target',
        },
        key_features: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key selling points or product benefits',
        },
      },
      required: ['product_title', 'platform'],
    },
  },
  {
    name: 'get_store_performance',
    description: 'Read-only tool to retrieve current store metrics, sales, traffic, conversion rate, and inventory alerts.',
    input_schema: {
      type: 'object',
      properties: {
        time_range: {
          type: 'string',
          description: 'Time window: "today", "last_7_days", "last_30_days"',
        },
      },
    },
  },
];
