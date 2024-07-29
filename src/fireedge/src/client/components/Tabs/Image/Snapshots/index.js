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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Stack } from '@mui/material'
import { T } from 'client/constants'
import { useGetImageQuery } from 'client/features/OneApi/image'
import EmptyTab from 'client/components/Tabs/EmptyTab'
import ImageSnapshotCard from 'client/components/Cards/ImageSnapshotCard'
import {
  SnapshotFlattenAction,
  SnapshotDeleteAction,
  SnapshotRevertAction,
} from 'client/components/Tabs/Image/Snapshots/Actions'

import { getSnapshots } from 'client/models/Image'

/**
 * Renders the list of disks from a VM.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string[]} props.tabProps.actions - Actions tab
 * @param {string} props.id - Image id
 * @returns {ReactElement} Storage tab
 */
const ImageStorageTab = ({ tabProps: { actions } = {}, id }) => {
  const { data: image = {} } = useGetImageQuery({ id })

  const [snapshots] = useMemo(() => [getSnapshots(image)], [image])

  return (
    <div>
      <Stack gap="1em" py="0.8em">
        {snapshots.length ? (
          snapshots?.map?.((snapshot) => (
            <ImageSnapshotCard
              key={snapshot.ID}
              snapshot={snapshot}
              actions={() => (
                <>
                  {actions.snapshot_flatten && (
                    <SnapshotFlattenAction id={id} snapshot={snapshot} />
                  )}
                  {actions.snapshot_revert && (
                    <SnapshotRevertAction id={id} snapshot={snapshot} />
                  )}
                  {actions.snapshot_delete && (
                    <SnapshotDeleteAction id={id} snapshot={snapshot} />
                  )}
                </>
              )}
            />
          ))
        ) : (
          <EmptyTab label={T.NotSnapshotCurrently} />
        )}
      </Stack>
    </div>
  )
}

ImageStorageTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

ImageStorageTab.displayName = 'ImageStorageTab'

export default ImageStorageTab
