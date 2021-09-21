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
import Template from 'client/components/Forms/Provider/CreateForm/Steps/Template'
import BasicConfiguration from 'client/components/Forms/Provider/CreateForm/Steps/BasicConfiguration'
import Connection from 'client/components/Forms/Provider/CreateForm/Steps/Connection'
import { createSteps, deepmerge } from 'client/utils'

const Steps = createSteps(stepProps => {
  const { isUpdate } = stepProps

  return [
    !isUpdate && Template,
    BasicConfiguration,
    Connection
  ].filter(Boolean)
}, {
  transformBeforeSubmit: formData => {
    const { template, configuration, connection } = formData
    const templateSelected = template?.[0]

    return deepmerge(templateSelected, { ...configuration, connection })
  }
})

export default Steps
