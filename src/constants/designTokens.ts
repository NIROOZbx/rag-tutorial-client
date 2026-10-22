/**
 * PDF Chat / Design System Tokens (Foundation 1.0)
 * Measured directly from 1440x1024 reference design
 */

export const DESIGN_TOKENS = {
  colors: {
    caption: '#383838',
    textPrimary: '#111827',
    textSecondary: '#7F7F7F',
    borderDefault: '#D1D5DB',
    borderComposer: '#CDCDCD',
    surfaceWorkspace: '#F4F4F4',
    surfaceCard: '#FFFFFF',
    gradient59: 'linear-gradient(59deg, #8FDAF2 0%, #C9E8F2 35%, #98DFF5 66%, #DFF8FF 100%)',
  },
  radii: {
    card: '10px',
    assistant: '20px',
    workspace: '30px',
    composer: '37px',
    user: '50px',
    surround: '51px',
  },
  dimensions: {
    surroundWidth: 1140,
    surroundHeight: 724,
    workspaceWidth: 1090,
    workspaceHeight: 674,
    composerWidth: 599,
    composerHeight: 40.67,
    idleCardWidth: 254,
    idleCardHeight: 89,
    errorCardWidth: 340,
    errorCardHeight: 150,
    retryButtonWidth: 109,
    retryButtonHeight: 30,
    mascotSizeLarge: 72,
    mascotSizeSmall: 34,
  },
} as const
