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
import { useMemo, useCallback, ReactElement } from 'react'
import PropTypes from 'prop-types'
import loadable, { LoadableLibrary } from '@loadable/component'
import { Backdrop, CircularProgress } from '@mui/material'
import { useSystemData } from 'client/features/Auth'
import { CreateFormCallback, CreateStepsCallback } from 'client/utils/schema'

/**
 * @typedef ConfigurationProps
 * @param {object} initialValues - Initial values
 * @param {object} stepProps - Step props
 * @param {function(object):Promise} onSubmit - Submit handler
 * @param {ReactElement} [configProps.fallback] - Fallback displayed during the loading
 * @param {function(object):ReactElement} children - Children
 */

/** @type {LoadableLibrary} Library config of the form component */
const FormLibrary = loadable.lib((props) => import(`../Forms/${props.form}`), {
  cacheKey: (props) => props.form,
  fallback: (
    <Backdrop
      open
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        color: 'secondary.main',
      }}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  ),
})

/**
 * Loads the form component.
 *
 * @param {object} properties - Dynamic properties
 * @param {string} properties.formPath - Form pathname
 * @param {string} [properties.componentToLoad] - Load different component instead of default
 * @param {ConfigurationProps} configProps - Form configuration
 * @returns {function(object):ReactElement} Resolved form component
 */
const AsyncLoadForm = (
  { formPath, componentToLoad = 'default' } = {},
  { fallback, ...configProps } = {}
) =>
  configProps.children ? (
    <FormLibrary form={formPath} fallback={fallback}>
      {({ [componentToLoad]: config }) => (
        <MemoizedForm config={config} {...configProps} />
      )}
    </FormLibrary>
  ) : (
    ({ ...rootProps }) => (
      <FormLibrary form={formPath} fallback={fallback}>
        {({ [componentToLoad]: config }) => (
          <MemoizedForm config={config} {...configProps} {...rootProps} />
        )}
      </FormLibrary>
    )
  )

/**
 * Memoized form component.
 *
 * @param {object} props - Props
 * @param {CreateFormCallback|CreateStepsCallback} props.config - Form config
 * @param {object} props.initialValues - Initial values
 * @param {object} props.stepProps - Step props
 * @param {function(object):Promise} props.onSubmit - Submit handler
 * @param {function(object):ReactElement} props.children - Children
 * @returns {ReactElement} Form component
 */
const MemoizedForm = ({
  config,
  initialValues,
  stepProps,
  onSubmit,
  children,
} = {}) => {
  const { transformBeforeSubmit, ...restOfConfig } = useMemo(
    () => config(stepProps, initialValues),
    []
  )

  const { oneConfig, adminGroup } = useSystemData()

  const handleTriggerSubmit = useCallback(
    (data) =>
      onSubmit(
        transformBeforeSubmit?.(
          data,
          initialValues,
          stepProps,
          adminGroup,
          oneConfig
        ) ?? data
      ),
    [transformBeforeSubmit]
  )

  const memoChildren = useMemo(
    () => children({ ...restOfConfig, onSubmit: handleTriggerSubmit }),
    []
  )

  return <>{memoChildren}</>
}

MemoizedForm.propTypes = {
  config: PropTypes.func.isRequired,
  initialValues: PropTypes.any,
  stepProps: PropTypes.any,
  onSubmit: PropTypes.func,
  children: PropTypes.func,
}

AsyncLoadForm.propTypes = {
  formPath: PropTypes.string.isRequired,
  componentToLoad: PropTypes.string,
}

export { AsyncLoadForm }
