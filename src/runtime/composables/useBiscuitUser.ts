import type { Ref } from 'vue'
import { useRuntimeConfig, useState } from '#imports'

const DEFAULT_STATE_KEY = 'biscuit:user'

/**
 * Shared state holder for the authenticated Biscuit user.
 * Consumers receive a global ref that survives across requests.
 */
export const useBiscuitUser = <T>(): Ref<T | null> => {
  const config = useRuntimeConfig()
  const stateKey = config.public?.biscuit?.userStateKey ?? DEFAULT_STATE_KEY

  return useState<T | null>(stateKey, () => null)
}
