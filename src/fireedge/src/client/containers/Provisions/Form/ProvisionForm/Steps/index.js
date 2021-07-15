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

import Template from './Template'
import Provider from './Provider'
import BasicConfiguration from './BasicConfiguration'
import Inputs from './Inputs'

const Steps = () => {
  const template = Template()
  const provider = Provider()
  const configuration = BasicConfiguration()
  const inputs = Inputs()

  const steps = [template, provider, configuration, inputs]

  const resolvers = () => yup
    .object({
      [template.id]: template.resolver(),
      [provider.id]: provider.resolver(),
      [configuration.id]: configuration.resolver(),
      [inputs.id]: inputs.resolver()
    })

  const defaultValues = resolvers().default()

  return { steps, defaultValues, resolvers }
}

export default Steps
