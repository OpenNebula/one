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

import { Translate, TranslateProvider } from '@ComponentsModule'
import { css } from '@emotion/css'
import { Box, Typography, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, createContext, useContext, useMemo } from 'react'

const SettingWrapperContext = createContext(null)

const styles = ({ typography }) => ({
  content: css({
    padding: typography.pxToRem(16),
    '& > *': {
      marginBottom: typography.pxToRem(48),
    },
  }),
  legend: css({
    marginLeft: typography.pxToRem(-16),
    padding: `${typography.pxToRem(8)} ${typography.pxToRem(16)}`,
    marginBottom: typography.pxToRem(24),
    display: 'inline-table',
  }),
  internalWrapper: css({
    display: 'grid',
    gridTemplateColumns: '140px 1fr',
    gridAutoRows: 'auto',
    gap: '1em',
  }),
})

/**
 * Wrapper for settings.
 *
 * @param {object} props - props
 * @param {any} props.children - Children
 * @returns {ReactElement} React element
 */
const Wrapper = ({ children }) => {
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

  const Legend = ({ title = '' }) => (
    <Typography
      variant="underline"
      component="legend"
      className={classes.legend}
    >
      <Translate word={title} />
    </Typography>
  )
  Legend.propTypes = {
    title: PropTypes.string,
  }

  const InternalWrapper = ({ children, title = '', innerClassName }) => (
    <Box
      className={classes.internalWrapper}
      gridTemplateColumns={{ sm: '1fr' }}
    >
      <Typography className={innerClassName} component="legend">
        <Translate word={title} />
      </Typography>
      <Box>{children}</Box>
    </Box>
  )
  InternalWrapper.propTypes = {
    children: PropTypes.node,
    title: PropTypes.string,
    innerClassName: PropTypes.string,
  }

  return (
    <TranslateProvider>
      <SettingWrapperContext.Provider value={{ Legend, InternalWrapper }}>
        <Box className={classes.content}>{children}</Box>
      </SettingWrapperContext.Provider>
    </TranslateProvider>
  )
}

Wrapper.propTypes = {
  children: PropTypes.any,
}
Wrapper.displayName = 'Wrapper'

/**
 * Legend hook.
 *
 * @returns {Function} Setting Context
 */
const useSettingWrapper = () => useContext(SettingWrapperContext)

export { Wrapper, useSettingWrapper }
