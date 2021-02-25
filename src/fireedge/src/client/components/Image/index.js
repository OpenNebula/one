import React, { useState, memo } from 'react'
import PropTypes from 'prop-types'

import { DEFAULT_IMAGE, IMAGE_FORMATS } from 'client/constants'

const MAX_RETRIES = 2
const INITIAL_STATE = { fail: false, retries: 0 }

const Image = memo(({ src = DEFAULT_IMAGE, withSources, imgProps }) => {
  const [error, setError] = useState(INITIAL_STATE)

  const addRetry = () => {
    setError(prev => ({ ...prev, retries: prev.retries + 1 }))
  }

  const onImageFail = () => {
    setError(prev => ({ fail: true, retries: prev.retries + 1 }))
  }

  if (error.retries >= MAX_RETRIES) {
    return null
  }

  if (error.fail) {
    return <img src={DEFAULT_IMAGE} draggable={false} onError={addRetry} />
  }

  return (
    <picture>
      {withSources && IMAGE_FORMATS.map(format => (
        <source key={format}
          srcSet={`${src}.${format}`}
          type={`image/${format}`}
        />
      ))}
      <img {...imgProps} src={src} onError={onImageFail} />
    </picture>
  )
}, (prev, next) => prev.src === next.src)

Image.propTypes = {
  src: PropTypes.string,
  withSources: PropTypes.bool,
  imgProps: PropTypes.shape({
    decoding: PropTypes.oneOf(['sync', 'async', 'auto']),
    draggable: PropTypes.bool,
    loading: PropTypes.oneOf(['eager', 'lazy'])
  })
}

Image.defaultProps = {
  src: undefined,
  withSources: false,
  imgProps: {
    decoding: 'async',
    draggable: false,
    loading: 'lazy'
  }
}

Image.displayName = 'Image'

export default Image
