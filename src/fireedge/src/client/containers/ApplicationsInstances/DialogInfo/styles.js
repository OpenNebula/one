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

export default makeStyles((theme) => ({
  permissions: {
    marginBottom: theme.spacing(2),
  },
  list: {
    '& p': {
      ...theme.typography.body2,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '&.w-50 p': {
      width: '50%',
    },
    '&.w-25 p': {
      width: '25%',
    },
  },
  title: {
    '& p.bold': {
      fontWeight: theme.typography.fontWeightBold,
    },
  },
}))
