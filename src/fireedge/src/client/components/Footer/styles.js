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
  footer: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.light,
    position: 'absolute',
    bottom: 0,
    left: 'auto',
    right: 0,
    width: '100%',
    zIndex: 1100,
    textAlign: 'center',
    padding: 5
  },
  heartIcon: {
    margin: '0 0.5em',
    color: theme.palette.error.dark
  },
  link: {
    color: theme.palette.primary.contrastText
  }
}))
