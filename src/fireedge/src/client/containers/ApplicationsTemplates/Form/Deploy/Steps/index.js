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
/* eslint-disable jsdoc/require-jsdoc */
import * as yup from 'yup'

import BasicConfiguration from './BasicConfiguration'
import Networking, { STEP_ID as NETWORKING_ID } from './Networking'
import Tiers, { STEP_ID as TIERS_ID } from './Tiers'

const Steps = ({ applicationTemplate = {}, vmTemplates }) => {
  const { [TIERS_ID]: appTiers, [NETWORKING_ID]: appNetworking } =
    applicationTemplate

  const basic = BasicConfiguration()
  const tiers = Tiers({ tiers: appTiers, vmTemplates })
  const networking = Networking()

  const steps = [basic, tiers]
  appNetworking?.length > 0 && steps.push(networking)

  const resolvers = () =>
    yup.object(
      steps.reduce(
        (res, step) => ({
          ...res,
          [step.id]: step.resolver,
        }),
        {}
      )
    )

  const defaultValues = resolvers().default()

  return { steps, defaultValues, resolvers }
}

export default Steps
