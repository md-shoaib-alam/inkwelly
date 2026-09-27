import React from 'react';
import { SvgXml } from 'react-native-svg';
import { tabIcons } from '../../assets/images/tabIcons';

interface TabIconProps {
  name: string;
  color: any;
  size: number;
  focused?: boolean;
}

// In-memory cache for processed SVG XML strings to avoid repetitive regex parsing
const xmlCache = new Map<string, string>();

function getProcessedXml(iconKey: string, rawXml: string, colorStr: string): string {
  const cacheKey = `${iconKey}:::${colorStr}`;
  const cached = xmlCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Parse each SVG shape tag. If it is NOT an outline (i.e. doesn't have fill="none" or fill:none),
  // and has no explicit fill attribute, set its fill to "currentColor" so it uses the theme color.
  let processed = rawXml.replace(/<([a-z]+)([^>]*?)(\/?)>/gi, (match, tag, attrs, selfClosing) => {
    const lowerTag = tag.toLowerCase();
    if (!['path', 'circle', 'rect', 'ellipse', 'polygon', 'polyline', 'line'].includes(lowerTag)) {
      return match;
    }
    if (attrs.includes('fill="none"') || attrs.includes('fill:none')) {
      return match;
    }
    if (attrs.includes('fill=')) {
      return match;
    }
    return `<${tag}${attrs} fill="currentColor"${selfClosing}>`;
  });

  // Replace hardcoded black colors with the dynamic color from props
  processed = processed
    .replace(/stroke=["']#000(000)?["']/g, `stroke="${colorStr}"`)
    .replace(/fill=["']#000(000)?["']/g, `fill="${colorStr}"`)
    .replace(/stroke:#000(000)?/g, `stroke:${colorStr}`)
    .replace(/fill:#000(000)?/g, `fill:${colorStr}`)
    .replace(/currentColor/g, colorStr);

  xmlCache.set(cacheKey, processed);
  return processed;
}

export const TabIcon = React.memo(function TabIcon({ name, color, size, focused }: TabIconProps) {
  // If focused is true and the icon name ends with '-outline', use the filled version (without '-outline')
  let iconName = name;
  if (focused && name.endsWith('-outline')) {
    iconName = name.slice(0, -8);
  }

  const hasVariant = !!tabIcons[iconName];
  const activeIconKey = hasVariant ? iconName : name;
  const rawXml = tabIcons[activeIconKey];

  if (!rawXml) {
    // Fallback in case the icon isn't downloaded yet or is missing
    return null;
  }

  const colorStr = String(color);
  const processedXml = getProcessedXml(activeIconKey, rawXml, colorStr);

  // SvgXml renders local SVG strings directly. 
  return (
    <SvgXml 
      xml={processedXml} 
      width={size} 
      height={size} 
      fill={color}
      color={color}
    />
  );
});
