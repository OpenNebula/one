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
import PropTypes from 'prop-types'
import { SnackbarProvider } from 'notistack'

const NotistackProvider = ({ children }) => (
  <SnackbarProvider
    hideIconVariant
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    classes={{
      containerRoot: {
        marginLeft: '20px',
        wordBreak: 'break-word',
        '& *[role=button], & *[role=button]:hover': {
          color: 'inherit',
        },
      },
      variantSuccess: (theme) => ({
        backgroundColor: theme.palette.success.main,
        color: theme.palette.success.contrastText,
      }),
      variantError: (theme) => ({
        backgroundColor: theme.palette.error.main,
        color: theme.palette.error.contrastText,
      }),
      variantInfo: (theme) => ({
        backgroundColor: theme.palette.info.main,
        color: theme.palette.info.contrastText,
      }),
      variantWarning: (theme) => ({
        backgroundColor: theme.palette.warning.main,
        color: theme.palette.warning.contrastText,
      }),
    }}
  >
    {children}
  </SnackbarProvider>
)

NotistackProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
}

NotistackProvider.defaultProps = {
  children: undefined,
}

export default NotistackProvider
