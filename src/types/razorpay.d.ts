export interface RazorpayTheme {
  color?: string;
}

export interface RazorpayPrefill {
  email?: string;
}

export interface RazorpayOptions {
  key?: string;
  subscription_id?: string;
  name?: string;
  description?: string;
  handler?: (response: unknown) => void;
  prefill?: RazorpayPrefill;
  theme?: RazorpayTheme;
}

export interface RazorpayInstance {
  open(): void;
}

export interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}
