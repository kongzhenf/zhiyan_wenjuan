const STORAGE_KEY = 'questionnaire_device_id'

function generateId(): string {
  const nav = window.navigator
  const screen = window.screen
  const raw = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    Math.random().toString(36).substring(2, 10)
  ].join('|')

  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 'fp_' + Math.abs(hash).toString(36) + Date.now().toString(36)
}

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(STORAGE_KEY)
  if (!deviceId) {
    deviceId = generateId()
    localStorage.setItem(STORAGE_KEY, deviceId)
  }
  return deviceId
}
