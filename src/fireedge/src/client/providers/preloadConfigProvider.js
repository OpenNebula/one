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
import { ReactElement, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * Provider component to preload configuration from server.
 *
 * @param {object} props - Props
 * @param {any} props.children - Children
 * @returns {ReactElement} React element
 */
const PreloadConfigProvider = ({ children }) => {
  useEffect(() => {
    const preload = document.querySelector('#preload-server-side')

    if (preload) {
      // remove preload script from DOM after it's loaded
      preload.parentElement.removeChild(preload)
    }
  }, [])

  return <>{children}</>
}

PreloadConfigProvider.propTypes = {
  children: PropTypes.node,
}

export default PreloadConfigProvider
