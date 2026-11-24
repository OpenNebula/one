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
  ReactElement,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import PropTypes from 'prop-types'

const DEFAULT_STATE = {
  activeStep: 0,
  totalSteps: 0,
  isRegistered: false,
}

const CreationFormContext = createContext({
  ...DEFAULT_STATE,
  isCreation: false,
  cancelCreationForm: () => undefined,
  registerCreationForm: () => undefined,
  unregisterCreationForm: () => undefined,
})

/**
 * Shares the state of a page creation form with the application header.
 *
 * @param {object} root0 - Params
 * @param {ReactNode} root0.children - Provider children
 * @param {boolean} root0.isCreation - Whether the current route is a creation form
 * @returns {ReactElement} Creation form context provider
 */
export const CreationFormProvider = ({ children, isCreation = false }) => {
  const [state, setState] = useState(DEFAULT_STATE)
  const cancelRef = useRef()

  const registerCreationForm = useCallback(
    ({ activeStep = 0, totalSteps = 0, onCancel } = {}) => {
      cancelRef.current = onCancel

      setState((currentState) => {
        const nextState = {
          activeStep,
          totalSteps,
          isRegistered: true,
        }

        return currentState.activeStep === nextState.activeStep &&
          currentState.totalSteps === nextState.totalSteps &&
          currentState.isRegistered
          ? currentState
          : nextState
      })
    },
    []
  )

  const unregisterCreationForm = useCallback(() => {
    cancelRef.current = undefined
    setState(DEFAULT_STATE)
  }, [])

  const cancelCreationForm = useCallback(() => cancelRef.current?.(), [])

  const value = useMemo(
    () => ({
      ...state,
      isCreation,
      cancelCreationForm,
      registerCreationForm,
      unregisterCreationForm,
    }),
    [
      cancelCreationForm,
      isCreation,
      registerCreationForm,
      state,
      unregisterCreationForm,
    ]
  )

  return (
    <CreationFormContext.Provider value={value}>
      {children}
    </CreationFormContext.Provider>
  )
}

CreationFormProvider.propTypes = {
  children: PropTypes.node,
  isCreation: PropTypes.bool,
}

/**
 * @returns {object} Creation form state and actions
 */
export const useCreationForm = () => useContext(CreationFormContext)
