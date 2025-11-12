import { getRequestURL, appendResponseHeaders, defineEventHandler, setResponseStatus } from 'h3'
import type { H3Event } from 'h3'

export default defineEventHandler((event: H3Event) => {
  const { protocol } = getRequestURL(event)

  appendResponseHeaders(event, {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': `${protocol}//127.0.0.1:40463`,
    'Cache-Control': 'no-cache, private',
    'Set-Cookie': 'XSRF-TOKEN=fake-csrf-token; Path=/; Secure; SameSite=Lax',
  })

  // Sanctum usually returns 204 No Content
  setResponseStatus(event, 204)

  return null
})
