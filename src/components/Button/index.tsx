import cx from 'classnames'
import type { ButtonHTMLAttributes, DetailedHTMLProps } from 'react'
import './Button.css'

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
        'Button',
        {
          [`Button--${variant}`]: true,
          'Button--small': small,
          'Button--rounded': rounded,
        },
        className,
      )}
      {...props}
    />
  )
}
