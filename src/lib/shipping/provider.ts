export interface ShippingQuoteRequest {
  destinationCep: string;
  itemsCount: number;
  totalWeightG: number;
  totalOrderAmount: number;
}

export interface ShippingOption {
  serviceId: string;
  carrierName: string;
  serviceName: string;
  cost: number;
  deliveryDays: number;
  isFree: boolean;
}

export interface ShippingProvider {
  calculateShipping(request: ShippingQuoteRequest): Promise<ShippingOption[]>;
}

/**
 * Provedor de Frete Base / Padrão (SEDEX e PAC calculados de forma determinística
 * baseando-se em faixas de CEP brasileiras, enquanto credenciais de Correios/Melhor Envio
 * estiverem em provisionamento).
 */
export class StandardShippingProvider implements ShippingProvider {
  async calculateShipping(request: ShippingQuoteRequest): Promise<ShippingOption[]> {
    const cleanCep = request.destinationCep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      return [];
    }

    // Regra de Frete Grátis para pedidos acima de R$ 250,00
    const qualifiesForFreeShipping = request.totalOrderAmount >= 250;

    // Regra determinística por região (faixas de CEP do Brasil)
    // 01000 a 19999 = SP
    // 20000 a 28999 = RJ / 29000 a 29999 = ES / 30000 a 39999 = MG
    // 40000 a 65999 = Nordeste
    // 66000 a 69999 = Norte
    // 70000 a 76999 = Centro-Oeste
    // 80000 a 99999 = Sul
    const cepNum = parseInt(cleanCep, 10);
    const weightKg = Math.max(0.3, request.totalWeightG / 1000);

    let basePac = 22.0;
    let baseSedex = 35.0;
    let pacDays = 7;
    let sedexDays = 3;

    if (cepNum >= 1000000 && cepNum <= 19999999) {
      // São Paulo (Origem da fábrica)
      basePac = 14.9;
      baseSedex = 21.9;
      pacDays = 3;
      sedexDays = 1;
    } else if (cepNum <= 39999999) {
      // Sudeste
      basePac = 19.9;
      baseSedex = 29.9;
      pacDays = 5;
      sedexDays = 2;
    } else if (cepNum >= 80000000 && cepNum <= 99999999) {
      // Sul
      basePac = 24.9;
      baseSedex = 38.9;
      pacDays = 6;
      sedexDays = 3;
    } else if (cepNum >= 70000000 && cepNum <= 79999999) {
      // Centro-Oeste
      basePac = 28.9;
      baseSedex = 44.9;
      pacDays = 7;
      sedexDays = 3;
    } else {
      // Norte e Nordeste
      basePac = 36.9;
      baseSedex = 59.9;
      pacDays = 10;
      sedexDays = 4;
    }

    // Ajuste por peso excedente a 1kg
    if (weightKg > 1) {
      const extraWeight = weightKg - 1;
      basePac += extraWeight * 5.0;
      baseSedex += extraWeight * 8.0;
    }

    const pacCost = qualifiesForFreeShipping ? 0 : Number(basePac.toFixed(2));
    const sedexCost = Number(baseSedex.toFixed(2));

    const options: ShippingOption[] = [
      {
        serviceId: "pac",
        carrierName: "Correios",
        serviceName: qualifiesForFreeShipping ? "PAC (Frete Grátis)" : "PAC Econômico",
        cost: pacCost,
        deliveryDays: pacDays,
        isFree: qualifiesForFreeShipping,
      },
      {
        serviceId: "sedex",
        carrierName: "Correios",
        serviceName: "SEDEX Expresso",
        cost: sedexCost,
        deliveryDays: sedexDays,
        isFree: false,
      },
    ];

    return options;
  }
}

let activeProvider: ShippingProvider = new StandardShippingProvider();

export function getShippingProvider(): ShippingProvider {
  return activeProvider;
}

export function setShippingProvider(provider: ShippingProvider) {
  activeProvider = provider;
}
