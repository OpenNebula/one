/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { useSelector, shallowEqual } from 'react-redux'
import { name } from 'client/features/One/slice'

export const useOne = () => useSelector((state) => state[name], shallowEqual)

export * from 'client/features/One/application/hooks'
export * from 'client/features/One/applicationTemplate/hooks'
export * from 'client/features/One/cluster/hooks'
export * from 'client/features/One/datastore/hooks'
export * from 'client/features/One/group/hooks'
export * from 'client/features/One/host/hooks'
export * from 'client/features/One/image/hooks'
export * from 'client/features/One/marketplace/hooks'
export * from 'client/features/One/marketplaceApp/hooks'
export * from 'client/features/One/provider/hooks'
export * from 'client/features/One/provision/hooks'
export * from 'client/features/One/system/hooks'
export * from 'client/features/One/user/hooks'
export * from 'client/features/One/vm/hooks'
export * from 'client/features/One/vmGroup/hooks'
export * from 'client/features/One/vmTemplate/hooks'
export * from 'client/features/One/vnetwork/hooks'
export * from 'client/features/One/vnetworkTemplate/hooks'
export * from 'client/features/One/vrouter/hooks'
export * from 'client/features/One/zone/hooks'
