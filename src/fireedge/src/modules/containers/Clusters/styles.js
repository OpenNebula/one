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
/* eslint-disable jsdoc/require-jsdoc */
import { css, keyframes } from '@emotion/css'

const flow = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 300% 50%; }
`

export const styles = ({ palette }) => ({
  root: css({
    height: '12px',
    borderRadius: '96px',
    backgroundColor: palette.progressBar.pending.color,
  }),
  animatedBar: css({
    backgroundImage: `linear-gradient(
      90deg,
      ${palette.progressBar.completed.color},
      ${palette.progressBar.completed.auxColor},
      ${palette.progressBar.completed.color}
    )`,
    backgroundSize: '200% 100%',
    animation: `${flow} 4s linear infinite`,
  }),
  solidBar: css({
    backgroundColor: palette.progressBar.completed.color,
  }),
  infoText: css({
    color: palette.primary.main,
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: '16px',
  }),
  titleText: css({
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 600,
    lineHeight: '16px',
  }),
})
