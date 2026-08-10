import { IconLoader2 } from '@tabler/icons-react'
import cx from 'classnames'
import './Spinner.css'

interface Props {
  size?: number
  className?: string
}

export function Spinner({ size = 24, className = '' }: Props) {
  return <IconLoader2 size={size} className={cx('Spinner', className)} />
}
