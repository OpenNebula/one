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
import { useMemo } from 'react'
// import { useHistory } from 'react-router-dom'
import { RefreshDouble } from 'iconoir-react'

import { useAuth } from 'client/features/Auth'
import { useMarketplaceAppApi } from 'client/features/One'
import { Translate } from 'client/components/HOC'

import { createActions } from 'client/components/Tables/Enhanced/Utils'
// import { PATH } from 'client/apps/sunstone/routesOne'
import { T, MARKETPLACE_APP_ACTIONS } from 'client/constants'

const MessageToConfirmAction = rows => {
  const names = rows?.map?.(({ original }) => original?.NAME)

  return (
    <>
      <p>
        <Translate word={T.Apps} />
        {`: ${names.join(', ')}`}
      </p>
      <p>
        <Translate word={T.DoYouWantProceed} />
      </p>
    </>
  )
}

MessageToConfirmAction.displayName = 'MessageToConfirmAction'

const Actions = () => {
  const { view, getResourceView } = useAuth()
  const { getMarketplaceApps } = useMarketplaceAppApi()

  const marketplaceAppActions = useMemo(() => createActions({
    filters: getResourceView('MARKETPLACE-APP')?.actions,
    actions: [
      {
        accessor: MARKETPLACE_APP_ACTIONS.REFRESH,
        tooltip: T.Refresh,
        icon: RefreshDouble,
        action: async () => {
          await getMarketplaceApps()
        }
      }
      /* {
        accessor: MARKETPLACE_APP_ACTIONS.CREATE_DIALOG,
        tooltip: T.CreateMarketApp,
        icon: AddSquare,
        action: () => {
          const path = PATH.STORAGE.MARKETPLACE_APPS.CREATE

          history.push(path)
        }
      } */
    ]
  }), [view])

  return marketplaceAppActions
}

export default Actions
