/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { array, string } from 'yup'

import {
  DEFAULT_CPU_MODELS,
  HYPERVISORS,
  INPUT_TYPES,
  T,
} from '@ConstantsModule'
import { HostAPI } from '@FeaturesModule'
import { getKvmCpuFeatures, getKvmCpuModels } from '@ModelsModule'
import { Field, arrayToOptions } from '@UtilsModule'

const { lxc } = HYPERVISORS

/** @type {Field} CPU model field */
export const MODEL = {
  name: 'CPU_MODEL.MODEL',
  label: T.CpuModel,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () => {
    const { data: hosts = [] } = HostAPI.useGetHostsQuery()
    const kvmCpuModels = getKvmCpuModels(hosts)
    kvmCpuModels.unshift(...DEFAULT_CPU_MODELS)

    return arrayToOptions(kvmCpuModels)
  },
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

/** @type {Field} Features field */
export const FEATURES = {
  name: 'CPU_MODEL.FEATURES',
  label: T.CpuFeature,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  multiple: true,
  values: () => {
    const { data: hosts = [] } = HostAPI.useGetHostsQuery()
    const kvmFeatures = getKvmCpuFeatures(hosts)

    return arrayToOptions(kvmFeatures, { addEmpty: false })
  },
  validation: array(string().trim()).default(() => []),
}

/** @type {Field[]} List of CPU_MODEL fields */
export const CPU_MODEL_FIELDS = [MODEL, FEATURES]
