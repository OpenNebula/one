/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { INPUT_TYPES, T, MARKET_TYPES } from 'client/constants'
import { boolean } from 'yup'
import { Field } from 'client/utils'

/** @type {Field} SSL field */
const SSL = {
  name: 'SSL',
  label: T['marketplace.form.configuration.dockerRegistry.ssl'],
  tooltip: T['marketplace.form.configuration.dockerRegistry.ssl.tooltip'],
  type: INPUT_TYPES.SWITCH,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) =>
    type !== MARKET_TYPES.DOCKER_REGISTRY.value && INPUT_TYPES.HIDDEN,
  validation: boolean()
    .yesOrNo()
    .afterSubmit((value, { context }) => {
      if (context?.general?.MARKET_MAD === MARKET_TYPES.DOCKER_REGISTRY.value) {
        return value ? 'YES' : 'NO'
      } else {
        return undefined
      }
    }),
  grid: { xs: 12, md: 6 },
}

const FIELDS = [SSL]

export { FIELDS }
