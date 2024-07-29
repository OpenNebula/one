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
import { memo, useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useFormContext } from 'react-hook-form'
import { ErrorHelper } from 'client/components/FormControl'

import { generateKey } from 'client/utils'
import InputCode from 'client/components/FormControl/InputCode'

const DockerfileController = memo(
  ({
    control,
    cy = `input-${generateKey()}`,
    name = '',
    onConditionChange,
  }) => {
    const {
      getValues,
      setValue,
      formState: { errors },
    } = useFormContext()

    const [internalError, setInternalError] = useState()
    const messageError = name
      .split('.')
      .reduce((errs, current) => errs?.[current], errors)?.message?.[0]

    useEffect(() => {
      setInternalError(messageError)
    }, [messageError])

    const handleChange = useCallback(
      (value) => {
        setValue(name, value)
        if (typeof onConditionChange === 'function') {
          onConditionChange(value)
        }
      },
      [setValue, onConditionChange, name]
    )

    return (
      <div data-cy={cy}>
        <InputCode
          mode="dockerfile"
          height="600px"
          value={getValues(name)}
          onChange={handleChange}
          onFocus={(e) => {
            setInternalError()
          }}
        />
        {internalError && <ErrorHelper label={internalError} />}
      </div>
    )
  },
  (prevProps, nextProps) => prevProps.cy === nextProps.cy
)

DockerfileController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  onConditionChange: PropTypes.func,
}

DockerfileController.displayName = 'DockerfileController'

export default DockerfileController
