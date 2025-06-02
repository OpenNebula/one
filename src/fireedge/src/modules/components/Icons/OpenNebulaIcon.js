/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { LogoAPI, useGeneral } from '@FeaturesModule'

const OpenNebulaLogo = memo(
  ({
    width,
    height,
    spinner,
    withText,
    viewBox = withText ? '600 400 750 300' : '600 400 250 270',
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
    ] = LogoAPI.useLazyGetEncodedLogoQuery()

    const { isBeta } = useGeneral()
    const { palette } = useTheme()

    useEffect(() => {
      fetchCustomLogo()
    }, [])

    const cloudColor = useMemo(
      () => ({
        from: palette?.logo?.color,
        to: palette?.logo?.spinnerColor,
        static: palette?.logo?.color,
      }),
      [palette]
    )

    const textColor = useMemo(
      () => ({
        top: palette?.logo?.textColor,
        bottom: palette?.logo?.textColor,
        beta: palette?.logo?.textColorBeta,
      }),
      [palette]
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
                  <linearGradient
                    key={`gradient`}
                    id={`gradient`}
                    x1="0%"
                    x2="200%"
                  >
                    <stop offset="0%" stopColor={cloudColor.from} />
                    <stop offset="200%" stopColor={cloudColor.to} />
                    <animate
                      attributeName="x2"
                      dur="2000ms"
                      repeatCount="indefinite"
                      values="10%; 100%; 200%"
                    />
                  </linearGradient>
                </defs>
              )}

              {/* Log image */}
              <g id="logo__cloud">
                <path
                  fill={spinner ? 'url(#gradient)' : cloudColor.static}
                  d="M806.78,656.65l.05,0h0Z"
                />
                <path
                  fill={spinner ? 'url(#gradient)' : cloudColor.static}
                  d="M679.93,657.38H804.87a2.93,2.93,0,0,0,2-.77h0a2.9,2.9,0,0,0,1-2.16h0V538.37A290.87,290.87,0,0,1,623.55,615.1,58.75,58.75,0,0,0,679.93,657.38Z"
                />
                <path
                  fill={spinner ? 'url(#gradient)' : cloudColor.static}
                  d="M807.8,654.45h0Z"
                />
                <path
                  fill={spinner ? 'url(#gradient)' : cloudColor.static}
                  d="M807.79,654.59a.66.66,0,0,0,0-.14h0A.66.66,0,0,1,807.79,654.59Z"
                />
                <path
                  fill={spinner ? 'url(#gradient)' : cloudColor.static}
                  d="M610.31,615.41h0Z"
                />
                <path
                  fill={spinner ? 'url(#gradient)' : cloudColor.static}
                  d="M804.86,422.52h-.22A58.74,58.74,0,0,0,750.4,470.8h0a2.94,2.94,0,0,1-2.88,2.39,3,3,0,0,1-1.47-.39h0l0,0-.16-.1a58.65,58.65,0,0,0-87,68.22h0a2.9,2.9,0,0,1,.16.94,3,3,0,0,1-1.85,2.73h0A58.67,58.67,0,0,0,623.51,615C724,608.33,804,526.57,807.78,425.3A2.92,2.92,0,0,0,804.86,422.52Z"
                />
              </g>

              {withText && (
                <g id="logo__text">
                  {/* Word "Open" */}
                  <path
                    fill={palette.logo.textColorOpen}
                    d="M899,422.62a51.18,51.18,0,0,1,51.31,51.31c0,28.1-23.07,50.77-51.31,50.77s-51.3-22.67-51.3-50.77A51.17,51.17,0,0,1,899,422.62Zm0,85.11c18.7,0,33.15-15.77,33.15-33.94,0-18.82-14.72-34.2-33.15-34.2s-33.14,15.38-33.14,34.2C865.83,492,880.28,507.73,899,507.73Z"
                  />
                  <path
                    fill={palette.logo.textColorOpen}
                    d="M957.42,449.13H973.6v8.62h.26a29,29,0,0,1,23.86-11.13c24.13,0,36.86,20.81,36.86,39,0,21.74-16,39.51-36.86,39.51-12.46,0-18-5-22.67-9.41v31.55H957.42Zm38.05,59.79c9.41,0,21.48-7.95,21.48-23.06,0-13.53-10.34-23.07-21.21-23.07S974,471.67,974,485.86C974,502.16,987.12,508.92,995.47,508.92Z"
                  />
                  <path
                    fill={palette.logo.textColorOpen}
                    d="M1059.81,493.81c.79,4.78,7.69,15.11,20.28,15.11,7.82,0,13.66-3.31,17-9.41h18.56c-4.24,13.26-18.3,25.59-35.53,25.59a38.67,38.67,0,0,1-38.84-39c0-20.81,16-39.9,38.71-39.9,23.33,0,38,20.15,38,38.71a40.66,40.66,0,0,1-1.06,8.88ZM1100,479.63c-2-11.8-11.14-17.24-19.89-17.24-6.5,0-17.5,3.58-20.81,17.24Z"
                  />
                  <path
                    fill={palette.logo.textColorOpen}
                    d="M1124.7,449.13H1141v6.37c2.92-2.78,9-8.88,20.16-8.88,6.36,0,16,2.78,22.13,10.2,6.76,8.09,6.76,20.42,6.76,26.12v39.77h-17.63V486.39c0-6.1,0-23.6-14.84-23.6a15.08,15.08,0,0,0-12.07,6.5c-3.18,4.5-3.18,12.19-3.18,18.42v35H1124.7Z"
                  />

                  {/* Word "Nebula" */}
                  <path
                    fill={palette.logo.textColorNebula}
                    d="M859.13,557h20.68l40.57,71.33h.26V557h18.17v98.1H918.52l-41-71.32h-.27v71.32H859.13Z"
                  />
                  <path
                    fill={palette.logo.textColorNebula}
                    d="M968.44,626.19c.79,4.78,7.69,15.12,20.28,15.12,7.82,0,13.66-3.32,17-9.42h18.56c-4.24,13.26-18.29,25.59-35.53,25.59a38.67,38.67,0,0,1-38.84-39c0-20.82,16-39.91,38.71-39.91,23.33,0,38.05,20.15,38.05,38.71a40.66,40.66,0,0,1-1.06,8.88ZM1008.61,612c-2-11.8-11.14-17.23-19.89-17.23-6.49,0-17.5,3.57-20.81,17.23Z"
                  />
                  <path
                    fill={palette.logo.textColorNebula}
                    d="M1036.86,557h17.63v31.16a32.7,32.7,0,0,1,22.93-9.15c22.41,0,37,19.48,37,39,0,14.71-9.68,39.5-36.59,39.5-14.18,0-20.41-6.36-24.79-11.27v8.88h-16.17Zm38.71,84.32c11.53,0,21.21-8.89,21.21-23.2s-10.34-22.94-21.48-22.94c-13.52,0-21.87,11.4-21.87,22.14C1053.43,633.62,1065.23,641.31,1075.57,641.31Z"
                  />
                  <path
                    fill={palette.logo.textColorNebula}
                    d="M1190.12,581.52v73.57H1174v-7.42h-.27c-2.91,4-7.69,9.81-19,9.81-13.39,0-20.94-6.63-24.65-11.67-5.44-7.82-5.44-19.75-5.44-25.85V581.52h17.63V619c0,6,0,22.27,15.38,22.27,11.14,0,14.85-10.48,14.85-22.14V581.52Z"
                  />
                  <path
                    fill={palette.logo.textColorNebula}
                    d="M1204.21,557h17.63v98.1h-17.63Z"
                  />
                  <path
                    fill={palette.logo.textColorNebula}
                    d="M1309.73,655.09h-16.17V646c-5.57,6.62-16.44,11.53-25.72,11.53-18.95,0-35.79-15.11-35.79-39.64,0-22.53,16.44-38.84,36.85-38.84,15,0,23.87,10.74,24.4,11.8h.26v-9.28h16.17Zm-38.18-59.92c-14.44,0-21.87,12.46-21.87,23.47,0,12.46,9.28,22.67,21.87,22.67,12.2,0,21.48-9.55,21.48-23.2C1293,602.86,1282,595.17,1271.55,595.17Z"
                  />
                  <polygon
                    fill={palette.logo.textColorNebula}
                    points="806.83 656.61 806.83 656.61 806.83 656.61 806.83 656.61 806.83 656.61"
                  />
                </g>
              )}
              {!disabledBetaText && isBeta && (
                <g id="beta">
                  <path
                    fill={textColor.beta}
                    d="m 749.69703,648.81446 q -1.52,0 -3.04,-0.10666 -1.49334,-0.08 -3.12001,-0.42667 v -17.92002 q 1.28,-0.24 2.80001,-0.34667 1.52,-0.13333 2.82667,-0.13333 1.76,0 3.22667,0.26666 1.49333,0.24 2.56,0.85334 1.06667,0.61333 1.65334,1.62667 0.61333,0.98666 0.61333,2.45333 0,2.21334 -2.13334,3.49334 1.76001,0.66667 2.40001,1.81334 0.64,1.14666 0.64,2.58667 0,2.90667 -2.13334,4.37333 -2.10667,1.46667 -6.29334,1.46667 z m -2.10667,-8.29334 v 4.77334 q 0.45333,0.0533 0.98667,0.08 0.53333,0.0267 1.17333,0.0267 1.86667,0 3.01334,-0.53334 1.14667,-0.53333 1.14667,-1.97333 0,-1.28001 -0.96,-1.81334 -0.96,-0.56 -2.74667,-0.56 z m 0,-3.17334 h 2.02667 q 1.92,0 2.74667,-0.48 0.82667,-0.50667 0.82667,-1.6 0,-1.12 -0.85334,-1.57334 -0.85333,-0.45333 -2.50667,-0.45333 -0.53333,0 -1.14666,0.0267 -0.61334,0 -1.09334,0.0533 z"
                  />
                  <path
                    fill={textColor.beta}
                    d="m 760.52368,641.66779 q 0,-1.86667 0.56001,-3.25334 0.58666,-1.41334 1.52,-2.34667 0.93333,-0.93333 2.13333,-1.41333 1.22667,-0.48001 2.50667,-0.48001 2.98667,0 4.72001,1.84001 1.73333,1.81333 1.73333,5.36 0,0.34667 -0.0267,0.77334 -0.0267,0.4 -0.0533,0.72 h -9.01334 q 0.13333,1.22667 1.14667,1.94667 1.01333,0.72 2.72,0.72 1.09334,0 2.13334,-0.18667 1.06667,-0.21333 1.73333,-0.50667 l 0.53334,3.22668 q -0.32,0.16 -0.85334,0.32 -0.53333,0.16 -1.2,0.26666 -0.64,0.13334 -1.38667,0.21334 -0.74667,0.08 -1.49333,0.08 -1.89334,0 -3.30667,-0.56 -1.38667,-0.56 -2.32001,-1.52001 -0.90666,-0.98666 -1.36,-2.32 -0.42667,-1.33333 -0.42667,-2.88 z m 9.33335,-1.52 q -0.0267,-0.50667 -0.18667,-0.98667 -0.13333,-0.48 -0.45333,-0.85334 -0.29334,-0.37333 -0.77334,-0.61333 -0.45333,-0.24 -1.14666,-0.24 -0.66667,0 -1.14667,0.24 -0.48,0.21333 -0.8,0.58667 -0.32,0.37333 -0.50667,0.88 -0.16,0.48 -0.24,0.98667 z"
                  />
                  <path
                    fill={textColor.beta}
                    d="m 776.63036,631.05444 3.97334,-0.64 v 4.13334 h 4.77334 v 3.30667 h -4.77334 v 4.93334 q 0,1.25333 0.42667,2 0.45333,0.74667 1.78667,0.74667 0.64,0 1.30666,-0.10667 0.69334,-0.13333 1.25334,-0.34666 l 0.56,3.09333 q -0.72,0.29334 -1.6,0.50667 -0.88,0.21333 -2.16,0.21333 -1.62667,0 -2.69334,-0.42666 -1.06667,-0.45334 -1.70667,-1.22667 -0.64,-0.8 -0.90667,-1.92 -0.24,-1.12001 -0.24,-2.48001 z"
                  />
                  <path
                    fill={textColor.beta}
                    d="m 793.43033,645.80113 q 0.58666,0 1.12,-0.0267 0.53333,-0.0267 0.85333,-0.08 v -3.01334 q -0.24,-0.0533 -0.72,-0.10666 -0.48,-0.0533 -0.88,-0.0533 -0.56,0 -1.06667,0.08 -0.48,0.0533 -0.85333,0.24 -0.37334,0.18667 -0.58667,0.50667 -0.21333,0.32 -0.21333,0.8 0,0.93334 0.61333,1.30667 0.64,0.34667 1.73334,0.34667 z m -0.32,-11.62669 q 1.76,0 2.93333,0.40001 1.17334,0.4 1.86667,1.14666 0.72,0.74667 1.01334,1.81334 0.29333,1.06667 0.29333,2.37334 v 8.26667 q -0.85333,0.18667 -2.37334,0.42667 -1.52,0.26667 -3.68,0.26667 -1.36,0 -2.48,-0.24 -1.09334,-0.24 -1.89334,-0.77334 -0.8,-0.56 -1.22667,-1.44 -0.42666,-0.88 -0.42666,-2.16 0,-1.22667 0.48,-2.08001 0.50666,-0.85333 1.33333,-1.36 0.82667,-0.50666 1.89334,-0.72 1.06667,-0.24 2.21333,-0.24 0.77334,0 1.36001,0.08 0.61333,0.0533 0.98666,0.16 v -0.37333 q 0,-1.01334 -0.61333,-1.62667 -0.61334,-0.61333 -2.13334,-0.61333 -1.01333,0 -2,0.16 -0.98667,0.13333 -1.70667,0.4 l -0.50667,-3.20001 q 0.34667,-0.10666 0.85334,-0.21333 0.53333,-0.13333 1.14667,-0.21334 0.61333,-0.10666 1.28,-0.16 0.69333,-0.08 1.38667,-0.08 z"
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
