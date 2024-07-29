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

const MemoryIcon = memo(({ viewBox, width, height, color, ...props }) => (
  <svg viewBox={viewBox} width={width} height={height} {...props}>
    <path
      fill={color}
      d="M13.78 13.25V3.84a3.841 3.841 0 0 1 7.68 0v9.41h9.73V3.84a3.841 3.841 0 0 1 7.68 0v9.41h9.73V3.84a3.841 3.841 0 0 1 7.68 0v9.41h9.73V3.84a3.841 3.841 0 0 1 7.68 0v9.41h9.73V3.84a3.841 3.841 0 0 1 7.68 0v9.41h9.73V3.84a3.841 3.841 0 0 1 7.68 0v9.41h8.6c1.59 0 3.03.65 4.07 1.69a5.744 5.744 0 0 1 1.69 4.07v60.66c0 1.57-.65 3.01-1.69 4.06l.01.01a5.744 5.744 0 0 1-4.07 1.69h-8.6v8.82a3.841 3.841 0 0 1-7.68 0v-8.82h-9.73v8.82a3.841 3.841 0 0 1-7.68 0v-8.82H73.7v8.82a3.841 3.841 0 0 1-7.68 0v-8.82h-9.73v8.82a3.841 3.841 0 0 1-7.68 0v-8.82h-9.73v8.82a3.841 3.841 0 0 1-7.68 0v-8.82h-9.73v8.82a3.841 3.841 0 0 1-7.68 0v-8.82H5.75c-1.59 0-3.03-.65-4.07-1.69A5.814 5.814 0 0 1 0 79.67V19.01c0-1.59.65-3.03 1.69-4.07.12-.12.25-.23.38-.33a5.748 5.748 0 0 1 3.69-1.35h8.02v-.01zm16.98 49.52-5.2-9.85v9.85h-8.61V35.31h12.8c2.22 0 4.12.39 5.7 1.18 1.58.79 2.76 1.86 3.55 3.22s1.18 2.89 1.18 4.6c0 1.84-.51 3.47-1.53 4.89-1.02 1.42-2.49 2.44-4.4 3.06l5.97 10.51h-9.46zm-5.2-15.59h3.41c.83 0 1.45-.19 1.86-.56.41-.38.62-.96.62-1.77 0-.72-.21-1.29-.64-1.71-.43-.41-1.04-.62-1.84-.62h-3.41v4.66zm34.99 11.44H51.4l-1.36 4.15H41l10.05-27.46h9.93l10.01 27.46h-9.08l-1.36-4.15zm-2.1-6.47-2.48-7.64-2.48 7.64h4.96zm47.48-16.84v27.46h-8.57V49.08l-4.23 13.69h-7.37l-4.23-13.69v13.69h-8.61V35.31h10.55l6.05 16.49 5.9-16.49h10.51zm9.27-14.38H7.68v56.81H115.2V20.93z"
    />
  </svg>
))

MemoryIcon.propTypes = {
  width: oneOfType([number, string]).isRequired,
  height: oneOfType([number, string]).isRequired,
  viewBox: string,
  color: string,
}

MemoryIcon.defaultProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 122.88 98.08',
  color: 'currentColor',
}

MemoryIcon.displayName = 'MemoryIcon'

export default MemoryIcon
