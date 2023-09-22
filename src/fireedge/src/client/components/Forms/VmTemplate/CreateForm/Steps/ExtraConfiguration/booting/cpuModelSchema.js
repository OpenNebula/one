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
import { array, string } from 'yup'

import {
  DEFAULT_CPU_MODELS,
  HYPERVISORS,
  INPUT_TYPES,
  T,
} from 'client/constants'
import { useGetHostsQuery } from 'client/features/OneApi/host'
import { getKvmCpuFeatures, getKvmCpuModels } from 'client/models/Host'
import { Field, arrayToOptions } from 'client/utils'

const { vcenter, firecracker, lxc } = HYPERVISORS

/** @type {Field} CPU model field */
export const MODEL = {
  name: 'CPU_MODEL.MODEL',
  label: T.CpuModel,
  notOnHypervisors: [vcenter, firecracker, lxc],
  type: INPUT_TYPES.SELECT,
  values: () => {
    const { data: hosts = [] } = useGetHostsQuery()
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
  notOnHypervisors: [vcenter, firecracker, lxc],
  type: INPUT_TYPES.SELECT,
  multiple: true,
  values: () => {
    const { data: hosts = [] } = useGetHostsQuery()
    const kvmFeatures = getKvmCpuFeatures(hosts)

    return arrayToOptions(kvmFeatures)
  },
  validation: array(string().trim()).default(() => []),
}

/** @type {Field[]} List of CPU_MODEL fields */
export const CPU_MODEL_FIELDS = [MODEL, FEATURES]
