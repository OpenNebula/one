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
import { useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import NodeMenu from './Node/NodeMenu'
import Canvas from './Node/Canvas'

import { LoadingDisplay } from 'client/components/LoadingState'
import { SCHEMA } from 'client/components/Forms/VRTemplate/InstantiateForm/Steps/UserInputs/schema'
import { T, UserInputObject } from 'client/constants'
import { useFormContext } from 'react-hook-form'
import { STEP_ID as TEMPLATE_SELECTION_ID } from 'client/components/Forms/VRTemplate/InstantiateForm/Steps/TemplateSelection'
import { useLazyGetVRouterTemplateQuery } from 'client/features/OneApi/vrouterTemplate'
import { userInputsToArray } from 'client/models/Helper'

export const STEP_ID = 'user_inputs'

const Content = ({ userInputs }) => {
  const { getValues } = useFormContext()

  let TEMPLATEID
  if (!userInputs?.length) {
    if (getValues) {
      TEMPLATEID = getValues(TEMPLATE_SELECTION_ID)?.vmTemplate
    }
  }

  const [getVRouterTemplate, { data: template, isLoading, error }] =
    useLazyGetVRouterTemplateQuery()

  const templateIdNumber = parseInt(TEMPLATEID, 10) ?? -1

  useEffect(() => {
    if (!isNaN(templateIdNumber) && templateIdNumber !== -1) {
      getVRouterTemplate({
        id: templateIdNumber,
        extended: false,
        decrypt: true,
      })
    }
  }, [templateIdNumber])

  const fetchedUserInputs = useMemo(
    () =>
      userInputsToArray(template?.TEMPLATE?.USER_INPUTS, {
        order: template?.TEMPLATE?.INPUTS_ORDER,
      }),
    [template]
  )

  if (!userInputs?.length && (isLoading || !fetchedUserInputs?.length)) {
    return (
      <LoadingDisplay
        error={error}
        isEmpty={!fetchedUserInputs?.length && !userInputs?.length}
      />
    )
  }

  return (
    <Canvas
      columns={[
        <NodeMenu
          userInputs={userInputs?.length ? userInputs : fetchedUserInputs || []}
          key={`SubNodeMenu-${userInputs?.length ?? 0}`}
        />,
      ]}
    />
  )
}

Content.propTypes = {
  userInputs: PropTypes.array,
}

/**
 * User inputs step.
 *
 * @param {UserInputObject[]} userInputs - User inputs
 * @returns {object} User inputs step
 */
const UserInputsStep = (userInputs) => ({
  id: STEP_ID,
  label: T.UserInputs,
  optionsValidate: { abortEarly: false },
  resolver: SCHEMA(userInputs),
  content: (props) => Content({ ...props, userInputs }),
})

export default UserInputsStep
