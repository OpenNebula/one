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
import { string } from 'yup'

import { INPUT_TYPES, HYPERVISORS } from 'client/constants'

const { vcenter, ...hypervisors } = HYPERVISORS

const VCENTER_FOLDER_FIELD = {
  name: 'VCENTER_VM_FOLDER',
  label: 'vCenter VM Folder',
  tooltip: `
    If specified, the the VMs and Template folder path where
    the VM will be created inside the data center.
    The path is delimited by slashes (e.g /Management/VMs).
    If no path is set the VM will be placed in the same folder where the template is located.
  `,
  notOnHypervisors: Object.values(hypervisors),
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(undefined),
  grid: { md: 12 }
}

export const FIELDS = [VCENTER_FOLDER_FIELD]
