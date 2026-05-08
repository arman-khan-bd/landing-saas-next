
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
  | "card"
  | "marquee"
  | "quote"
  | "ultra-hero"
  | "navbar"
  | "video"
  | "code"
  | "selector"
  | "score-cards"
  | "footer";

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
    backgroundImage?: string;
    textColor?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: "normal" | "italic";
    textDecoration?: "none" | "underline";
    lineHeight?: number;
    borderStyle?: "none" | "solid" | "dashed" | "dotted";
    borderWidth?: number;
    borderTopWidth?: number;
    borderBottomWidth?: number;
    borderLeftWidth?: number;
    borderRightWidth?: number;
    borderColor?: string;
    borderRadius?: number;
    boxShadow?: "none" | "sm" | "md" | "lg" | "xl";
    animation?: "none" | "fadeIn" | "slideUp" | "zoomIn" | "bounce" | "joy" | "celebrate" | "scroll-down" | "cross-sign" | "check-mark";
    hideDesktop?: boolean;
    hideMobile?: boolean;
    desktopColumns?: number;
    columns?: number;
    columnIndex?: number;
    columnSpan?: number;
    highlightColor?: string;
    accentColor?: string;
    refBgColor?: string;
    backgroundSize?: string;
    backgroundRepeat?: string;
    backgroundPosition?: string;
    backgroundTexture?: string;
    backgroundOpacity?: number;
    iconName?: string;
    iconColor?: string;
    iconSize?: number;
    iconPosition?: "left" | "right" | "top" | "bottom";
    display?: string;
    maxWidth?: string;
    alignment?: "left" | "center" | "right";
  };
  children?: Block[];
}

export interface PageStyle {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundTexture?: string;
  textColor?: string;
  primaryColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
  themeId?: string;
  accentColor?: string;
  showNavbar?: boolean;
  showFooter?: boolean;
  navbarSettings?: {
    logoText?: string;
    logoUrl?: string;
    items?: { id: string, label: string, link: string }[];
    ctaText?: string;
    ctaLink?: string;
  };
  footerSettings?: {
    text?: string;
    showSocials?: boolean;
    copyright?: string;
  };
  seoSettings?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
  };
}
