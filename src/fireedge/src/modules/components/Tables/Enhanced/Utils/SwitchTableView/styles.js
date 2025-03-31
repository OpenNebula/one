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
import { css } from '@emotion/css'

/**
 * Styles for the componente SwitchTableView.
 *
 * @param {object} theme - Current theme
 * @param {object} theme.palette - Current palette
 * @returns {object} - Component styles
 */
export const SwitchTableViewStyles = ({ palette }) => ({
  button: css({
    backgroundColor: palette?.switchViewTable?.button?.normal?.backgroundColor,
    borderWidth: '0.0625rem',
    borderStyle: 'solid',
    borderColor: palette?.switchViewTable?.button?.normal?.borderColor,
    padding: '0.5625rem 0.75rem',
    '&:hover': {
      backgroundColor: palette?.switchViewTable.button?.hover.backgroundColor,
    },
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }),
  selected: css({
    backgroundColor: palette?.switchViewTable.button?.selected.backgroundColor,
  }),
  buttonContent: css({
    width: '5.6875rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.375rem',
    alignSelf: 'stretch',
  }),
  buttonText: css({
    minHeight: '1.25rem',
    color: palette?.switchViewTable?.button?.normal?.color,
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 'normal',
    letterSpacing: '0.00625rem',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  leftButton: css({
    borderRadius: '6.25rem 0rem 0rem 6.25rem',
    borderRightStyle: 'none',
  }),
  rightButton: css({
    borderRadius: '0rem 6.25rem 6.25rem 0rem',
  }),
  logo: css({
    '& svg': {
      height: '1rem',
      width: '1rem',
    },
    color: palette?.switchViewTable?.icon?.color,
  }),
})

export default SwitchTableViewStyles
