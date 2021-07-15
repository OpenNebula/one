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
import React, { useState, memo } from 'react'
import PropTypes from 'prop-types'

import { DEFAULT_IMAGE, IMAGE_FORMATS } from 'client/constants'

const MAX_RETRIES = 2
const INITIAL_STATE = { fail: false, retries: 0 }

/**
 * Returns an element HTML: <picture>.
 *
 * @param {string} props.src - Image source
 * @param {boolean} props.withSources - Add image formats to picture: webp, png and jpg
 * @param {string} props.imgProps - Properties to image element
 * @returns {React.JSXElementConstructor} Picture with all images format
 */
const Image = memo(({ src, imageInError, withSources, imgProps }) => {
  const [error, setError] = useState(INITIAL_STATE)

  /** Increment retries by one in error state. */
  const addRetry = () => {
    setError(prev => ({ ...prev, retries: prev.retries + 1 }))
  }

  /** Set failed state. */
  const onImageFail = () => {
    setError(prev => ({ fail: true, retries: prev.retries + 1 }))
  }

  if (error.retries >= MAX_RETRIES) {
    return null
  }

  if (error.fail) {
    return <img src={imageInError} draggable={false} onError={addRetry} />
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
  imageInError: PropTypes.string,
  withSources: PropTypes.bool,
  imgProps: PropTypes.shape({
    decoding: PropTypes.oneOf(['sync', 'async', 'auto']),
    draggable: PropTypes.bool,
    loading: PropTypes.oneOf(['eager', 'lazy'])
  })
}

Image.defaultProps = {
  src: undefined,
  imageInError: DEFAULT_IMAGE,
  withSources: false,
  imgProps: {
    decoding: 'async',
    draggable: false,
    loading: 'lazy'
  }
}

Image.displayName = 'Image'

export default Image
