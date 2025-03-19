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

export const rowStyles = ({ palette, typography, breakpoints } = {}) => ({
  root: css({
    padding: '0.8em',
    color: palette.text.primary,
    backgroundColor: palette.background.paper,
    fontWeight: typography.fontWeightRegular,
    fontSize: '1em',
    borderRadius: 6,
    display: 'flex',
    '&:hover': { bgcolor: 'action.hover' },
    border: `1px solid ${palette.divider}`,
    gap: 8,
    [breakpoints.down('md')]: {
      flexWrap: 'wrap',
    },
  }),
  figure: css({
    flexBasis: '10%',
    aspectRatio: '16/9',
  }),
  image: css({
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    userSelect: 'none',
  }),
  main: css({
    flex: 'auto',
    overflow: 'hidden',
    alignSelf: 'center',
  }),
  title: css({
    color: palette.text.primary,
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    flexShrink: 0,
  }),
  labels: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
    flexGrow: 1,
  }),
  caption: css({
    ...typography.caption,
    color: palette.text.secondary,
    marginTop: 4,
    display: 'flex',
    gap: '1em',
    alignItems: 'center',
    flexWrap: 'wrap',
    wordWrap: 'break-word',
    '& > .full-width': {
      flexBasis: '100%',
    },
    '& > span': {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5em',
    },
  }),
  secondary: css({
    flexShrink: 0,
    whiteSpace: 'nowrap',
    textAlign: 'right',
    [breakpoints.down('sm')]: {
      display: 'none',
    },
    '& > *': {
      flexShrink: 0,
      whiteSpace: 'nowrap',
    },
  }),
  actions: css({
    flexShrink: 0,
  }),
  bars: css({
    width: '25%',
  }),
  vmActionLayout: css({
    display: 'flex',
    paddingTop: '.5rem',
    alignItems: 'flex-end',
    '& > *': {
      flexGrow: 1,
    },
  }),
  vmActions: css({
    flexGrow: 0,
  }),
})
