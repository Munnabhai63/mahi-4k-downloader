// apps/web/src/lib/i18n.ts - Full English & Hindi (हिन्दी) Localization Dictionary

export type Locale = 'EN' | 'HI';

export interface Translations {
  hero: {
    tagline: string;
    title1: string;
    titleHighlight: string;
    subtitle: string;
    fastNote: string;
  };
  pasteBar: {
    singleLink: string;
    batchMode: string;
    smartModeOn: string;
    smartModeOff: string;
    placeholder: string;
    pasteBtn: string;
    analyzeBtn: string;
    analyzingBtn: string;
    batchTitle: string;
    batchPlaceholder: string;
    batchProcessBtn: string;
  };
  nav: {
    downloader: string;
    active: string;
    history: string;
    settings: string;
    signIn: string;
    signOut: string;
    newGrab: string;
  };
  stats: {
    videosGrabbed: string;
    successRate: string;
    platformsSupported: string;
  };
  features: {
    heading: string;
    subheading: string;
  };
  howItWorks: {
    heading: string;
    subheading: string;
  };
  faq: {
    heading: string;
    subheading: string;
  };
}

export const translations: Record<Locale, Translations> = {
  EN: {
    hero: {
      tagline: 'Next-Generation Universal Video Downloader',
      title1: 'Download any video.',
      titleHighlight: 'Blazing fast.',
      subtitle:
        'Save videos, reels, stories and audio from YouTube, Instagram, X, TikTok, and 1,000+ sites in up to 8K Ultra-HD with zero installations required.',
      fastNote: 'Fast analysis • Up to 8K resolution • No watermarks • High-speed MP3 conversion',
    },
    pasteBar: {
      singleLink: 'Single Link',
      batchMode: 'Batch Mode (Up to 50)',
      smartModeOn: 'Smart Mode ON',
      smartModeOff: 'Smart Mode OFF',
      placeholder: 'Paste YouTube, Instagram, X, TikTok or Facebook link...',
      pasteBtn: 'Paste',
      analyzeBtn: 'Analyze',
      analyzingBtn: 'Analyzing...',
      batchTitle: 'Paste one URL per line (Max 50 URLs)',
      batchPlaceholder: 'https://www.youtube.com/watch?v=...\nhttps://www.instagram.com/reel/...',
      batchProcessBtn: 'Process Batch',
    },
    nav: {
      downloader: 'Downloader',
      active: 'Active',
      history: 'History',
      settings: 'Settings',
      signIn: 'Sign In',
      signOut: 'Sign Out',
      newGrab: 'New Grab',
    },
    stats: {
      videosGrabbed: 'Videos & Audios Grabbed',
      successRate: 'Download Success Rate',
      platformsSupported: 'Global Platforms Supported',
    },
    features: {
      heading: 'Engineered for Pure Speed & Simplicity',
      subheading: 'Everything you need to download, transcode, and organize video and audio.',
    },
    howItWorks: {
      heading: 'How TurboGrab Works',
      subheading: 'Three frictionless steps from video URL to high-speed file download.',
    },
    faq: {
      heading: 'Frequently Asked Questions',
      subheading: 'Everything you need to know about TurboGrab and fair use video downloading.',
    },
  },
  HI: {
    hero: {
      tagline: 'अगली पीढ़ी का यूनिवर्सल वीडियो डाउनलोडर',
      title1: 'कोई भी वीडियो डाउनलोड करें।',
      titleHighlight: 'सुपर फास्ट।',
      subtitle:
        'YouTube, Instagram, X, TikTok और 1,000+ वेबसाइटों से 8K अल्ट्रा-एचडी तक के वीडियो, रील्स और ऑडियो आसानी से सेव करें — बिना किसी सॉफ्टवेयर इंस्टॉलेशन के।',
      fastNote: 'तेज़ विश्लेषण • 8K रिज़ॉल्यूशन तक • बिना वाटरमार्क • हाई-स्पीड MP3 रूपांतरण',
    },
    pasteBar: {
      singleLink: 'एक लिंक',
      batchMode: 'बैच मोड (50 लिंक तक)',
      smartModeOn: 'स्मार्ट मोड चालू',
      smartModeOff: 'स्मार्ट मोड बंद',
      placeholder: 'YouTube, Instagram, X, TikTok या Facebook लिंक पेस्ट करें...',
      pasteBtn: 'पेस्ट करें',
      analyzeBtn: 'विश्लेषण करें',
      analyzingBtn: 'जाँच जारी है...',
      batchTitle: 'प्रति पंक्ति एक URL पेस्ट करें (अधिकतम 50 URL)',
      batchPlaceholder: 'https://www.youtube.com/watch?v=...\nhttps://www.instagram.com/reel/...',
      batchProcessBtn: 'बैच शुरू करें',
    },
    nav: {
      downloader: 'डाउनलोडर',
      active: 'चालू कार्य',
      history: 'इतिहास',
      settings: 'सेटिंग्स',
      signIn: 'लॉग इन',
      signOut: 'लॉग आउट',
      newGrab: 'नया डाउनलोड',
    },
    stats: {
      videosGrabbed: 'वीडियो और ऑडियो डाउनलोड किए गए',
      successRate: 'डाउनलोड सफलता दर',
      platformsSupported: 'समर्थित वैश्विक प्लेटफॉर्म',
    },
    features: {
      heading: 'अत्यधिक गति और सरलता के लिए डिज़ाइन किया गया',
      subheading: 'वीडियो और ऑडियो को डाउनलोड, कंवर्ट और प्रबंधित करने के लिए हर सुविधा।',
    },
    howItWorks: {
      heading: 'TurboGrab कैसे काम करता है',
      subheading: 'URL से हाई-स्पीड फाइल डाउनलोड तक केवल तीन सरल चरण।',
    },
    faq: {
      heading: 'अक्सर पूछे जाने वाले प्रश्न',
      subheading: 'TurboGrab और सुरक्षित वीडियो डाउनलोडिंग के बारे में आपकी सारी जानकारी।',
    },
  },
};
