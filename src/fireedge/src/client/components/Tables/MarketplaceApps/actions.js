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
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import {
  AddCircledOutline,
  CloudDownload,
  DownloadCircledOutline,
} from 'iconoir-react'

import { useViews } from 'client/features/Auth'
import { useGeneralApi } from 'client/features/General'
import { Translate } from 'client/components/HOC'
import {
  useExportAppMutation,
  useDownloadAppMutation,
} from 'client/features/OneApi/marketplaceApp'

import { ExportForm } from 'client/components/Forms/MarketplaceApp'
import {
  createActions,
  GlobalAction,
} from 'client/components/Tables/Enhanced/Utils'

import { PATH } from 'client/apps/sunstone/routesOne'
import { T, RESOURCE_NAMES, MARKETPLACE_APP_ACTIONS } from 'client/constants'

const MessageToConfirmAction = (rows) => {
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

/**
 * Generates the actions to operate resources on Host table.
 *
 * @returns {GlobalAction} - Actions
 */
const Actions = () => {
  const history = useHistory()
  const { view, getResourceView } = useViews()
  const { enqueueSuccess } = useGeneralApi()
  const [exportApp] = useExportAppMutation()
  const [downloadApp] = useDownloadAppMutation()

  const marketplaceAppActions = useMemo(
    () =>
      createActions({
        filters: getResourceView(RESOURCE_NAMES.APP)?.actions,
        actions: [
          {
            accessor: MARKETPLACE_APP_ACTIONS.CREATE_DIALOG,
            tooltip: T.CreateMarketApp,
            icon: AddCircledOutline,
            action: () => {
              history.push(PATH.STORAGE.MARKETPLACE_APPS.CREATE)
            },
          },
          {
            accessor: MARKETPLACE_APP_ACTIONS.EXPORT,
            tooltip: T.ImportIntoDatastore,
            selected: { max: 1 },
            icon: CloudDownload,
            options: [
              {
                dialogProps: {
                  title: T.DownloadAppToOpenNebula,
                  dataCy: 'modal-export',
                },
                form: (rows) => {
                  const app = rows?.map(({ original }) => original)[0]

                  return ExportForm({ initialValues: app, stepProps: app })
                },
                onSubmit: (rows) => async (formData) => {
                  const id = rows?.[0]?.original?.ID
                  const res = await exportApp({ id, ...formData }).unwrap()
                  enqueueSuccess(res)
                },
              },
            ],
          },
          {
            accessor: MARKETPLACE_APP_ACTIONS.DOWNLOAD,
            tooltip: T.DownloadApp,
            selected: { min: 1 },
            icon: DownloadCircledOutline,
            action: async (apps) => {
              const urls = await Promise.all(
                apps.map(({ id }) => downloadApp(id).unwrap())
              )
              urls.forEach((url) => window.open(url, '_blank'))
            },
          },
        ],
      }),
    [view]
  )

  return marketplaceAppActions
}

export default Actions
