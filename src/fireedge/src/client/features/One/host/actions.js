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
import { createAction } from 'client/features/One/utils'
import { hostService } from 'client/features/One/host/services'
import { RESOURCES } from 'client/features/One/slice'

/** @see {@link RESOURCES.host}  */
const HOST = 'host'

export const getHost = createAction(`${HOST}/detail`, hostService.getHost)

export const getHosts = createAction(
  `${HOST}/pool`,
  hostService.getHosts,
  (response) => ({ [RESOURCES.host]: response })
)

export const allocate = createAction(`${HOST}/allocate`, hostService.allocate)
export const remove = createAction(`${HOST}/delete`, hostService.delete)
export const enable = createAction(`${HOST}/enable`, hostService.enable)
export const disable = createAction(`${HOST}/disable`, hostService.disable)
export const offline = createAction(`${HOST}/offline`, hostService.offline)
export const update = createAction(`${HOST}/update`, hostService.update)
export const rename = createAction(`${HOST}/rename`, hostService.rename)
export const monitoring = createAction(
  `${HOST}/monitoring`,
  hostService.monitoring
)
export const monitoringPool = createAction(
  `${HOST}/monitoring-pool`, // ends with "-pool" to differentiate with resource pool
  hostService.monitoringPool
)
