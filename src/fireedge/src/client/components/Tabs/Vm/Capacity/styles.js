/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
  root: {
    padding: '0.5em',
    display: 'grid',
    gap: '1em',
    gridAutoFlow: 'column',
    [theme.breakpoints.down('md')]: {
      gridAutoFlow: 'initial',
    },
  },
  item: {
    [theme.breakpoints.down('md')]: {
      display: 'flex',
      gap: '1em',
      '& > *': {
        width: '50%',
      },
    },
  },
  actions: {
    [theme.breakpoints.down('md')]: {
      borderBottom: `1px solid ${theme.palette.divider}`,
      padding: '0 1em 1em 1em',
    },
    [theme.breakpoints.up('md')]: {
      order: 1,
      textAlign: 'end',
    },
  },
}))
