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

const styles = makeStyles(theme => ({
  appbar: {
    position: 'absolute',
    transition: theme.transitions.create('background-color'),
    backgroundColor: ({ isScroll }) => isScroll
      ? theme.palette.secondary.main
      : theme.palette.primary.main
  },
  title: {
    userSelect: 'none',
    display: 'inline-flex',
    '& span': { textTransform: 'capitalize' }
  },
  app: {
    color: ({ isScroll }) => isScroll
      ? theme.palette.primary.main
      : theme.palette.secondary.main,
    '&::after': {
      content: '"|"',
      margin: '0.5em',
      color: theme.palette.primary.contrastText
    }
  },
  /* POPOVER */
  backdrop: {
    [theme.breakpoints.only('xs')]: {
      backgroundColor: theme.palette.action.disabledOpacity
    }
  },
  paper: {
    [theme.breakpoints.only('xs')]: {
      width: '100%',
      height: '100%'
    }
  },
  padding: { padding: theme.spacing(2) },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderBottom: '1px solid',
    borderBottomColor: theme.palette.action.disabledBackground
  },
  buttonLabel: {
    paddingLeft: theme.spacing(1),
    [theme.breakpoints.only('xs')]: {
      display: 'none'
    }
  },
  /* GROUP SWITCHER */
  modeThemeIcon: {
    color: theme.palette.primary.contrastText
  },
  /* GROUP SWITCHER */
  headerSwitcherLabel: { flexGrow: 1 },
  groupButton: {
    justifyContent: 'start',
    '& svg:first-of-type': {
      margin: theme.spacing(0, 2)
    }
  }
}))

export default styles
