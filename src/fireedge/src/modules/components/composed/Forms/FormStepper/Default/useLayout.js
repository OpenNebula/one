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
import { useCallback, useRef, useState } from 'react'
import { useResizeObserver } from '@HooksModule'
import { formStepperBreakpoints } from '@StylesModule'

/**
 * Measures the available canvas for the form and its loading skeleton.
 *
 * @returns {object} Canvas ref, available height and responsive layout
 */
const useFormStepperLayout = () => {
  const [layout, setLayout] = useState('narrow')
  const [canvasHeight, setCanvasHeight] = useState()
  const canvasRef = useRef(null)
  const setCanvasRef = useCallback((node) => {
    canvasRef.current = node?.parentElement
  }, [])

  useResizeObserver(
    canvasRef,
    ({ contentRect: { width, height } }) => {
      setCanvasHeight(height)

      if (width >= formStepperBreakpoints.wide) {
        setLayout('wide')
      } else if (width >= formStepperBreakpoints.medium) {
        setLayout('medium')
      } else {
        setLayout('narrow')
      }
    },
    0
  )

  return { layout, canvasHeight, setCanvasRef }
}

export default useFormStepperLayout
