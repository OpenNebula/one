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

import {
  InteractiveGrid,
  OpenNebulaLogo,
  SubmitButton,
} from '@ComponentsV2Module'
import {
  Box,
  Container,
  useMediaQuery,
  Typography,
  useTheme,
} from '@mui/material'
import { Translate, useTranslation } from '@ProvidersModule'
import { storage } from '@UtilsModule'
import { JWT_NAME, T, STYLE_BUTTONS } from '@ConstantsModule'
import { AuthSlice } from '@FeaturesModule'

import { ReactElement, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import { styles } from '@modules/containers/Login/styles'

const { actions: authActions } = AuthSlice

/**
 * Displays the remote login form and handles the login process.
 *
 * @param {object} props - Props
 * @param {object} props.data - User Auth data
 * @returns {ReactElement} The login form.
 */
export function Remote({ data = {} }) {
  const { translate } = useTranslation()
  const dispatch = useDispatch()
  const { jwt, remoteRedirect = '.', ...user } = data

  useEffect(() => {
    if (jwt) {
      storage(JWT_NAME, jwt)
      dispatch(authActions.changeJwt(jwt))
    }
    user && dispatch(authActions.changeAuthUser(user))
  }, [])

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
        height: '100vh',
        alignItems: 'center',
      }}
    >
      <Box className={classes.login}>
        <InteractiveGrid data-cy="opennebula-brand-grid">
          <OpenNebulaLogo withText width={100} height={40} />
        </InteractiveGrid>

        <Typography variant="h6" align="center">
          {translate(T.LogIn)}
        </Typography>

        <SubmitButton
          data-cy="login-button"
          onClick={() => {
            window.location.href = remoteRedirect
          }}
          label={<Translate word={T.SignIn} />}
          type={STYLE_BUTTONS.TYPE.PRIMARY}
          sx={{ width: '100%', marginTop: 3 }}
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
