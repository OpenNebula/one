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
import Cluster, { STEP_ID as CLUSTER_ID } from './ClustersTable'
import General, { STEP_ID as GENERAL_ID } from './General'
import ConfigurationAttributes, {
  STEP_ID as CONF_ID,
} from './ConfigurationAttributes'
import CustomVariables, {
  STEP_ID as CUSTOM_VARIABLES_ID,
} from './CustomVariables'

import {
  DATASTORE_TYPES,
  DATASTORE_OPTIONS,
  TRANSFER_OPTIONS,
  DS_STORAGE_BACKENDS,
  DISK_TYPES_BY_STORAGE_BACKEND,
} from 'client/constants'

import { createSteps } from 'client/utils'

function getDsAndTMMad({
  STORAGE_BACKEND,
  DS_MAD,
  TM_MAD,
  CUSTOM_DS_MAD,
  CUSTOM_TM_MAD,
} = {}) {
  let dsMad
  let tmMad = ''

  if (STORAGE_BACKEND === DS_STORAGE_BACKENDS.CUSTOM.value) {
    if (DS_MAD === DATASTORE_OPTIONS.CUSTOM.value) {
      dsMad = CUSTOM_DS_MAD
    } else {
      dsMad = DS_MAD
    }

    if (TM_MAD === TRANSFER_OPTIONS.CUSTOM.value) {
      tmMad = CUSTOM_TM_MAD
    } else {
      tmMad = TM_MAD
    }
  } else {
    const storageBackend = STORAGE_BACKEND.split('-')
    dsMad = storageBackend[0]
    tmMad = storageBackend[1]
  }

  return [dsMad, tmMad]
}

const Steps = createSteps(
  [General, Cluster, ConfigurationAttributes, CustomVariables],
  {
    transformBeforeSubmit: (formData) => {
      const {
        [GENERAL_ID]: {
          NAME,
          TYPE,
          STORAGE_BACKEND,
          DS_MAD,
          TM_MAD,
          CUSTOM_DS_MAD,
          CUSTOM_TM_MAD,
        } = {},
        [CLUSTER_ID]: [cluster] = [],
        [CONF_ID]: {
          RESTRICTED_DIRS,
          SAFE_DIRS,
          BRIDGE_LIST,
          CEPH_HOST,
          BACKUP_IONICE,
          BACKUP_NICE,
          BACKUP_MAX_RIOPS,
          BACKUP_MAX_WIOPS,
          BACKUP_CPU_QUOTA,
          COMPATIBLE_SYSTEM_DATASTORES,
          ...restConf
        } = {},
        [CUSTOM_VARIABLES_ID]: customVariables = {},
      } = formData ?? {}

      const [dsMad, tmMad] = getDsAndTMMad({
        STORAGE_BACKEND,
        DS_MAD,
        TM_MAD,
        CUSTOM_DS_MAD,
        CUSTOM_TM_MAD,
      })

      const diskType = DISK_TYPES_BY_STORAGE_BACKEND[STORAGE_BACKEND]

      const dsMadValue =
        TYPE === DATASTORE_TYPES.SYSTEM.value ? undefined : dsMad

      const restrictedDirs =
        RESTRICTED_DIRS?.length > 0 ? RESTRICTED_DIRS.join(' ') : undefined

      const safeDirs = SAFE_DIRS?.length > 0 ? SAFE_DIRS.join(' ') : undefined

      const bridgeList =
        BRIDGE_LIST?.length > 0 ? BRIDGE_LIST.join(' ') : undefined

      const compatibleSysDs =
        COMPATIBLE_SYSTEM_DATASTORES?.length > 0
          ? COMPATIBLE_SYSTEM_DATASTORES.join(',')
          : undefined

      const cephHost = CEPH_HOST?.length > 0 ? CEPH_HOST.join(',') : undefined

      const dsObject = {
        template: {
          NAME,
          TYPE,
          DS_MAD: dsMadValue,
          TM_MAD: tmMad,
          RESTRICTED_DIRS: restrictedDirs,
          SAFE_DIRS: safeDirs,
          BRIDGE_LIST: bridgeList,
          COMPATIBLE_SYS_DS: compatibleSysDs,
          CEPH_HOST: cephHost,
          DISK_TYPE: diskType,
          ...restConf,
          ...customVariables,
        },
        cluster: cluster.ID,
      }

      return dsObject
    },
  }
)

export default Steps
