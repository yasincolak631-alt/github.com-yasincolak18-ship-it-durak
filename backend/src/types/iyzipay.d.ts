declare module 'iyzipay' {
  export default class Iyzipay {
    constructor(options: { apiKey: string; secretKey: string; uri: string });
    static LOCALE: { TR: string; EN: string };
    static CURRENCY: { TRY: string; USD: string; EUR: string };
    static PAYMENT_GROUP: { PRODUCT: string; LISTING: string; SUBSCRIPTION: string };
    static BASKET_ITEM_TYPE: { PHYSICAL: string; VIRTUAL: string };
    static SUB_MERCHANT_TYPE: { PERSONAL: string; PRIVATE_COMPANY: string; LIMITED_OR_JOINT_STOCK_COMPANY: string };

    checkoutFormInitialize: {
      create(request: Record<string, any>, callback: (err: any, result: any) => void): void;
    };
    checkoutForm: {
      retrieve(request: Record<string, any>, callback: (err: any, result: any) => void): void;
    };
    subMerchant: {
      create(request: Record<string, any>, callback: (err: any, result: any) => void): void;
      retrieve(request: Record<string, any>, callback: (err: any, result: any) => void): void;
    };
    refund: {
      create(request: Record<string, any>, callback: (err: any, result: any) => void): void;
    };
  }
}
