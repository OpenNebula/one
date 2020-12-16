import React, { memo } from 'react'
import { number, string, bool, oneOfType } from 'prop-types'
import { useTheme } from '@material-ui/core'

const Logo = memo(({ width, height, spinner, withText, viewBox, ...props }) => {
  const theme = useTheme()
  const cloudColor = {
    child1: { from: '#0098c3', to: '#ffffff' },
    child2: { from: '#0098c3', to: '#ffffff' },
    child3: { from: '#40b3d9', to: '#ffffff' },
    child4: { from: '#80cde6', to: '#ffffff' },
    child5: { from: '#bfe6f2', to: '#ffffff' }
  }
  const textColor = {
    top: theme.palette.primary.contrastText,
    bottom: '#0098c3'
  }
  return (
    <svg viewBox={viewBox} width={width} height={height} {...props}>
      <defs>
        {spinner &&
          Object.entries(cloudColor)?.map(([key, color]) => (
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
      <path
        fill={spinner ? 'url(#gradient__child1)' : cloudColor.child1.from}
        d="M207.7 233.57L196.2 245.35L184.29 256.66L171.97 267.48L159.27 277.8L146.19 287.6L132.74 296.88L118.94 305.62L104.81 313.79L90.36 321.4L75.59 328.41L60.54 334.83L45.19 340.63L29.58 345.81L13.72 350.34L12.05 350.74L12.23 350.33L13.27 348.21L14.39 346.15L15.58 344.13L16.85 342.16L18.19 340.25L19.61 338.39L21.09 336.58L22.63 334.84L24.24 333.16L25.92 331.54L27.65 329.99L29.44 328.5L31.29 327.08L33.2 325.73L35.16 324.46L37.16 323.26L39.22 322.13L41.33 321.09L42.05 320.76L41.6 319.67L40.7 317.18L39.89 314.65L39.18 312.08L38.58 309.47L38.08 306.82L37.69 304.14L37.41 301.42L37.23 298.68L37.18 295.9L37.23 293.13L37.41 290.38L37.69 287.67L38.08 284.99L38.58 282.34L39.18 279.73L39.89 277.16L40.7 274.63L41.6 272.14L42.6 269.7L43.7 267.31L44.88 264.96L46.16 262.67L47.52 260.44L48.97 258.26L50.5 256.14L52.11 254.08L53.8 252.08L55.56 250.15L57.4 248.29L59.31 246.5L61.29 244.77L63.33 243.13L65.44 241.55L67.62 240.06L69.85 238.65L72.14 237.32L74.49 236.08L76.89 234.92L79.34 233.85L81.84 232.87L84.39 231.99L86.98 231.2L89.62 230.51L92.29 229.92L95.01 229.44L97.75 229.05L100.54 228.78L103.35 228.61L106.19 228.55L109.04 228.61L111.85 228.78L114.63 229.05L117.38 229.44L120.1 229.92L122.77 230.51L125.41 231.2L128 231.99L130.55 232.87L133.05 233.85L135.5 234.92L137.9 236.08L140.25 237.32L141.66 238.14L143.92 234L146.4 229.83L149.04 225.77L151.84 221.82L154.78 217.99L157.86 214.27L161.08 210.67L164.43 207.2L167.92 203.86L171.53 200.65L175.26 197.58L179.11 194.66L183.08 191.88L187.15 189.24L191.33 186.77L195.62 184.45L200 182.29L204.47 180.3L208.36 178.75L208.36 232.84L207.7 233.57Z"
      />
      <path
        fill={spinner ? 'url(#gradient__child2)' : cloudColor.child2.from}
        d="M198.85 304.87L182.93 314.47L166.61 323.51L149.89 331.98L132.78 339.85L115.31 347.11L97.49 353.75L79.33 359.76L60.86 365.12L42.08 369.8L23.02 373.81L4.8 376.94L4.78 376.15L4.83 373.65L4.98 371.17L5.23 368.71L5.57 366.29L6.01 363.9L6.16 363.22L20.47 359.78L36.34 355.25L51.95 350.08L67.29 344.28L82.35 337.86L97.12 330.84L111.57 323.24L125.7 315.06L139.5 306.33L152.94 297.05L166.03 287.25L178.73 276.92L191.05 266.1L202.96 254.79L206.62 251.05L206.62 299.77L198.85 304.87Z"
      />
      <path
        fill={spinner ? 'url(#gradient__child3)' : cloudColor.child3.from}
        d="M184.12 353.2L156.39 362.67L128.1 371.33L99.29 379.16L69.96 386.13L40.16 392.25L9.9 397.47L8.67 397.64L8.66 397.61L7.87 395.36L7.16 393.08L6.54 390.76L6.01 388.4L5.57 386.01L5.49 385.45L10.39 384.67L30.75 380.67L50.81 376L70.54 370.66L89.94 364.68L108.98 358.05L127.64 350.81L145.91 342.97L163.78 334.53L181.22 325.52L198.22 315.95L206.62 310.81L206.62 344.7L184.12 353.2Z"
      />
      <path
        fill={spinner ? 'url(#gradient__child4)' : cloudColor.child4.from}
        d="M187.35 393.66L157.55 399.77L127.29 405L96.6 409.32L65.51 412.71L34.04 415.15L19.8 415.82L19.71 415.72L18.23 413.91L16.82 412.05L15.47 410.14L14.21 408.17L13.01 406.15L12.48 405.17L22.87 404.25L43.8 401.66L64.45 398.36L84.82 394.36L104.87 389.69L124.61 384.35L144.01 378.36L163.04 371.74L181.71 364.5L199.98 356.66L206.98 353.35L206.98 388.99L187.35 393.66Z"
      />
      <path
        fill={spinner ? 'url(#gradient__child5)' : cloudColor.child5.from}
        d="M65.28 436.96L65.28 436.96L62.79 436.91L60.32 436.76L57.88 436.51L55.47 436.16L53.09 435.72L50.75 435.19L48.44 434.57L46.17 433.86L43.93 433.06L41.74 432.18L39.59 431.21L37.49 430.17L35.43 429.04L33.42 427.84L31.46 426.57L29.56 425.22L27.71 423.8L25.92 422.31L25.7 422.12L43.1 421.31L74.57 418.87L105.66 415.48L136.35 411.16L166.61 405.93L196.41 399.82L206.62 397.39L206.62 436.96L65.28 436.96Z"
      />
      {withText && (
        <>
          <text
            id="logo__text__top"
            x={230}
            y={280}
            fill={textColor.top}
            fontSize={125}
            fontFamily="Ubuntu"
            fontWeight={800}
          >
            {'Open'}
          </text>
          <text
            id="logo__text__bottom"
            x={230}
            y={430}
            fill={textColor.bottom}
            fontSize={125}
            fontFamily="Ubuntu"
            fontWeight={800}
          >
            {'Nebula'}
          </text>
        </>
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
  viewBox: '0 0 640 640',
  spinner: false,
  withText: false
}

Logo.displayName = 'LogoOne'

export default Logo
