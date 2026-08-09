import { useState, useCallback, useRef, useEffect } from 'react'

type UseAutoResetStateOptions = {
  after: number
}

export function useAutoResetState<T>(
  initialValue: T,
  options: UseAutoResetStateOptions,
): [T, (value: T, nextValue?: T) => void] {
  const [state, setState] = useState<T>(initialValue)
  const timeoutRef = useRef<number | null>(null)

  const setTimedState = useCallback(
    (value: T, nextValue: T = initialValue) => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }

      setState(value)

      timeoutRef.current = window.setTimeout(() => {
        setState(nextValue)
        timeoutRef.current = null
      }, options.after)
    },
    [initialValue, options.after],
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [state, setTimedState]
}
