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

import { SCHEMES } from '@ConstantsModule'

const styles = (theme) => ({
  root: ({ isSelected }) =>
    css({
      height: '100%',
      transition: theme.transitions.create(['background-color', 'box-shadow'], {
        duration: '0.2s',
      }),
      '&:hover': {
        boxShadow: theme.shadows['5'],
      },
      ...(isSelected && {
        color: theme.palette.secondary.contrastText,
        backgroundColor: theme.palette.secondary.main,
        '& .badge': {
          color: theme.palette.secondary.main,
          backgroundColor: theme.palette.secondary.contrastText,
        },
      }),
    }),
  actionArea: css({
    '&:disabled': {
      filter: 'brightness(0.5)',
    },
  }),
  mediaActionArea: css({
    '&:hover': {
      backgroundColor: theme.palette.secondary.contrastText,
      '& $media': { filter: 'none' },
    },
  }),
  media: css({
    width: '100%',
    paddingTop: '38.85%',
    overflow: 'hidden',
    position: 'relative',
    '& img': {
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      position: 'absolute',
      userSelect: 'none',
    },
    transition: theme.transitions.create('filter', { duration: '0.2s' }),
    filter: ({ isSelected, disableFilterImage }) =>
      disableFilterImage
        ? 'none'
        : theme.palette.mode === SCHEMES.DARK || isSelected
        ? 'contrast(0) brightness(2)'
        : 'contrast(0) brightness(0.8)',
  }),
  headerRoot: css({
    // align header icon to top
    alignItems: 'start',
  }),
  headerContent: css({ overflow: 'auto' }),
  headerAvatar: css({
    display: 'flex',
    color: ({ isSelected }) =>
      isSelected
        ? theme.palette.secondary.contrastText
        : theme.palette.text.primary,
  }),
  subheader: css({
    color: ({ isSelected }) =>
      isSelected ? 'inherit' : theme.palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'initial',
    display: '-webkit-box',
    lineClamp: 1,
    boxOrient: 'vertical',
  }),
})

export default styles
