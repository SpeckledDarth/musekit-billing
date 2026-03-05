import type { Metadata } from 'next';
import type { PlanTier } from './plans';
import { getAllPlans } from './plans';

export interface PricingMetadataOptions {
  appName?: string;
  description?: string;
  baseUrl?: string;
}

export async function getPricingMetadata(
  options: PricingMetadataOptions = {}
): Promise<Metadata> {
  const {
    appName = 'MuseKit',
    description = 'Choose the perfect plan for your needs. Start free and scale as you grow.',
    baseUrl = '',
  } = options;

  const title = `Pricing — ${appName}`;
  const fullDescription = `${description} Plans starting from free with options for growing teams and professionals.`;
  const url = baseUrl ? `${baseUrl}/pricing` : '/pricing';

  return {
    title,
    description: fullDescription,
    openGraph: {
      title,
      description: fullDescription,
      url,
      type: 'website',
      siteName: appName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: fullDescription,
    },
    alternates: {
      canonical: url,
    },
  };
}

export interface PricingSchemaOffer {
  '@type': 'Offer';
  name: string;
  description: string;
  price: string;
  priceCurrency: string;
  availability: string;
  priceValidUntil?: string;
  url?: string;
}

export interface PricingSchema {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  brand: {
    '@type': 'Organization';
    name: string;
  };
  offers: PricingSchemaOffer[];
}

export function getPricingSchema(
  plans?: PlanTier[],
  options: { appName?: string; description?: string; baseUrl?: string } = {}
): PricingSchema {
  const {
    appName = 'MuseKit',
    description = 'SaaS platform for content creators',
    baseUrl = '',
  } = options;

  const planList = plans || getAllPlans();

  const offers: PricingSchemaOffer[] = planList.map((plan) => ({
    '@type': 'Offer',
    name: `${plan.name} Plan`,
    description: plan.description,
    price: plan.monthlyPrice.toString(),
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: baseUrl ? `${baseUrl}/pricing` : '/pricing',
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: appName,
    description,
    brand: {
      '@type': 'Organization',
      name: appName,
    },
    offers,
  };
}
