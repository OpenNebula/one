/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { makeStyles } from '@material-ui/core'

export default makeStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100vh'
  },
  progress: {
    height: 4,
    width: '100%',
    [theme.breakpoints.only('xs')]: {
      top: 0,
      position: 'fixed'
    }
  },
  paper: {
    overflow: 'hidden',
    padding: theme.spacing(2),
    minHeight: 440,
    [theme.breakpoints.up('xs')]: {
      display: 'flex',
      flexDirection: 'column'
    },
    [theme.breakpoints.only('xs')]: {
      border: 'none',
      height: 'calc(100vh - 4px)',
      backgroundColor: 'transparent'
    }
  },
  wrapperForm: {
    padding: theme.spacing(),
    display: 'flex',
    overflow: 'hidden'
  },
  form: {
    width: '100%',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('xs')]: {
      justifyContent: 'center'
    }
  },
  loading: {
    opacity: 0.7
  },
  helper: {
    animation: '1s ease-out 0s 1'
  }
}))
