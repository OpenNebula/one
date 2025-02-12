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
import { generateKey } from '@UtilsModule'
import PropTypes from 'prop-types'
import { memo, useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'

const TypographyController = memo(
  ({ text = '', cy = `input-${generateKey()}`, dependencies }) => {
    const { getValues, watch } = useFormContext()
    const [data, setData] = useState(null)

    useEffect(() => {
      if (dependencies) {
        const keys = Array.isArray(dependencies) ? dependencies : [dependencies]
        const initialData = {}
        keys.forEach((key) => {
          initialData[key] = getValues(key)
        })
        setData(initialData)
      }
    }, [dependencies, getValues])

    useEffect(() => {
      if (dependencies) {
        const subscription = watch((values) => {
          const keys = Array.isArray(dependencies)
            ? dependencies
            : [dependencies]
          const updatedData = {}
          keys.forEach((key) => {
            updatedData[key] = values[key]
          })
          setData(updatedData)
        })

        return () => subscription.unsubscribe()
      }
    }, [dependencies, watch])

    return (
      <div data-cy={cy}>{typeof text === 'function' ? text(data) : text}</div>
    )
  }
)

TypographyController.propTypes = {
  cy: PropTypes.string,
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  dependencies: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
}

TypographyController.displayName = 'TypographyController'

export default TypographyController
