"use client";

import React, { memo } from "react";
import { 
  ClassicQuadAdmitCard, 
  PremiumModernAdmitCard, 
  DetailedDualAdmitCard, 
  MinimalTicketAdmitCard,
  AdmitCard
} from "./templates";

export const AdmitCardVisual = memo(function AdmitCardVisual({ 
  card, 
  templateId = 'classic_quad' 
}: { 
  card: AdmitCard; 
  templateId?: string;
}) {
  switch (templateId) {
    case 'premium_modern':
      return <PremiumModernAdmitCard card={card} />;
    case 'compact_dual':
      return <DetailedDualAdmitCard card={card} />;
    case 'minimal_ticket':
      return <MinimalTicketAdmitCard card={card} />;
    case 'classic_quad':
    default:
      return <ClassicQuadAdmitCard card={card} />;
  }
});
