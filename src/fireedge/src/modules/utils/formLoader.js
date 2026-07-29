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
import { useMemo, useCallback, ReactElement } from 'react'
import PropTypes from 'prop-types'
import loadable from '@loadable/component'
import { Backdrop, CircularProgress } from '@mui/material'

const DEFAULT_FALLBACK = (
  <Backdrop
    open
    sx={{
      zIndex: (theme) => theme.zIndex.drawer + 1,
      color: 'primary.main',
    }}
  >
    <CircularProgress color="inherit" />
  </Backdrop>
)

/**
 * Creates a lazily loaded form wrapper.
 *
 * The caller owns the dynamic import, keeping this utility independent from
 * the module that contains the form.
 *
 * @param {function():Promise<object>} loadForm - Dynamic form importer
 * @param {string} [componentToLoad] - Named export to load instead of default
 * @returns {function(object):ReactElement} Lazy form wrapper
 */
const createAsyncForm = (loadForm, componentToLoad = 'default') => {
  const FormLibrary = loadable.lib(loadForm, { fallback: DEFAULT_FALLBACK })

  const AsyncForm = ({ fallback, ...configProps } = {}) =>
    configProps.children ? (
      <FormLibrary fallback={fallback}>
        {({ [componentToLoad]: config }) => (
          <MemoizedForm config={config} {...configProps} />
        )}
      </FormLibrary>
    ) : (
      ({ ...rootProps }) => (
        <FormLibrary fallback={fallback}>
          {({ [componentToLoad]: config }) => (
            <MemoizedForm config={config} {...configProps} {...rootProps} />
          )}
        </FormLibrary>
      )
    )

  AsyncForm.propTypes = {
    fallback: PropTypes.node,
  }

  return AsyncForm
}

/**
 * Memoized form component.
 *
 * @param {object} props - Props
 * @param {Function} props.config - Form config
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
  onSubmitCallback,
} = {}) => {
  const { transformBeforeSubmit, ...restOfConfig } = useMemo(
    () => config(stepProps, initialValues),
    []
  )

  const handleTriggerSubmit = useCallback(
    (data) => {
      ;(onSubmitCallback || (() => undefined))()

      const processedData =
        transformBeforeSubmit?.(data, initialValues, stepProps) ?? data

      return onSubmit(processedData)
    },
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
  onSubmitCallback: PropTypes.func,
}

export { createAsyncForm }
