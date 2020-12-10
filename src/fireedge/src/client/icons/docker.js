import * as React from 'react'
import { number, string, oneOfType } from 'prop-types'

function DockerLogo ({ viewBox, width, height, color, ...props }) {
  return (
    <svg viewBox={viewBox} width={width} height={height} {...props} {...props}>
      <path
        fill={color}
        d="M296 245h42v-38h-42zm-50 0h42v-38h-42zm-49 0h42v-38h-42zm-49 0h41v-38h-41zm-50 0h42v-38H98zm50-46h41v-38h-41zm49 0h42v-38h-42zm49 0h42v-38h-42zm0-46h42v-38h-42zm226 75s-18-17-55-11c-4-29-35-46-35-46s-29 35-8 74c-6 3-16 7-31 7H68c-5 19-5 145 133 145 99 0 173-46 208-130 52 4 63-39 63-39z"
      />
    </svg>
  )
}

DockerLogo.propTypes = {
  width: oneOfType([number, string]).isRequired,
  height: oneOfType([number, string]).isRequired,
  viewBox: string,
  color: string
}

DockerLogo.defaultProps = {
  width: 360,
  height: 360,
  viewBox: '0 0 512 512',
  color: '#066da5'
}

export default DockerLogo
