/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useParams } from 'react-router-dom'
import clsx from 'clsx'
import { Box, Container } from '@mui/material'
import { CSSTransition } from 'react-transition-group'

import { useGeneral, useGeneralApi } from 'client/features/General'
import Header from 'client/components/Header'
import Footer from 'client/components/Footer'
import internalStyles from 'client/components/HOC/InternalLayout/styles'

const InternalLayout = ({ title, children }) => {
  const classes = internalStyles()
  const container = useRef()
  const { isFixMenu } = useGeneral()
  const { changeTitle } = useGeneralApi()
  const params = useParams()

  useEffect(() => {
    changeTitle(typeof title === 'function' ? title(params) : title)
  }, [title])

  return (
    <Box className={clsx(classes.root, { [classes.isDrawerFixed]: isFixMenu })}>
      <Header scrollContainer={container.current} />
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
            exitDone: classes.exitDone
          }}
          timeout={300}
          unmountOnExit
        >
          <Container ref={container} maxWidth={false} className={classes.scrollable}>
            {children}
          </Container>
        </CSSTransition>
      </Box>
      <Footer />
    </Box>
  )
}

InternalLayout.propTypes = {
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func
  ]),
  children: PropTypes.any
}

export default InternalLayout
