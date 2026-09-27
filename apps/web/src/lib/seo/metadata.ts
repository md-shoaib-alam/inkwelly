import { Metadata } from "next";
import { SEO_CONFIG } from "./config";

/**
 * Generates dynamic, advanced metadata for any page.
 */
export function generateAdvancedMetadata(params: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
} = {}): Metadata {
  const title = params.title 
    ? `${params.title} | ${SEO_CONFIG.brandName}`
    : `${SEO_CONFIG.brandName} | ${SEO_CONFIG.tagline}`;
    
  const description = params.description || SEO_CONFIG.description;
  const url = `${SEO_CONFIG.siteUrl}${params.path || ""}`;

  return {
    title,
    description,
    keywords: SEO_CONFIG.keywords,
    category: "Educational Technology / School ERP",
    classification: "Enterprise School Management Software",
    metadataBase: new URL(SEO_CONFIG.siteUrl),
    alternates: {
      canonical: url,
    },
    
    // 🌍 Search Engine Visibility
    robots: {
      index: !params.noIndex,
      follow: !params.noIndex,
      nocache: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // 📱 Open Graph (Facebook, WhatsApp, LinkedIn)
    openGraph: {
      title,
      description,
      url,
      siteName: SEO_CONFIG.brandName,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: params.image || "/og-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    // 🐦 Twitter / X
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: SEO_CONFIG.social.twitter,
      creator: SEO_CONFIG.social.twitter,
      images: [params.image || "/og-image.png"],
    },

    // 🎨 App Identity
    applicationName: SEO_CONFIG.brandName,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: SEO_CONFIG.brandName,
    },
    formatDetection: {
      telephone: false,
    },
  };
}
