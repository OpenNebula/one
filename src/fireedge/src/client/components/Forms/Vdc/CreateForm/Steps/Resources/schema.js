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
import { object, ObjectSchema } from 'yup'

import { SCHEMA as CLUSTER_SCHEMA } from './ClustersTable/schema'
import { SCHEMA as DATASTORE_SCHEMA } from './DatastoresTable/schema'
import { SCHEMA as HOST_SCHEMA } from './HostsTable/schema'
import { SCHEMA as NETWORK_SCHEMA } from './VnetsTable/schema'
import { SCHEMA as ZONES_SCHEMA } from './ZonesSelect/schema'

/**
 * @param {Array[Object]} zones - Zones objects
 * @returns {ObjectSchema} Extra configuration schema
 */
export const SCHEMA = (zones = []) =>
  object()
    .concat(ZONES_SCHEMA(zones))
    .concat(CLUSTER_SCHEMA(zones))
    .concat(DATASTORE_SCHEMA(zones))
    .concat(HOST_SCHEMA(zones))
    .concat(NETWORK_SCHEMA(zones))
