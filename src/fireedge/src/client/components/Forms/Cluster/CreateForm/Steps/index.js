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
import General, {
  STEP_ID as GENERAL_ID,
} from 'client/components/Forms/Cluster/CreateForm/Steps/General'

import Hosts, {
  STEP_ID as HOSTS_ID,
} from 'client/components/Forms/Cluster/CreateForm/Steps/Hosts'

import Vnets, {
  STEP_ID as VNETS_ID,
} from 'client/components/Forms/Cluster/CreateForm/Steps/Vnets'

import Datastores, {
  STEP_ID as DATASTORES_ID,
} from 'client/components/Forms/Cluster/CreateForm/Steps/Datastores'

import { createSteps } from 'client/utils'
const _ = require('lodash')

/**
 * Create steps for Cluster Create Form:
 * 1. General: Name of the cluster
 * 2. Hosts: Select hosts
 * 3. Vnets: Select virtual networks
 * 4. Datastores: Select datastores
 */
const Steps = createSteps([General, Hosts, Vnets, Datastores], {
  transformInitialValue: (cluster, schema) => {
    const knownTemplate = schema.cast(
      {
        [GENERAL_ID]: { NAME: cluster.NAME },
        [HOSTS_ID]: !_.isEmpty(cluster?.HOSTS)
          ? {
              ID: Array.isArray(cluster?.HOSTS?.ID)
                ? cluster?.HOSTS?.ID
                : [cluster?.HOSTS?.ID],
            }
          : undefined,
        [VNETS_ID]: !_.isEmpty(cluster?.VNETS)
          ? {
              ID: Array.isArray(cluster?.VNETS?.ID)
                ? cluster?.VNETS?.ID
                : [cluster?.VNETS?.ID],
            }
          : undefined,
        [DATASTORES_ID]: !_.isEmpty(cluster?.DATASTORES)
          ? {
              ID: Array.isArray(cluster?.DATASTORES?.ID)
                ? cluster?.DATASTORES?.ID
                : [cluster?.DATASTORES?.ID],
            }
          : undefined,
      },
      {
        stripUnknown: true,
      }
    )

    return knownTemplate
  },
  transformBeforeSubmit: (formData, initialValues) => {
    const update = !!initialValues

    if (update) {
      // Get hosts to add and hosts to delete
      const initialHosts = !_.isEmpty(initialValues?.HOSTS?.ID)
        ? Array.isArray(initialValues?.HOSTS?.ID)
          ? initialValues?.HOSTS?.ID
          : [initialValues?.HOSTS?.ID]
        : undefined
      const addHosts = _.difference(formData?.hosts?.ID, initialHosts)
      const removeHosts = _.difference(initialHosts, formData?.hosts?.ID)

      // Get vnets to add and vnets to delete
      const initialVnets = !_.isEmpty(initialValues?.VNETS?.ID)
        ? Array.isArray(initialValues?.VNETS?.ID)
          ? initialValues?.VNETS?.ID
          : [initialValues?.VNETS?.ID]
        : undefined
      const addVnets = _.difference(formData?.vnets?.ID, initialVnets)
      const removeVnets = _.difference(initialVnets, formData?.vnets?.ID)

      // Get datastores to add and datastores to delete
      const initialDatastores = !_.isEmpty(initialValues?.DATASTORES?.ID)
        ? Array.isArray(initialValues?.DATASTORES?.ID)
          ? initialValues?.DATASTORES?.ID
          : [initialValues?.DATASTORES?.ID]
        : undefined
      const addDatastores = _.difference(
        formData?.datastores?.ID,
        initialDatastores
      )
      const removeDatastores = _.difference(
        initialDatastores,
        formData?.datastores?.ID
      )

      // Check if the name has been changed
      const changeName = initialValues?.NAME !== formData?.general?.NAME

      return {
        ...formData,
        addHosts,
        removeHosts,
        addVnets,
        removeVnets,
        addDatastores,
        removeDatastores,
        changeName,
      }
    }

    return formData
  },
})

export default Steps
