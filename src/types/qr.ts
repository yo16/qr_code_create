export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
}

export interface LogoConfig {
  dataUrl: string;
  fileName: string;
  fileType: string;
  fileSizeKb: number;
  sizePercent: number; // 10-25 (誤り訂正レベルHの安全範囲)
}

export interface CaptionConfig {
  text: string;
  fontSize: number; // 10-24
}

export interface DecorationConfig {
  fgColor: string;
  bgColor: string;
  logo: LogoConfig | null;
  frameType: string | null;
  caption: CaptionConfig;
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
    logo: null,
    frameType: null,
    caption: { text: "", fontSize: 14 },
    preset: null,
  },
  currentStep: 1,
};
