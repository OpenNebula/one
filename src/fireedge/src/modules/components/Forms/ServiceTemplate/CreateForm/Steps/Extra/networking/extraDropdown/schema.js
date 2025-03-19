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
import { array, object, mixed } from 'yup'

import { SCHEMA as ADDRESS_RANGE_SCHEMA } from '@modules/components/Forms/VNetwork/AddRangeForm/schema'

import {
  AR,
  SG,
} from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/extraDropdown/sections'

export const NETWORKS_EXTRA_SCHEMA = object().shape({
  [AR.id]: array().of(ADDRESS_RANGE_SCHEMA()),
  [SG.id]: array().of(mixed()), // Should be updated to a real schema
})
