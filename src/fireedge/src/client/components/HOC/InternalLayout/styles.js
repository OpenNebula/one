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
import { toolbar, footer } from 'client/theme/defaults'

export default makeStyles((theme) => ({
  root: {
    flex: '1 1 auto',
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'column',
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  main: {
    height: '100vh',
    width: '100%',
    paddingBottom: footer.regular,
    paddingTop: toolbar.regular,
    [`${theme.breakpoints.up('xs')} and (orientation: landscape)`]: {
      paddingTop: toolbar.xs,
    },
    [theme.breakpoints.up('sm')]: {
      paddingTop: toolbar.sm,
    },
  },
  scrollable: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    height: '100%',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  /* ROUTES TRANSITIONS */
  appear: {},
  appearActive: {},
  enter: {
    opacity: 0,
  },
  enterActive: {
    opacity: 1,
    transition: 'opacity 300ms',
  },
  exit: {
    opacity: 1,
    transform: 'scale(1)',
  },
  exitActive: {
    opacity: 0,
    transition: 'opacity 300ms',
  },
  enterDone: {},
  exitDone: {},
}))
