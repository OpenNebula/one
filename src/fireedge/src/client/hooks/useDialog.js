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
import { useState } from 'react'

const callAll =
  (...fns) =>
  (...args) =>
    fns.forEach((fn) => fn && fn?.(...args))

/**
 * Hook to manage a dialog.
 *
 * @returns {{
 * display: boolean,
 * values: any,
 * show: Function,
 * hide: Function,
 * toggle: Function,
 * getToggleProps: Function,
 * getContainerProps: Function
 * }} - Returns management function to dialog
 */
const useDialog = () => {
  const [display, setDisplay] = useState(false)
  const [values, setValues] = useState(null)

  const toggle = () => setDisplay((prev) => !prev)

  const show = (newValues) => {
    setDisplay(true)
    newValues && setValues(newValues)
  }

  const hide = () => {
    setDisplay(false)
    setValues(null)
  }

  const getToggleProps = (props = {}) => ({
    'aria-controls': 'target',
    'aria-expanded': Boolean(display),
    ...props,
    onClick: callAll(props.onClick, toggle),
  })

  const getContainerProps = (props = {}) => ({
    ...props,
    onClick: callAll(props.onClick, toggle),
    onKeyDown: callAll(
      props.onKeyDown,
      ({ keyCode }) => keyCode === 27 && hide()
    ),
  })

  return {
    display,
    values,
    show,
    hide,
    toggle,
    getToggleProps,
    getContainerProps,
  }
}

export default useDialog
