/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import * as yup from 'yup'

import VmTemplatesTable, { STEP_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/VmTemplatesTable'
import BasicConfiguration from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration'
import ExtraConfiguration from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration'

const Steps = initialValues => {
  const { [STEP_ID]: initialTemplate } = initialValues ?? {}

  const steps = [
    BasicConfiguration(),
    ExtraConfiguration()
  ]

  !initialTemplate?.ID && steps.unshift(VmTemplatesTable())

  const schema = {}
  for (const { id, resolver } of steps) {
    schema[id] = typeof resolver === 'function' ? resolver() : resolver
  }

  const resolvers = () => yup.object(schema)

  const defaultValues = initialTemplate?.ID
    ? resolvers().cast(initialValues, { stripUnknown: true })
    : resolvers().default()

  return { steps, defaultValues, resolvers }
}

export default Steps
