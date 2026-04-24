export type BlockType =
  | "header"
  | "paragraph"
  | "rich-text"
  | "image"
  | "accordion"
  | "button"
  | "link"
  | "carousel"
  | "checked-list"
  | "product-order-form"
  | "row"
  | "card";

export interface Block {
  id: string;
  type: BlockType;
  content: any;
  style: {
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    textAlign?: "left" | "center" | "right" | "justify";
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: "normal" | "italic";
    textDecoration?: "none" | "underline";
    lineHeight?: number;
    borderStyle?: "none" | "solid" | "dashed" | "dotted";
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
    boxShadow?: "none" | "sm" | "md" | "lg" | "xl";
    animation?: "none" | "fadeIn" | "slideUp" | "zoomIn";
    hideDesktop?: boolean;
    hideMobile?: boolean;
    desktopColumns?: number;
    columns?: number;
    columnIndex?: number;
    columnSpan?: number;
  };
  children?: Block[];
}

export interface PageStyle {
  backgroundColor?: string;
  backgroundImage?: string;
  textColor?: string;
  primaryColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
  themeId?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  previewColor: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "classic-light",
    name: "Classic Light",
    backgroundColor: "#FFFFFF",
    textColor: "#0F172A",
    primaryColor: "#145DCC",
    previewColor: "#FFFFFF"
  },
  {
    id: "midnight-pro",
    name: "Midnight Pro",
    backgroundColor: "#0F172A",
    textColor: "#F8FAFC",
    primaryColor: "#38BDF8",
    previewColor: "#0F172A"
  },
  {
    id: "ocean-deep",
    name: "Ocean Deep",
    backgroundColor: "#083344",
    textColor: "#E0F2FE",
    primaryColor: "#0EA5E9",
    previewColor: "#083344"
  },
  {
    id: "soft-rose",
    name: "Soft Rose",
    backgroundColor: "#FFF1F2",
    textColor: "#881337",
    primaryColor: "#E11D48",
    previewColor: "#FFF1F2"
  },
  {
    id: "sunset-gold",
    name: "Sunset Gold",
    backgroundColor: "#FFFBEB",
    textColor: "#78350F",
    primaryColor: "#F59E0B",
    previewColor: "#FFFBEB"
  }
];
