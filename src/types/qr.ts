export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
}

export interface DecorationConfig {
  fgColor: string;
  bgColor: string;
  logoSrc: string | null;
  frameType: string | null;
  caption: string;
  preset: string | null;
}

export interface QrState {
  url: string;
  isUrlValid: boolean;
  utm: UtmParams;
  decoration: DecorationConfig;
  currentStep: number; // 1-4
}

export const INITIAL_QR_STATE: QrState = {
  url: "",
  isUrlValid: false,
  utm: { source: "", medium: "qr", campaign: "", term: "", content: "" },
  decoration: {
    fgColor: "#000000",
    bgColor: "#ffffff",
    logoSrc: null,
    frameType: null,
    caption: "",
    preset: null,
  },
  currentStep: 1,
};
