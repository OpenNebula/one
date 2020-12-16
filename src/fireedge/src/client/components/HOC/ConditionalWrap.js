import { cloneElement } from 'react'

export default ({ condition, children, wrap }) =>
  condition ? cloneElement(wrap(children)) : children
