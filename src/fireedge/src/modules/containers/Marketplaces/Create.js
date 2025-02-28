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
import PropTypes from 'prop-types'
import { ReactElement } from 'react'
import { useHistory, useLocation } from 'react-router'

import { useGeneralApi, MarketplaceAPI, SystemAPI } from '@FeaturesModule'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
  Form,
  PATH,
  TranslateProvider,
} from '@ComponentsModule'
import { jsonToXml } from '@ModelsModule'

import { T } from '@ConstantsModule'
const { Marketplace } = Form

/**
 * Displays the creation form for a marketplace.
 *
 * @returns {ReactElement} - The marketplace form component
 */
export function CreateMarketplace() {
  const history = useHistory()
  const { state: { ID: marketplaceId } = {} } = useLocation()

  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [createMarketplace] = MarketplaceAPI.useAllocateMarketplaceMutation()
  const [updateMarketplace] = MarketplaceAPI.useUpdateMarketplaceMutation()
  const [renameMarketplace] = MarketplaceAPI.useRenameMarketplaceMutation()

  const { data: version } = SystemAPI.useGetOneVersionQuery()

  const { data: marketplace } = marketplaceId
    ? MarketplaceAPI.useGetMarketplaceQuery({ id: marketplaceId })
    : { data: undefined }

  const onSubmit = async (template) => {
    try {
      // Request to create a marketplace but not to update
      if (!marketplaceId) {
        // Create marketplace
        const newMarketplaceId = await createMarketplace({
          template: jsonToXml(template),
        }).unwrap()

        // Only show marketplace message
        enqueueSuccess(T.SuccessMarketplaceCreated, newMarketplaceId)
      } else {
        // Rename if the name has been changed
        if (template?.changeName) {
          await renameMarketplace({
            id: marketplaceId,
            name: template?.NAME,
          }).unwrap()
          delete template?.changeName
        }

        // Name in not on the template
        delete template?.NAME

        // Update marketplace
        await updateMarketplace({
          id: marketplaceId,
          template: jsonToXml(template),
        }).unwrap()

        // Only show marketplace message
        enqueueSuccess(T.SuccessMarketplaceUpdated, marketplaceId)
      }

      // Go to marketplaces list
      history.push(PATH.STORAGE.MARKETPLACES.LIST)
    } catch (error) {
      enqueueError(T.ErrorMarketplaceCreated)
    }
  }

  return (
    <TranslateProvider>
      {version && (!marketplaceId || (marketplaceId && marketplace)) ? (
        <Marketplace.CreateForm
          onSubmit={onSubmit}
          initialValues={marketplace}
          stepProps={{
            version,
            update: !!marketplaceId,
          }}
          fallback={<SkeletonStepsForm />}
        >
          {(config) => <DefaultFormStepper {...config} />}
        </Marketplace.CreateForm>
      ) : (
        <SkeletonStepsForm />
      )}
    </TranslateProvider>
  )
}

CreateMarketplace.propTypes = {
  marketplace: PropTypes.object,
  views: PropTypes.object,
  system: PropTypes.object,
}
