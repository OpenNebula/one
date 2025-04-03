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
import { Box, Container, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import { useMemo, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'

import { useGeneral } from '@FeaturesModule'
import Footer from '@modules/components/Footer'
import Header from '@modules/components/Header'
import internalStyles from '@modules/components/HOC/InternalLayout/styles'
import { footer, sidebar } from '@ProvidersModule'

import { SunstoneBreadcrumb } from '@modules/components/Breadcrumb'

const InternalLayout = ({ children, ...route }) => {
  const theme = useTheme()
  const classes = useMemo(() => internalStyles(theme), [theme])
  const container = useRef()
  const { isFixMenu } = useGeneral()

  if (route.disableLayout) {
    return (
      <Box data-cy="main-layout" className={classes.root}>
        <Box
          component="main"
          sx={{ height: '100vh', width: '100%', pb: `${footer.regular}px` }}
        >
          {children}
        </Box>
        <Footer />
      </Box>
    )
  }

  return (
    <Box
      data-cy="main-layout"
      className={classes.root}
      sx={useMemo(
        () => ({
          ml: {
            lg: isFixMenu ? `${sidebar.fixed}px` : `${sidebar.minified}px`,
          },
        }),
        [isFixMenu]
      )}
    >
      <Header scrollContainer={container.current} route={route} />
      <Box component="main" className={classes.main}>
        <CSSTransition
          in
          classNames={{
            appear: classes.appear,
            appearActive: classes.appearActive,
            enter: classes.enter,
            enterActive: classes.enterActive,
            enterDone: classes.enterDone,
            exit: classes.exit,
            exitActive: classes.exitActive,
            exitDone: classes.exitDone,
          }}
          timeout={300}
          unmountOnExit
        >
          <Container
            ref={container}
            className={classes.scrollable}
            maxWidth="xl"
          >
            <SunstoneBreadcrumb route={route} />
            {children}
          </Container>
        </CSSTransition>
      </Box>
      <Footer />
    </Box>
  )
}

InternalLayout.propTypes = {
  disableLayout: PropTypes.bool,
  children: PropTypes.any,
}

export default InternalLayout
