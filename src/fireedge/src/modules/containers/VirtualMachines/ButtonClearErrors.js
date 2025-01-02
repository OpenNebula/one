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
import { T } from '@ConstantsModule'
import { getErrorMessage, jsonToXml } from '@ModelsModule'
import { WarningCircledOutline as WarningIcon } from 'iconoir-react'
import PropTypes from 'prop-types'
import { memo, useCallback, useEffect, useState } from 'react'
import { TranslateProvider, SubmitButton, Tr } from '@ComponentsModule'

export const ButtonClearErrors = memo(({ handleDismissError, tags = [] }) => {
  const [vmErrors, setVmErrors] = useState([])
  const [isFetching, setIsFetching] = useState(false)

  useEffect(() => {
    const vmsInError = tags.filter(({ original = {} }) =>
      getErrorMessage(original)
    )

    vmsInError.length && setVmErrors(vmsInError)
  }, [tags])

  const handleClearErrors = useCallback(async () => {
    if (typeof handleDismissError === 'function') {
      setIsFetching(true)
      const promises = vmErrors.map(({ original = {} }) => {
        const { USER_TEMPLATE, ID } = original
        const { ERROR, SCHED_MESSAGE, ...templateWithoutError } = USER_TEMPLATE
        const xml = jsonToXml({ ...templateWithoutError })

        return handleDismissError(ID, xml)
      })

      await Promise.all(promises)
      setIsFetching(false)
    }
  }, [vmErrors])

  if (!handleDismissError || !vmErrors.length) {
    return ''
  }

  return (
    <TranslateProvider>
      <SubmitButton
        data-cy="clear-vms-errors"
        icon={<WarningIcon />}
        tooltip={Tr(T.VmsClearErrors)}
        isSubmitting={isFetching}
        onClick={handleClearErrors}
      />
    </TranslateProvider>
  )
})

ButtonClearErrors.propTypes = {
  tags: PropTypes.array,
  handleDismissError: PropTypes.func,
}
ButtonClearErrors.displayName = 'ButtonClearErrors'
