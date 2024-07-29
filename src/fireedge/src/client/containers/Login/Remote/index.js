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

import { Button, Container, Grid, useMediaQuery } from '@mui/material'
import { Translate } from 'client/components/HOC'
import { JWT_NAME, T } from 'client/constants'
import { actions as authActions } from 'client/features/Auth/slice'
import { storage } from 'client/utils'
import { ReactElement, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { OpenNebulaLogo } from 'client/components/Icons'
import PropTypes from 'prop-types'

/**
 * Displays the remote login form and handles the login process.
 *
 * @param {object} props - Props
 * @param {object} props.data - User Auth data
 * @returns {ReactElement} The login form.
 */
function Remote({ data = {} }) {
  const dispatch = useDispatch()
  const { jwt, remoteRedirect = '.', ...user } = data

  useEffect(() => {
    if (jwt) {
      storage(JWT_NAME, jwt)
      dispatch(authActions.changeJwt(jwt))
    }
    user && dispatch(authActions.changeAuthUser(user))
  }, [])

  const isMobile = useMediaQuery((theme) => theme.breakpoints.only('xs'))

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
      }}
    >
      <Grid
        container
        direction="column"
        sx={{
          p: 2,
          overflow: 'hidden',
          minHeight: 440,
          border: ({ palette }) => ({
            xs: 'none',
            sm: `1px solid ${palette.divider}`,
          }),
          borderRadius: ({ shape }) => shape.borderRadius / 2,
          height: { xs: 'calc(100vh - 4px)', sm: 'auto' },
          backgroundColor: { xs: 'transparent', sm: 'background.paper' },
        }}
      >
        <Grid item>
          <OpenNebulaLogo
            data-cy="opennebula-logo"
            height={100}
            width="100%"
            withText
          />
        </Grid>

        <Grid
          display="flex"
          py={2}
          px={1}
          sx={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
          overflow="hidden"
        >
          <Button
            data-cy="login-button"
            color="secondary"
            variant="contained"
            onClick={() => {
              window.location.href = remoteRedirect
            }}
          >
            <Translate word={T.SignIn} />
          </Button>
        </Grid>
      </Grid>
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

export default Remote
