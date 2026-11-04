export const CONFIG = {
  ORG_ID: '01a02774-5a8e-7417-83b2-bcd5ec5b0a93',
  WORKSPACE_ID: '01a02774-5a93-78e1-88df-42475fe29aa0',
  APP_ID: 'Conversatio-63a490c9-20af',
  BASE_URL: 'https://apps.sarvam.ai/api/analytics/v1',
} as const

export const API_BASE_PATH = `${CONFIG.ORG_ID}/${CONFIG.WORKSPACE_ID}/${CONFIG.APP_ID}`

export const SETSMART_CONFIG = {
  BASE_URL: '/api/setsmart',
  CLIENT_ID: 'sonuabraham0',
} as const
