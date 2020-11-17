import React from 'react'

export default ({ condition, children, wrap }) =>
  condition ? React.cloneElement(wrap(children)) : children
