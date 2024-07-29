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
import { memo } from 'react'
import { number, string, oneOfType } from 'prop-types'

const WebMKSLogo = memo(({ width, height, viewBox, ...props }) => (
  <svg viewBox={viewBox} width={width} height={height} {...props}>
    <g id="logo__wmks" fill="currentColor">
      <path
        d="M2196.906-4110.052a2.112 2.112 0 0 0-2.166-2.151q-2.533-.006-5.066 0a2.105 2.105 0 0 0-2.172 2.176v3.638c0 .277 0 .278-.281.277h-7.94a1.547 1.547 0 0 0-1.108.428 1.894 1.894 0 0 0-.582 1.66 1.745 1.745 0 0 0 1.744 1.6c1.649-.031 3.3-.009 4.951-.01h.185c.014.022.029.044.042.067a1.3 1.3 0 0 0-.183.136q-3.471 3.465-6.936 6.932a1.6 1.6 0 0 0-.485 1.162 1.974 1.974 0 0 0 1.235 1.79 1.691 1.691 0 0 0 1.961-.445l6.774-6.77c.054-.055.115-.1.209-.184v5.023a1.722 1.722 0 0 0 .223.912 1.906 1.906 0 0 0 2.158.807 1.748 1.748 0 0 0 1.292-1.736c-.025-2.627-.007-5.254-.011-7.882 0-.179.045-.24.233-.239 1.257.008 2.514.006 3.77 0a2.153 2.153 0 0 0 .342-.021 2.1 2.1 0 0 0 1.809-2.16q.01-2.504.002-5.01Zm-2.5 3.951a.671.671 0 0 1-.764.756h-2.8a.741.741 0 0 1-.821-.826v-2.758a.709.709 0 0 1 .8-.792h2.816a.689.689 0 0 1 .76.752v1.445c.009.472.011.948.003 1.424Z"
        transform="translate(-2172.382 4116.408)"
      />
    </g>
  </svg>
))

WebMKSLogo.propTypes = {
  width: oneOfType([number, string]).isRequired,
  height: oneOfType([number, string]).isRequired,
  viewBox: string,
}

WebMKSLogo.defaultProps = {
  width: 28,
  height: 28,
  viewBox: '0 0 28 28',
}

WebMKSLogo.displayName = 'WebMKSLogo'

export default WebMKSLogo
