const styles = require('./button.styl')

import { h, VNode, EventHandler } from 'kaiju'

import { addClassName } from 'util/vnode'


interface Props {
  icon?: VNode
  label?: string
  className?: string
  events?: { mousedown?: EventHandler<MouseEvent> }
}

export default function button({ icon, label, className = '', events }: Props) {
  return h(`button.${className}`, { events }, [
    icon && addClassName(icon, styles.icon) || '',
    label || ''
  ])
}
