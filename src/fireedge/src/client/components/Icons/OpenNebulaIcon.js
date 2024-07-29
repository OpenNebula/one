/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { memo, useMemo, useEffect, useState } from 'react'
import { number, string, bool, oneOfType } from 'prop-types'
import { useTheme } from '@mui/material'
import { useLazyGetEncodedLogoQuery } from 'client/features/OneApi/logo'

import { useGeneral } from 'client/features/General'
import { SCHEMES } from 'client/constants'

const OpenNebulaLogo = memo(
  ({
    width,
    height,
    spinner,
    withText,
    viewBox = withText ? '0 0 120 45' : '0 0 35 45',
    disabledBetaText,
    ...props
  }) => {
    const [displaySkeleton, setDisplaySkeleton] = useState(true)

    const [
      fetchCustomLogo,
      {
        data: encodedLogoData = {},
        isSuccess,
        isError,
        isUninitialized,
        isFetching,
      },
    ] = useLazyGetEncodedLogoQuery()

    const { isBeta } = useGeneral()
    const { palette } = useTheme()
    const isDarkMode = palette.mode === SCHEMES.DARK

    useEffect(() => {
      fetchCustomLogo()
    }, [])

    const cloudColor = useMemo(
      () => ({
        child1: {
          from: '#bfe6f2',
          to: '#ffffff',
          static: isDarkMode ? '#ffffff' : '#bfe6f2',
        },
        child2: {
          from: '#80cde6',
          to: '#ffffff',
          static: isDarkMode ? '#ffffff' : '#80cde6',
        },
        child3: {
          from: '#40b3d9',
          to: '#ffffff',
          static: isDarkMode ? '#ffffff' : '#40b3d9',
        },
        child4: {
          from: '#0098c3',
          to: '#ffffff',
          static: isDarkMode ? '#ffffff' : '#0098c3',
        },
        child5: {
          from: '#0098c3',
          to: '#ffffff',
          static: isDarkMode ? '#ffffff' : '#0098c3',
        },
      }),
      [isDarkMode]
    )

    const textColor = useMemo(
      () => ({
        top: 'currentColor',
        bottom: isDarkMode ? 'currentColor' : '#0098c3',
        beta: '#ffffff',
      }),
      [isDarkMode]
    )

    useEffect(() => {
      if (!isUninitialized && isFetching) {
        setDisplaySkeleton(true)
      }
      if (!isUninitialized && isSuccess) {
        setDisplaySkeleton(false)
      }
      if (!isUninitialized && isError) {
        setDisplaySkeleton(false)
      }
      if (isUninitialized) {
        setDisplaySkeleton(true)
      }
    }, [isUninitialized, isFetching, isSuccess])

    const renderLogo = (displayLoader) => {
      if (displayLoader) {
        return null
      } else {
        if (encodedLogoData?.b64) {
          return (
            <img
              src={encodedLogoData.b64}
              alt="Custom Logo"
              style={{
                width,
                height,
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto 0.5px',
                backgroundColor: 'transparent',
              }}
              {...props}
            />
          )
        } else {
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
              <g id="logo__cloud">
                <path
                  fill={
                    spinner
                      ? 'url(#gradient__child1)'
                      : cloudColor.child1.static
                  }
                  d="M38.48,39.19c-1.38.33-2.72.66-4.1,1A162,162,0,0,1,8.9,43.53c-.54-.06.21.33.33.45,2.28,1.65,5.24,2,8.05,2H37.82a.58.58,0,0,0,.51-.21.89.89,0,0,0,.15-.51Z"
                  transform="translate(-4.95 -3.72)"
                />
                <path
                  fill={
                    spinner
                      ? 'url(#gradient__child2)'
                      : cloudColor.child2.static
                  }
                  d="M38.48,31.77a97.47,97.47,0,0,1-13.41,5.06,116.7,116.7,0,0,1-18.86,3.8c.36.54.62,1.35,1.25,1.59a159.5,159.5,0,0,0,31-4.47Z"
                  transform="translate(-4.95 -3.72)"
                />
                <path
                  fill={
                    spinner
                      ? 'url(#gradient__child3)'
                      : cloudColor.child3.static
                  }
                  d="M38.48,24.43A83.41,83.41,0,0,1,12.76,35.57c-2.54.63-5.12,1.32-7.69,1.74a9.3,9.3,0,0,0,.54,2A105.68,105.68,0,0,0,37.4,30.72l1.11-.54V24.43Z"
                  transform="translate(-4.95 -3.72)"
                />
                <path
                  fill={
                    spinner
                      ? 'url(#gradient__child4)'
                      : cloudColor.child4.static
                  }
                  d="M38.48,14.1A52.08,52.08,0,0,1,24.29,25.54,86.2,86.2,0,0,1,6.45,33c-.45.24-1.32.15-1.29.84A9.7,9.7,0,0,0,5,35.9,92.77,92.77,0,0,0,33.84,25.69c1.59-.93,3.14-1.92,4.67-3V14.1Z"
                  transform="translate(-4.95 -3.72)"
                />
                <path
                  fill={
                    spinner
                      ? 'url(#gradient__child5)'
                      : cloudColor.child5.static
                  }
                  d="M38.48,3.86c-.12-.27-.54-.12-1,.09-1.7.72-8.62,4.1-9.67,8.59-.42.57-1-.14-1.52-.29a11.55,11.55,0,0,0-12.25,1.52c-3.35,2.7-5.18,7.52-3.65,11.68.24.48.48,1.14,0,1.56a11.37,11.37,0,0,0-1.86,1.28,10.34,10.34,0,0,0-2.66,3.39c9.19-2.79,18.2-6.74,25.72-12.82a43.19,43.19,0,0,0,6.85-7v-8Z"
                  transform="translate(-4.95 -3.72)"
                />
              </g>

              {withText && (
                <g id="logo__text">
                  {/*  --------------- TEXT TOP ------------------ */}
                  <path
                    fill={textColor.top}
                    d="M52.25,7.37a5.71,5.71,0,0,1,5.69,5.89,5.61,5.61,0,0,1-5.69,5.84,5.78,5.78,0,0,1-5.83-5.84A5.74,5.74,0,0,1,52.25,7.37Zm.06-3.09a9,9,0,1,0,0,17.91,8.81,8.81,0,0,0,8.9-9A8.89,8.89,0,0,0,52.31,4.28Z"
                    transform="translate(-4.95 -3.72)"
                  />
                  <path
                    fill={textColor.top}
                    d="M70.07,11.47a3.77,3.77,0,0,1,3.71,3.95,3.75,3.75,0,0,1-3.65,3.89,3.79,3.79,0,0,1-3.83-3.95A3.74,3.74,0,0,1,70.07,11.47ZM63.36,26.2h3.12V20.66a5.6,5.6,0,0,0,4,1.53c3.74,0,6.46-2.91,6.46-6.83a6.37,6.37,0,0,0-6.43-6.74,5.35,5.35,0,0,0-4.25,1.83V8.92H63.36Z"
                    transform="translate(-4.95 -3.72)"
                  />
                  <path
                    fill={textColor.top}
                    d="M81.48,14a3.4,3.4,0,0,1,3.59-2.57A3.31,3.31,0,0,1,88.63,14ZM91.6,16.77a5.52,5.52,0,0,0,.12-1.23A6.61,6.61,0,0,0,85,8.59a6.79,6.79,0,1,0,.18,13.57,6.41,6.41,0,0,0,5.15-2.34,5.44,5.44,0,0,0,1-1.8H88a3.26,3.26,0,0,1-2.84,1.29,3.37,3.37,0,0,1-3.56-2.54Z"
                    transform="translate(-4.95 -3.72)"
                  />
                  <path
                    fill={textColor.top}
                    d="M93.75,21.89h3.11V15.78c0-1.74.12-2.49.51-3.12a2.57,2.57,0,0,1,2.28-1.19,2.22,2.22,0,0,1,1.86.81c.41.56.59,1.52.59,3.26v6.35h3.12v-7c0-2.31-.24-3.44-.93-4.43a4.64,4.64,0,0,0-4-1.89,4.73,4.73,0,0,0-3.65,1.53V8.92H93.72v13Z"
                    transform="translate(-4.95 -3.72)"
                  />

                  {/*  --------------- TEXT BOTTOM ------------------ */}
                  <polygon
                    fill={textColor.bottom}
                    points="39.13 41.55 42.34 41.55 42.34 28.98 49.55 41.55 53.11 41.55 53.11 24.28 49.91 24.28 49.91 36.85 42.78 24.28 39.13 24.28 39.13 41.55"
                  />
                  <path
                    fill={textColor.bottom}
                    d="M63.75,37.43a3.42,3.42,0,0,1,3.59-2.58,3.28,3.28,0,0,1,3.57,2.58Zm10.12,2.75A5.52,5.52,0,0,0,74,39,6.6,6.6,0,0,0,67.31,32a6.78,6.78,0,1,0,.18,13.56,6.38,6.38,0,0,0,5.15-2.34,5.4,5.4,0,0,0,1-1.79H70.28a3.27,3.27,0,0,1-2.85,1.28,3.38,3.38,0,0,1-3.56-2.54Z"
                    transform="translate(-4.95 -3.72)"
                  />
                  <path
                    fill={textColor.bottom}
                    d="M82.67,34.7a3.8,3.8,0,0,1,3.84,4,3.81,3.81,0,1,1-7.61,0A3.75,3.75,0,0,1,82.67,34.7ZM76,45.27h2.84V43.62a5.45,5.45,0,0,0,4.49,2,5.75,5.75,0,0,0,4.79-2.28,7.39,7.39,0,0,0,1.53-4.61,6.52,6.52,0,0,0-6.5-6.85,5.19,5.19,0,0,0-4,1.64V28H76V45.27Z"
                    transform="translate(-4.95 -3.72)"
                  />
                  <path
                    fill={textColor.bottom}
                    d="M102.91,32.31H99.8v6.1a6,6,0,0,1-.48,3.12A2.6,2.6,0,0,1,97,42.72a2.19,2.19,0,0,1-1.82-.8c-.45-.57-.63-1.5-.63-3.27V32.31H91.39v6.94c0,2.19.24,3.35,1,4.4A5.11,5.11,0,0,0,100,44v1.23h2.87Z"
                    transform="translate(-4.95 -3.72)"
                  />
                  <rect
                    fill={textColor.bottom}
                    x="100.45"
                    y="24.28"
                    width="3.11"
                    height="17.31"
                  />
                  <path
                    fill={textColor.bottom}
                    d="M117.37,34.85a3.76,3.76,0,0,1,3.81,4,4.37,4.37,0,0,1-.93,2.67,3.51,3.51,0,0,1-2.82,1.16,3.62,3.62,0,0,1-3.83-3.8A3.76,3.76,0,0,1,117.37,34.85Zm6.74-2.54h-2.84V34A4.79,4.79,0,0,0,117,32a6.47,6.47,0,0,0-6.58,6.82A6.41,6.41,0,0,0,117,45.57a5.09,5.09,0,0,0,4.29-2v1.68h2.84Z"
                    transform="translate(-4.95 -3.72)"
                  />
                </g>
              )}
              {!disabledBetaText && isBeta && (
                <g id="beta">
                  <path
                    fill={textColor.beta}
                    d="M32.72,41.7v.67a1,1,0,0,0-.39-.51,1.06,1.06,0,0,0-.67-.2,1.22,1.22,0,0,0-1.13.69,1.89,1.89,0,0,0-.17.78,2,2,0,0,0,.17.79,1.25,1.25,0,0,0,.46.51,1.45,1.45,0,0,0,.67.17,1.21,1.21,0,0,0,.67-.19,1.08,1.08,0,0,0,.39-.51v.67h.59V41.7Zm-.09,1.88a.89.89,0,0,1-.31.33.87.87,0,0,1-.45.12.93.93,0,0,1-.63-.25,1.06,1.06,0,0,1-.24-.7,1,1,0,0,1,.24-.69.8.8,0,0,1,.63-.26.71.71,0,0,1,.45.12.76.76,0,0,1,.31.33.86.86,0,0,1,.12.5A.9.9,0,0,1,32.63,43.58Z"
                    transform="translate(-4.95 -3.72)"
                  />
                  <path
                    fill={textColor.beta}
                    d="M29.28,42.2v1.42a.47.47,0,0,0,.1.34.55.55,0,0,0,.31,0H30l0,.58h-.36a1.1,1.1,0,0,1-.7-.22,1.06,1.06,0,0,1-.23-.74V42.15h-.42v-.5h.45V41h.59v.71H30v.5Z"
                    transform="translate(-4.95 -3.72)"
                  />
                  <path
                    fill={textColor.beta}
                    d="M27.8,42.32a1.08,1.08,0,0,0-.49-.48,1.32,1.32,0,0,0-.73-.18,1.38,1.38,0,0,0-.74.18,1.29,1.29,0,0,0-.5.51,1.72,1.72,0,0,0-.18.78,1.82,1.82,0,0,0,.18.79,1.36,1.36,0,0,0,.5.51,1.61,1.61,0,0,0,.74.17,1.57,1.57,0,0,0,.65-.13,1.25,1.25,0,0,0,.71-.9h-.63a.63.63,0,0,1-.26.4.87.87,0,0,1-.5.15.91.91,0,0,1-.57-.21,1,1,0,0,1-.24-.66H28v0a1.5,1.5,0,0,0,0-.2A1.32,1.32,0,0,0,27.8,42.32Zm-2.06.61A.89.89,0,0,1,26,42.3a.83.83,0,0,1,.59-.21.78.78,0,0,1,.4.09.57.57,0,0,1,.29.28.83.83,0,0,1,.1.47Z"
                    transform="translate(-4.95 -3.72)"
                  />
                  <path
                    fill={textColor.beta}
                    d="M24.54,42.94a.92.92,0,0,0-.54-.32.88.88,0,0,0,.48-.29.82.82,0,0,0,.18-.56.84.84,0,0,0-.29-.68,1.28,1.28,0,0,0-.85-.25H22.08v3.68h1.47a1.34,1.34,0,0,0,.89-.27.9.9,0,0,0,.3-.73A.81.81,0,0,0,24.54,42.94Zm-1.85-1.61h.7a.69.69,0,0,1,.5.14.59.59,0,0,1,0,.81.72.72,0,0,1-.47.15h-.73ZM24,43.83a.79.79,0,0,1-.52.16h-.75V42.86h.73A.78.78,0,0,1,24,43a.53.53,0,0,1,.19.44A.51.51,0,0,1,24,43.83Z"
                    transform="translate(-4.95 -3.72)"
                  />
                  <path
                    d="M24.15,43.41a.51.51,0,0,1-.19.42.79.79,0,0,1-.52.16h-.75V42.86h.73A.78.78,0,0,1,24,43,.53.53,0,0,1,24.15,43.41Z"
                    transform="translate(-4.95 -3.72)"
                  />
                  <path
                    d="M24.05,41.87a.5.5,0,0,1-.16.41.72.72,0,0,1-.47.15h-.73v-1.1h.7a.69.69,0,0,1,.5.14A.5.5,0,0,1,24.05,41.87Z"
                    transform="translate(-4.95 -3.72)"
                  />
                  <path
                    d="M27.37,42.93H25.74A.89.89,0,0,1,26,42.3a.83.83,0,0,1,.59-.21.78.78,0,0,1,.4.09.57.57,0,0,1,.29.28A.83.83,0,0,1,27.37,42.93Z"
                    transform="translate(-4.95 -3.72)"
                  />
                  <path
                    d="M32.75,43.08a.9.9,0,0,1-.12.5.89.89,0,0,1-.31.33.87.87,0,0,1-.45.12.93.93,0,0,1-.63-.25,1.06,1.06,0,0,1-.24-.7,1,1,0,0,1,.24-.69.8.8,0,0,1,.63-.26.71.71,0,0,1,.45.12.76.76,0,0,1,.31.33A.86.86,0,0,1,32.75,43.08Z"
                    transform="translate(-4.95 -3.72)"
                  />
                  <path
                    d="M35.19,39.35h-15a3.3,3.3,0,1,0,0,6.6H38a.5.5,0,0,0,.5-.5v-2.8A3.29,3.29,0,0,0,35.19,39.35Zm-10.75,4.9a1.34,1.34,0,0,1-.89.27H22.08V40.84h1.44a1.28,1.28,0,0,1,.85.25.84.84,0,0,1,.29.68.82.82,0,0,1-.18.56.88.88,0,0,1-.48.29.92.92,0,0,1,.54.32.81.81,0,0,1,.2.58A.9.9,0,0,1,24.44,44.25Zm3.51-1v0H25.74a1,1,0,0,0,.24.66.91.91,0,0,0,.57.21.87.87,0,0,0,.5-.15.63.63,0,0,0,.26-.4h.63a1.25,1.25,0,0,1-.71.9,1.57,1.57,0,0,1-.65.13,1.61,1.61,0,0,1-.74-.17,1.36,1.36,0,0,1-.5-.51,1.82,1.82,0,0,1-.18-.79,1.72,1.72,0,0,1,.18-.78,1.29,1.29,0,0,1,.5-.51,1.38,1.38,0,0,1,.74-.18,1.32,1.32,0,0,1,.73.18,1.08,1.08,0,0,1,.49.48A1.32,1.32,0,0,1,28,43,1.5,1.5,0,0,1,28,43.2Zm2-1h-.7v1.42a.47.47,0,0,0,.1.34.55.55,0,0,0,.31,0H30l0,.58h-.36a1.1,1.1,0,0,1-.7-.22,1.06,1.06,0,0,1-.23-.74V42.15h-.42v-.5h.45V41h.59v.71H30Zm3.33,2.37h-.59V43.9a1.08,1.08,0,0,1-.39.51,1.21,1.21,0,0,1-.67.19,1.45,1.45,0,0,1-.67-.17,1.25,1.25,0,0,1-.46-.51,2,2,0,0,1-.17-.79,1.89,1.89,0,0,1,.17-.78,1.22,1.22,0,0,1,1.13-.69,1.06,1.06,0,0,1,.67.2,1,1,0,0,1,.39.51V41.7h.59Z"
                    transform="translate(-4.95 -3.72)"
                  />
                </g>
              )}
            </svg>
          )
        }
      }
    }

    return renderLogo(displaySkeleton)
  }
)

OpenNebulaLogo.propTypes = {
  width: oneOfType([number, string]).isRequired,
  height: oneOfType([number, string]).isRequired,
  viewBox: string,
  spinner: bool,
  withText: bool,
  disabledBetaText: bool,
}

OpenNebulaLogo.defaultProps = {
  width: 360,
  height: 360,
  spinner: false,
  withText: false,
  disabledBetaText: false,
}

OpenNebulaLogo.displayName = 'OpenNebulaLogo'

export default OpenNebulaLogo
