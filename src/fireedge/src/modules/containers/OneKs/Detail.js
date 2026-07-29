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
import { LoadingDisplay } from '@ResourcesModule'

import { ReactElement, useMemo } from 'react'
import { Redirect, useHistory, useParams } from 'react-router-dom'
import { PATH, RESOURCE_NAMES } from '@ConstantsModule'
import { OneKsAPI, useViews } from '@FeaturesModule'
import { SingleView } from '@modules/containers/OneKs/Details/single'

/**
 * Displays the detail information about a Cluster.
 *
 * @returns {ReactElement} Cluster detail component.
 */
export function OneKsDetail() {
  const { id } = useParams()
  const history = useHistory()
  const { getResourceView } = useViews()
  const availableActions = useMemo(
    () => getResourceView(RESOURCE_NAMES.ONEKS)?.actions ?? {},
    [getResourceView]
  )

  const { data = {}, isFetching } = OneKsAPI.useGetOneKsClusterQuery({
    id,
    expand: true,
  })

  if (Number.isNaN(+id)) {
    return <Redirect to="/" />
  }

  const selectedData = data?.DOCUMENT ?? {}

  return (
    <>
      {isFetching && !selectedData?.ID ? (
        <LoadingDisplay />
      ) : (
        <SingleView
          isOpen
          selectedData={selectedData}
          availableActions={availableActions}
          handleClose={() => history.push(PATH.ONEKS.LIST)}
        />
      )}
    </>
  )
}
