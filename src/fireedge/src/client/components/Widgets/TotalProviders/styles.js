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
  root: {
    padding: '2em',
  },
  title: {
    padding: '0 2em 2em',
    textAlign: 'left',
  },
  titlePrimary: {
    fontSize: '2rem',
    color: theme.palette.text.primary,
    '& span': {
      marginLeft: '1rem',
    },
  },
  titleSecondary: {
    fontSize: '1.4rem',
    color: theme.palette.text.secondary,
  },
  content: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
    gridGap: '2em',
    padding: '0 2em',
  },
  legendSecondary: {
    fontSize: '0.9rem',
    marginLeft: '1.2rem',
    color: theme.palette.text.secondary,
  },
  chart: {
    height: 200,
    [theme.breakpoints.only('xs')]: {
      display: 'none',
    },
  },
}))
