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
import { css } from '@emotion/css'
import { SCHEMES } from '@ConstantsModule'

export const aclStyles = ({ palette }) => ({
  aclApplies: css({
    margin: '0.2em',
    color: palette.mode === SCHEMES.LIGHT ? 'black' : 'white',
  }),
  aclNotApplies: css({
    margin: '0.2em',
    color: 'grey',
  }),
  centeredContent: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'left',
  }),
  rightContent: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'right',
  }),
  rigthApplies: css({
    color: palette.mode === SCHEMES.LIGHT ? 'black' : 'white',
  }),
  rigthNotApplies: css({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    color: 'grey',
  }),
})
