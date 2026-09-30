/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { ResourceActionConfirmation } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { OneKsAPI, useModalsApi } from '@FeaturesModule'
import { useResourceSingleViewContext } from '@ProvidersModule'
import { OneKs as OneKsResource } from '@ResourcesModule'

/**
 * Fetches an installed application for the OneKS details stack.
 *
 * @param {object} props - Drawer properties
 * @param {object[]} props.selectedData - Selected application
 * @returns {ReactElement} Application details drawer
 */
export const DetailsDrawer = ({ selectedData = [] }) => {
  const selected = selectedData[0] ?? {}
  const { cluster_id: id, release_name: releaseName } = selected
  const { showModal } = useModalsApi()
  const { popResourceSingleView } = useResourceSingleViewContext()
  const [uninstall, { isLoading: isUninstalling }] =
    OneKsAPI.useDeleteOneKsClusterApplicationMutation()
  const {
    data: details,
    isFetching,
    isError,
    refetch,
  } = OneKsAPI.useGetOneKsClusterApplicationQuery(
    { id, release_name: releaseName },
    { skip: !id || !releaseName }
  )
  const handleUninstall = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.UninstallApplication,
        dataCy: 'modal-uninstall-oneks-application',
        description: (
          <ResourceActionConfirmation
            description={T.UninstallApplicationConfirmation}
            resources={{ name: releaseName }}
            resourceType={T.Applications}
          />
        ),
        confirmLabel: T.Uninstall,
        confirmButtonProps: { isDestructive: true },
      },
      onSubmit: async () => {
        await uninstall({ id, release_name: releaseName }).unwrap()
        popResourceSingleView()
      },
    })

  return (
    <OneKsResource.Details.Application
      isOpen={selectedData.length > 0}
      application={{ ...selected, ...details }}
      isFetching={isFetching}
      isError={isError}
      isUninstalling={isUninstalling}
      onRefresh={refetch}
      onUninstall={handleUninstall}
      onClose={popResourceSingleView}
    />
  )
}

DetailsDrawer.displayName = 'DetailsDrawer'
DetailsDrawer.propTypes = {
  selectedData: PropTypes.array,
}
