/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {string} root0.aspectRatio - Image aspect ratio
 * @returns {object} - Image styles
 */
export const getStyles = ({ theme, aspectRatio }) => {
  const baseStyles = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '0',
  }

  const image = {
    '& .avatar-image': {
      padding: `${theme.scale[50]}px`,
      display: 'block',
      ...(aspectRatio && {
        aspectRatio,
        objectFit: 'contain',
      }),
      borderRadius: `${theme.scale[150]}px`,
      border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
    },
  }

  return {
    ...baseStyles,
    ...image,
  }
}
