/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import React, { memo } from 'react'
import { number, string, bool, oneOfType } from 'prop-types'
import { useTheme } from '@material-ui/core'

const Logo = memo(({ width, height, spinner, withText, viewBox, ...props }) => {
  const { palette: { type } } = useTheme()
  const isDarkMode = type === 'dark'

  const cloudColor = {
    child1: { from: '#bfe6f2', to: '#ffffff', static: isDarkMode ? '#ffffff' : '#bfe6f2' },
    child2: { from: '#80cde6', to: '#ffffff', static: isDarkMode ? '#ffffff' : '#80cde6' },
    child3: { from: '#40b3d9', to: '#ffffff', static: isDarkMode ? '#ffffff' : '#40b3d9' },
    child4: { from: '#0098c3', to: '#ffffff', static: isDarkMode ? '#ffffff' : '#0098c3' },
    child5: { from: '#0098c3', to: '#ffffff', static: isDarkMode ? '#ffffff' : '#0098c3' }
  }

  const textColor = {
    top: 'currentColor',
    bottom: isDarkMode ? 'currentColor' : '#0098c3'
  }

  return (
    <svg viewBox={viewBox} width={width} height={height} {...props}>
      {spinner && (
        <defs>
          {Object.entries(cloudColor)?.map(([key, color]) => (
            <linearGradient
              key={`gradient-${key}`}
              id={`gradient__${key}`}
              x1="0%"
              x2="200%"
            >
              <stop offset="0%" stopColor={color.from} />
              <stop offset="200%" stopColor={color.to} />
              <animate
                attributeName="x2"
                dur="2000ms"
                repeatCount="indefinite"
                values="10%; 100%; 200%"
              />
            </linearGradient>
          ))}
        </defs>
      )}
      {/*  --------------- CLOUD ------------------ */}
      <path
        fill={spinner ? 'url(#gradient__child1)' : cloudColor.child1.static}
        d="M124.9,130.9c-4.6,1.1-9.1,2.2-13.7,3.2c-28,6-56.5,9.8-85.1,11.3c-1.8-0.2,0.7,1.1,1.1,1.5c7.6,5.5,17.5,6.5,26.9,6.6c22.9,0,45.7,0,68.6,0c0.8,0,1.3-0.2,1.7-0.7c0.5-0.5,0.5-1.7,0.5-1.7V130.9z"
      />
      <path
        fill={spinner ? 'url(#gradient__child2)' : cloudColor.child2.static}
        d="M124.9,106.1c-14.4,6.8-29.5,12.3-44.8,16.9c-20.6,5.9-41.7,10.3-63,12.7c1.2,1.8,2.1,4.5,4.2,5.3c34.8-1.7,69.7-6.4,103.6-14.9V106.1z"
      />
      <path
        fill={spinner ? 'url(#gradient__child3)' : cloudColor.child3.static}
        d="M124.9,81.6c-26,17.6-55.7,29.3-85.9,37.2c-8.5,2.1-17.1,4.4-25.7,5.8c0.4,2.3,0.9,4.4,1.8,6.6c36.5-4.3,72.7-13.2,106.2-28.6c1.2-0.6,2.5-1.2,3.7-1.8V81.6z"
      />
      <path
        fill={spinner ? 'url(#gradient__child4)' : cloudColor.child4.static}
        d="M124.9,47.1c-13.1,15.6-29.7,28.1-47.4,38.2c-18.8,10.6-39,18.8-59.6,24.9c-1.5,0.8-4.4,0.5-4.3,2.8c-0.5,2.3-0.7,4.6-0.7,6.9c33.6-6.4,66.7-17,96.5-34.1c5.3-3.1,10.5-6.4,15.6-9.9V47.1z"
      />
      <path
        fill={spinner ? 'url(#gradient__child5)' : cloudColor.child5.static}
        d="M124.9,12.9c-0.4-0.9-1.8-0.4-3.3,0.3c-5.7,2.4-28.8,13.7-32.3,28.7c-1.4,1.9-3.5-0.5-5.1-1c-13.1-6.4-29.7-4.3-40.9,5.1c-11.2,9-17.3,25.1-12.2,39c0.8,1.6,1.6,3.8-0.1,5.2c-2.1,1.4-4.4,2.5-6.2,4.3c-3.7,3.1-6.9,7.1-8.9,11.3c30.7-9.3,60.8-22.5,85.9-42.8c8.4-7,16.3-14.7,22.9-23.4V12.9z"
      />

      {withText && (
        <g id='logo__text'>
          {/*  --------------- TEXT TOP ------------------ */}
          <path
            fill={textColor.top}
            d="M170.9,24.6c10.7,0,19,8.6,19,19.7c0,11.2-8.1,19.5-19,19.5c-10.9,0-19.5-8.6-19.5-19.5C151.4,33,159.9,24.6,170.9,24.6z M171.1,14.3c-17.2,0-30.4,13.1-30.4,29.9c0,16.7,13.4,29.9,30.3,29.9c16.8,0,29.7-13.1,29.7-29.9C200.7,27.6,187.5,14.3,171.1,14.3z"
          />
          <path
            fill={textColor.top}
            d="M230.4,38.3c7,0,12.4,5.7,12.4,13.2c0,7.3-5.4,13-12.2,13c-7.3,0-12.8-5.6-12.8-13.2C217.8,43.9,223.2,38.3,230.4,38.3z M208,87.5h10.4V69c4,3.5,8,5.1,13.3,5.1c12.5,0,21.6-9.7,21.6-22.8c0-13-9-22.5-21.5-22.5c-5.9,0-10.8,2.1-14.2,6.1v-5.1H208V87.5z"
          />
          <path
            fill={textColor.top}
            d="M268.5,46.9c1.6-5.6,5.8-8.6,12-8.6c6.4,0,10.6,3.1,11.9,8.6H268.5z M302.3,56c0.3-1.5,0.4-2.5,0.4-4.1c0-13.4-9.4-23.2-22.3-23.2c-12.7,0-22.8,10.1-22.8,22.8c0,12.7,10.2,22.5,23.4,22.5c7.1,0,12.6-2.5,17.2-7.8c1.6-2,2.7-3.8,3.4-6h-11.3c-2.6,3.1-5.2,4.3-9.5,4.3c-6.2,0-10.7-3.3-11.9-8.5H302.3z"
          />
          <path
            fill={textColor.top}
            d="M309.5,73.1h10.4V52.7c0-5.8,0.4-8.3,1.7-10.4c1.6-2.6,4.3-4,7.6-4c2.7,0,4.8,0.9,6.2,2.7c1.4,1.9,2,5.1,2,10.9v21.2h10.4V49.9c0-7.7-0.8-11.5-3.1-14.8c-2.8-4.1-7.5-6.3-13.5-6.3c-5,0-8.3,1.4-12.2,5.1v-4.1h-9.6V73.1z"
          />

          {/*  --------------- TEXT BOTTOM ------------------ */}
          <polygon
            fill={textColor.bottom}
            points="143.6,151.2 154.3,151.2 154.3,109.2 178.4,151.2 190.3,151.2 190.3,93.5 179.6,93.5 179.6,135.5 155.8,93.5 143.6,93.5"
          />
          <path
            fill={textColor.bottom}
            d="M209.3,125c1.6-5.6,5.8-8.6,12-8.6c6.4,0,10.6,3,11.9,8.6H209.3z M243.1,134.2c0.3-1.5,0.4-2.5,0.4-4.1c0-13.4-9.4-23.2-22.3-23.2c-12.7,0-22.8,10.1-22.8,22.8c0,12.7,10.2,22.5,23.4,22.5c7.1,0,12.6-2.5,17.2-7.8c1.6-2,2.7-3.8,3.4-6h-11.3c-2.6,3.1-5.2,4.3-9.5,4.3c-6.2,0-10.7-3.3-11.9-8.5H243.1z"
          />
          <path
            fill={textColor.bottom}
            d="M272.5,115.9c7.4,0,12.8,5.6,12.8,13.4c0,8-5.2,13.4-12.6,13.4c-7.6,0-12.8-5.5-12.8-13.4C259.9,121.4,265.2,115.9,272.5,115.9z M250.2,151.2h9.5v-5.5c4.4,4.8,8.6,6.6,15,6.6c6.7,0,12-2.5,16-7.6c3.3-4.2,5.1-9.6,5.1-15.4c0-13.1-9.3-22.9-21.7-22.9c-5.7,0-9.4,1.6-13.4,5.5V93.5h-10.4V151.2z"
          />
          <path
            fill={textColor.bottom}
            d="M340.1,107.9h-10.4v20.4c0,5.7-0.4,8.5-1.6,10.4c-1.5,2.6-4.4,4-7.9,4c-2.6,0-4.7-0.9-6.1-2.7c-1.5-1.9-2.1-5-2.1-10.9v-21.2h-10.4v23.2c0,7.3,0.8,11.2,3.3,14.7c2.9,4.1,7.5,6.4,13.2,6.4c5.2,0,8.4-1.3,12.4-5.2v4.1h9.6V107.9z"
          />
          <rect x="348.4" y="93.5" fill={textColor.bottom} width="10.4" height="57.8"/>
          <path
            fill={textColor.bottom}
            d="M388.4,116.4c7.4,0,12.7,5.5,12.7,13.4c0,3.1-1.2,6.7-3.1,8.9c-2.1,2.6-5.5,3.9-9.4,3.9c-7.6,0-12.8-5.1-12.8-12.7C375.7,122.1,381,116.4,388.4,116.4z M410.9,107.9h-9.5v5.8c-3.6-4.8-7.9-6.8-14.1-6.8c-12.8,0-22,9.6-22,22.8c0,13,9.1,22.5,21.8,22.5c6.1,0,10.2-1.9,14.3-6.7v5.6h9.5V107.9z"
          />
        </g>
      )}
    </svg>
  )
})

Logo.propTypes = {
  width: oneOfType([number, string]).isRequired,
  height: oneOfType([number, string]).isRequired,
  viewBox: string,
  spinner: bool,
  withText: bool
}

Logo.defaultProps = {
  width: 360,
  height: 360,
  viewBox: '0 0 425 167',
  spinner: false,
  withText: false
}

Logo.displayName = 'LogoOne'

export default Logo
