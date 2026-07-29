/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
    height: 'calc(100vh - var(--sidebar-header-height, 0px))',
    width: '100%',
    backgroundColor: theme?.palette?.surface?.page,
  }),
  scrollable: css({
    height: '100%',
    maxWidth: '100% !important',
    minHeight: 0,
    overflow: 'auto',
    display: 'flex',
    flex: '1 0 0',
    flexDirection: 'column',
    paddingLeft: 0,
    paddingRight: 0,
    padding: `${theme.scale[700]}px ${theme.scale[700]}px`,
  }),
  noScrollable: css({
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
    padding: 0,
    margin: 0,
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
