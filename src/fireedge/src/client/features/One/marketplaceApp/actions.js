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
import { marketplaceAppService } from 'client/features/One/marketplaceApp/services'
import { RESOURCES } from 'client/features/One/slice'

/** @see {@link RESOURCES.app}  */
const APP = 'app'

export const getMarketplaceApp = createAction(
  `${APP}/detail`,
  marketplaceAppService.getMarketplaceApp
)

export const getMarketplaceApps = createAction(
  `${APP}/pool`,
  marketplaceAppService.getMarketplaceApps,
  response => ({ [RESOURCES.app]: response })
)
