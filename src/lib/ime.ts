import { useRef } from 'react'
import type { KeyboardEvent } from 'react'

type InputEvent = KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>

/**
 * Enter-key guard for IME composition (Chinese / Japanese / Korean input).
 * Covers the standard `isComposing` flag, legacy keyCode 229, and the Safari
 * case where `compositionend` fires just before the confirming Enter keydown.
 */
export function useImeEnter() {
  const composingRef = useRef(false)
  const compositionEndAtRef = useRef(0)

  const imeProps = {
    onCompositionStart: () => { composingRef.current = true },
    onCompositionUpdate: () => { composingRef.current = true },
    onCompositionEnd: () => {
      composingRef.current = false
      compositionEndAtRef.current = Date.now()
    },
  }

  const imeConsumesEnter = (event: InputEvent): boolean => {
    if (event.nativeEvent.isComposing) return true
    if (event.keyCode === 229) return true
    if (composingRef.current) return true
    // Safari: the compositionend may land one tick before the Enter keydown.
    return Date.now() - compositionEndAtRef.current < 60
  }

  return { imeProps, imeConsumesEnter }
}
