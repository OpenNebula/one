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
import Clusters from './Clusters'
import Networking from './Networking'
import Tiers from './Tiers'

const Steps = () => {
  const basic = BasicConfiguration()
  const clusters = Clusters()
  const networking = Networking()
  const tiers = Tiers()

  const steps = [basic, clusters, networking, tiers]

  const resolvers = () =>
    yup.object({
      [basic.id]: basic.resolver,
      [clusters.id]: clusters.resolver,
      [networking.id]: networking.resolver,
      [tiers.id]: tiers.resolver,
    })

  const defaultValues = resolvers().default()

  return { steps, defaultValues, resolvers }
}

export default Steps
