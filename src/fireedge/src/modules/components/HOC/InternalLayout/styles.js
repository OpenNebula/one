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
import { footer, toolbar } from '@ProvidersModule'

export default (theme) => ({
  root: css({
    flex: '1 1 auto',
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'column',
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  main: css({
    height: '100vh',
    width: '100%',
    backgroundColor: theme?.palette?.mainContainer?.backgroundColor,
    paddingBottom: footer.regular,
    paddingTop: toolbar.regular,
    [`${theme.breakpoints.up('xs')} and (orientation: landscape)`]: {
      paddingTop: toolbar.xs,
    },
    [theme.breakpoints.up('sm')]: {
      paddingTop: toolbar.sm,
    },
  }),
  scrollable: css({
    paddingTop: theme.spacing(2),
    height: '100%',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: '3.4375rem',
    paddingRight: '3.4375rem',
  }),
  /* ROUTES TRANSITIONS */
  appear: css({}),
  appearActive: css({}),
  enter: css({
    opacity: 0,
  }),
  enterActive: css({
    opacity: 1,
    transition: 'opacity 300ms',
  }),
  exit: css({
    opacity: 1,
    transform: 'scale(1)',
  }),
  exitActive: css({
    opacity: 0,
    transition: 'opacity 300ms',
  }),
  enterDone: css({}),
  exitDone: css({}),
})
