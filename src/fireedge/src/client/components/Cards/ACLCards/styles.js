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
import makeStyles from '@mui/styles/makeStyles'
import { SCHEMES } from 'client/constants'

export const aclStyles = makeStyles(({ palette }) => ({
  aclApplies: {
    margin: '0.2em',
    color: palette.mode === SCHEMES.LIGHT ? 'black' : 'white',
  },
  aclNotApplies: {
    margin: '0.2em',
    color: 'grey',
  },
  centeredContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'left',
  },
  rightContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'right',
  },
  rigthApplies: {
    color: palette.mode === SCHEMES.LIGHT ? 'black' : 'white',
  },
  rigthNotApplies: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    color: 'grey',
  },
}))
