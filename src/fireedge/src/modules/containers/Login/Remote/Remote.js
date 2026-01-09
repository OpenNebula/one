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

import {
  Box,
  Container,
  useMediaQuery,
  Typography,
  useTheme,
} from '@mui/material'
import { Translate, OpenNebulaLogo, SubmitButton, Tr } from '@ComponentsModule'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { styles } from '@modules/containers/Login/styles'

/**
 * Displays the remote login form and handles the login process.
 *
 * @param {object} props - Props
 * @param {object} props.data - User Auth data
 * @returns {ReactElement} The login form.
 */
export function Remote({ data = {} }) {
  const { remoteRedirect = '.' } = data

  const isMobile = useMediaQuery((themeSunstone) =>
    themeSunstone.breakpoints.only('xs')
  )

  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

  return (
    <Container
      component="main"
      disableGutters={isMobile}
      maxWidth={isMobile ? 'lg' : 'xs'}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100vh',
        alignItems: 'center',
      }}
    >
      <Box className={classes.login}>
        <OpenNebulaLogo
          data-cy="opennebula-logo"
          height={'7rem'}
          width="100%"
          withText
        />

        <Box display="flex" overflow="hidden">
          <Typography variant="h2" sx={{ margin: '3.5rem 0rem 0rem 0rem' }}>
            {Tr(T.LogIn)}
          </Typography>
        </Box>

        <SubmitButton
          data-cy="login-button"
          variant="contained"
          onClick={() => {
            window.location.href = remoteRedirect
          }}
          label={<Translate word={T.SignIn} />}
          importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
          type={STYLE_BUTTONS.TYPE.FILLED}
          size={STYLE_BUTTONS.SIZE.LARGE}
          sx={{ textTransform: 'uppercase', width: '100%', marginTop: '2rem' }}
        />
      </Box>
    </Container>
  )
}

Remote.propTypes = {
  data: PropTypes.shape({
    jwt: PropTypes.string,
    id: PropTypes.string,
    remoteRedirect: PropTypes.string,
  }),
}
Remote.displayName = 'Remote'
