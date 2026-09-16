// lib/etims/tax-engine.ts

export type KraTaxCategory = 'A_EXEMPT' | 'B_STANDARD_16' | 'C_ZERO_RATED' | 'E_NON_VAT';

export type BillingItemType = 
  | 'residential_rent' 
  | 'commercial_rent' 
  | 'service_charge' 
  | 'parking' 
  | 'water_utility' 
  | 'electricity' 
  | 'security_deposit';

export interface RawLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  itemType: BillingItemType;
  overrideTaxCategory?: KraTaxCategory;
}

export interface ProcessedLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  itemType: BillingItemType;
  taxCategory: KraTaxCategory;
  kraTaxCode: string; // "A", "B", "C", or "E"
  taxRate: number;    // 0.16 or 0
  taxableAmount: number;
  vatAmount: number;
  totalAmount: number;
}

export interface InvoiceTaxSummary {
  items: ProcessedLineItem[];
  subtotalTaxable: number;
  subtotalExempt: number;
  totalVat: number;
  grandTotal: number;
}

/**
 * Determines the KRA Tax Category based on property billing item type
 */
export function determineTaxCategory(itemType: BillingItemType): { category: KraTaxCategory; rate: number; kraCode: string } {
  switch (itemType) {
    case 'residential_rent':
      // Residential rent is EXEMPT from VAT under Kenyan Tax Law
      return { category: 'A_EXEMPT', rate: 0.0, kraCode: 'A' };
      
    case 'commercial_rent':
    case 'service_charge':
    case 'parking':
      // Commercial rent, service charges, & parking are Standard Rated 16% VAT
      return { category: 'B_STANDARD_16', rate: 0.16, kraCode: 'B' };
      
    case 'security_deposit':
      // Refundable deposits are non-VAT disbursements
      return { category: 'E_NON_VAT', rate: 0.0, kraCode: 'E' };
      
    case 'water_utility':
    case 'electricity':
      // Re-billed utilities standard rated unless passed at cost
      return { category: 'B_STANDARD_16', rate: 0.16, kraCode: 'B' };

    default:
      return { category: 'A_EXEMPT', rate: 0.0, kraCode: 'A' };
  }
}

/**
 * Calculates item totals, VAT, and prepares payload data for eTIMS transmission
 */
export function calculateInvoiceTaxes(rawItems: RawLineItem[]): InvoiceTaxSummary {
  let subtotalTaxable = 0;
  let subtotalExempt = 0;
  let totalVat = 0;

  const processedItems: ProcessedLineItem[] = rawItems.map((item) => {
    const defaultTax = determineTaxCategory(item.itemType);
    const category = item.overrideTaxCategory || defaultTax.category;
    const rate = category === 'B_STANDARD_16' ? 0.16 : 0.0;
    const kraCode = category === 'B_STANDARD_16' ? 'B' : category === 'A_EXEMPT' ? 'A' : category === 'C_ZERO_RATED' ? 'C' : 'E';

    const baseAmount = Number((item.quantity * item.unitPrice).toFixed(2));
    
    let taxableAmount = 0;
    let vatAmount = 0;

    if (category === 'B_STANDARD_16') {
      // Net amount before VAT
      taxableAmount = baseAmount;
      vatAmount = Number((baseAmount * rate).toFixed(2));
      subtotalTaxable += taxableAmount;
      totalVat += vatAmount;
    } else {
      taxableAmount = baseAmount;
      vatAmount = 0;
      subtotalExempt += baseAmount;
    }

    const totalAmount = Number((taxableAmount + vatAmount).toFixed(2));

    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      itemType: item.itemType,
      taxCategory: category,
      kraTaxCode: kraCode,
      taxRate: rate,
      taxableAmount,
      vatAmount,
      totalAmount,
    };
  });

  const grandTotal = Number((subtotalTaxable + subtotalExempt + totalVat).toFixed(2));

  return {
    items: processedItems,
    subtotalTaxable: Number(subtotalTaxable.toFixed(2)),
    subtotalExempt: Number(subtotalExempt.toFixed(2)),
    totalVat: Number(totalVat.toFixed(2)),
    grandTotal,
  };
}