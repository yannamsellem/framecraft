import type { ButtonHTMLAttributes, DetailedHTMLProps } from 'react'
import './Button.css'
import cx from 'classnames'

type DefaultButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>

export interface Props extends DefaultButtonProps {
  variant?: 'primary' | 'secondary'
  className?: string
  small?: boolean
  rounded?: boolean
}

export function Button({
  variant = 'primary',
  className,
  small = false,
  rounded = false,
  ...props
}: Props) {
  return (
    <button
      className={cx(
        'button',
        {
          button__primary: variant === 'primary',
          button__small: small,
          button__rounded: rounded,
        },
        className,
      )}
      {...props}
    />
  )
}
