// Ezras Nashim Design System
// Complete styling reference for colors, fonts, gradients, and design tokens

export const DesignSystem = {
  // Color Palette - "Quiet Joy" Spiritual Retreat Theme
  colors: {
    // Primary Colors
    blush: 'hsl(350, 45%, 85%)',          // Rose blush - primary feminine color
    ivory: 'hsl(45, 60%, 95%)',          // Warm ivory - background accent  
    sandGold: 'hsl(40, 35%, 80%)',       // Sand gold - warm accent
    mutedLavender: 'hsl(260, 30%, 85%)', // Muted lavender - secondary color
    sage: 'hsl(120, 25%, 70%)',          // Sage green - completion state
    
    // Extended Palette
    roseBlush: 'hsl(350, 45%, 85%)',     // Alternative name for blush
    lavender: 'hsl(260, 30%, 85%)',      // Alternative name for muted lavender
    warmGray: 'hsl(30, 5%, 50%)',        // Warm gray for text
    
    // Text Colors
    textPrimary: '#000000',               // Pure black for main text
    textSecondary: 'rgba(0, 0, 0, 0.6)',  // Semi-transparent black
    textMuted: 'rgba(0, 0, 0, 0.4)',      // More muted text
    
    // Background Colors
    backgroundPrimary: '#ffffff',          // Pure white
    backgroundSoft: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white
    backgroundAccent: 'rgba(255, 255, 255, 0.5)', // Light accent background
    
    // Border Colors
    borderLight: 'rgba(247, 147, 164, 0.2)', // Light blush border
    borderMedium: 'rgba(247, 147, 164, 0.3)', // Medium blush border
  },

  // Gradients
  gradients: {
    // Primary Gradients
    feminine: 'linear-gradient(135deg, hsl(350, 45%, 85%) 0%, hsl(260, 30%, 85%) 100%)',
    soft: 'linear-gradient(135deg, hsl(45, 60%, 95%) 0%, hsl(350, 45%, 85%) 50%, hsl(260, 30%, 85%) 100%)',
    
    // Specific Component Gradients
    torah: 'linear-gradient(135deg, hsl(350, 45%, 85%) 0%, hsl(260, 30%, 85%) 100%)', // Feminine gradient
    tefilla: 'linear-gradient(135deg, hsl(350, 45%, 85%) 0%, hsl(260, 30%, 85%) 100%)', // Blush to lavender
    tzedaka: 'linear-gradient(135deg, hsl(260, 30%, 85%) 0%, hsl(350, 45%, 85%) 100%)', // Lavender to rose blush
  },

  // Typography
  fonts: {
    // Font Families
    serif: '"Playfair Display", serif',   // Headers and elegant text
    sans: 'Platypi, Georgia, Cambria, serif', // Body text and UI elements
    hebrew: '"Secular One", cursive',     // Hebrew text (bold weight)
    hebrewRegular: '"Heebo", sans-serif', // Hebrew text (regular weight)
    english: 'Platypi, Georgia, Cambria, serif', // English text in Hebrew contexts
    
    // Font Weights
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    // Font Sizes (in pixels)
    sizes: {
      xs: '12px',    // 0.75rem
      sm: '14px',    // 0.875rem
      base: '16px',  // 1rem
      lg: '18px',    // 1.125rem
      xl: '20px',    // 1.25rem
      '2xl': '24px', // 1.5rem
      '3xl': '30px', // 1.875rem
    },
  },

  // Spacing Scale (based on 4px grid)
  spacing: {
    0: '0px',
    1: '4px',    // 0.25rem
    2: '8px',    // 0.5rem
    3: '12px',   // 0.75rem
    4: '16px',   // 1rem
    5: '20px',   // 1.25rem
    6: '24px',   // 1.5rem
    8: '32px',   // 2rem
    10: '40px',  // 2.5rem
    12: '48px',  // 3rem
    16: '64px',  // 4rem
    20: '80px',  // 5rem
  },

  // Border Radius
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    '3xl': '32px',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  // Animation & Transitions
  animations: {
    transition: {
      fast: '150ms ease-in-out',
      normal: '300ms ease-in-out',
      slow: '500ms ease-in-out',
    },
    
    transforms: {
      hover: 'scale(1.05)',
      press: 'scale(0.95)',
    },
  },

  // Component-Specific Styles
  components: {
    // Modal styling
    modal: {
      backdropColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: '24px',
      padding: '24px',
      maxWidth: '28rem', // 448px
      maxHeight: '90vh',
    },
    
    // Button styling
    button: {
      primary: {
        background: 'linear-gradient(135deg, hsl(350, 45%, 85%) 0%, hsl(260, 30%, 85%) 100%)',
        color: '#ffffff',
        borderRadius: '12px',
        padding: '12px 24px',
        fontWeight: '500',
      },
      
      secondary: {
        background: 'rgba(255, 255, 255, 0.8)',
        color: '#000000',
        border: '1px solid rgba(247, 147, 164, 0.2)',
        borderRadius: '12px',
        padding: '12px 24px',
      },
    },
    
    // Card styling
    card: {
      background: '#ffffff',
      borderRadius: '16px',
      padding: '16px',
      border: '1px solid rgba(247, 147, 164, 0.1)',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
  },

  // Icon Sizes
  iconSizes: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },

  // Prayer-specific styling
  prayers: {
    hebrew: {
      fontFamily: '"Secular One", cursive',
      fontWeight: 'bold',
      direction: 'rtl',
      textAlign: 'right',
      lineHeight: '1.6',
    },
    
    english: {
      fontFamily: 'Platypi, Georgia, Cambria, serif',
      fontWeight: 'normal',
      direction: 'ltr',
      textAlign: 'left',
      lineHeight: '1.5',
    },
  },

  // Daily Progress Images (for your reference)
  dailyProgress: {
    // Image dimensions for the daily progress button
    container: {
      width: '120px',   // Button width
      height: '120px',  // Button height
      borderRadius: '24px',
    },
    
    // Recommended image sizes for each state
    images: {
      // State 0: Empty/outline (no completions)
      empty: {
        width: '80px',
        height: '80px',
        description: 'Outline or empty state image',
      },
      
      // State 1: Single completion
      single: {
        width: '60px',
        height: '60px',
        description: 'Small filled image for one completion',
      },
      
      // State 2: Two completions
      double: {
        width: '80px',
        height: '80px',
        description: 'Larger image for two completions',
      },
      
      // State 3: All three completions (final state)
      complete: {
        width: '100px',
        height: '100px',
        description: 'Maximum size celebration image',
      },
    },
  },
} as const;

// CSS Custom Properties for easy theming
export const cssVariables = `
:root {
  /* Colors */
  --color-blush: ${DesignSystem.colors.blush};
  --color-ivory: ${DesignSystem.colors.ivory};
  --color-sand-gold: ${DesignSystem.colors.sandGold};
  --color-muted-lavender: ${DesignSystem.colors.mutedLavender};
  --color-sage: ${DesignSystem.colors.sage};
  --color-warm-gray: ${DesignSystem.colors.warmGray};
  
  /* Text Colors */
  --text-primary: ${DesignSystem.colors.textPrimary};
  --text-secondary: ${DesignSystem.colors.textSecondary};
  --text-muted: ${DesignSystem.colors.textMuted};
  
  /* Gradients */
  --gradient-feminine: ${DesignSystem.gradients.feminine};
  --gradient-soft: ${DesignSystem.gradients.soft};
  
  /* Fonts */
  --font-serif: ${DesignSystem.fonts.serif};
  --font-sans: ${DesignSystem.fonts.sans};
  --font-hebrew: ${DesignSystem.fonts.hebrew};
  --font-hebrew-regular: ${DesignSystem.fonts.hebrewRegular};
  
  /* Spacing */
  --spacing-xs: ${DesignSystem.spacing[1]};
  --spacing-sm: ${DesignSystem.spacing[2]};
  --spacing-md: ${DesignSystem.spacing[4]};
  --spacing-lg: ${DesignSystem.spacing[6]};
  --spacing-xl: ${DesignSystem.spacing[8]};
  
  /* Border Radius */
  --radius-sm: ${DesignSystem.borderRadius.sm};
  --radius-md: ${DesignSystem.borderRadius.md};
  --radius-lg: ${DesignSystem.borderRadius.lg};
  --radius-xl: ${DesignSystem.borderRadius.xl};
  --radius-2xl: ${DesignSystem.borderRadius['2xl']};
  --radius-3xl: ${DesignSystem.borderRadius['3xl']};
}
`;

export default DesignSystem;