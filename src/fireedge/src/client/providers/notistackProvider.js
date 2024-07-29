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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'

import { SnackbarProvider } from 'notistack'
import makeStyles from '@mui/styles/makeStyles'

const useStyles = makeStyles(({ palette }) => ({
  containerRoot: {
    marginLeft: 20,
    wordBreak: 'break-word',
    '& *[role=button], & *[role=button]:hover': {
      color: 'inherit',
    },
  },
  variantSuccess: {
    backgroundColor: palette.success.main,
    color: palette.success.contrastText,
  },
  variantError: {
    backgroundColor: palette.error.main,
    color: palette.error.contrastText,
  },
  variantInfo: {
    backgroundColor: palette.debug.main,
    color: palette.debug.contrastText,
  },
  variantWarning: {
    backgroundColor: palette.warning.main,
    color: palette.warning.contrastText,
  },
}))

const NotistackProvider = ({ children }) => {
  const classes = useStyles()

  return (
    <SnackbarProvider
      hideIconVariant
      classes={classes}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      {children}
    </SnackbarProvider>
  )
}

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
