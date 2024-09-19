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
import { jsonToXml } from 'client/models/Helper'
import PropTypes from 'prop-types'
import { memo, useCallback, useMemo } from 'react'

import { DatastoreCard } from 'client/components/Cards'
import api, {
  useUpdateDatastoreMutation,
} from 'client/features/OneApi/datastore'

const Row = memo(
  ({ original, value, onClickLabel, zone, headerList, ...props }) => {
    const [update] = useUpdateDatastoreMutation()
    const {
      data: datastores,
      error,
      isLoading,
    } = api.endpoints.getDatastores.useQueryState({ zone })

    const selectedDatastore = useMemo(
      () =>
        datastores?.find((datastore) => +datastore.ID === +original.ID) ??
        original,
      [datastores, original]
    )

    const memoDs = useMemo(
      () => selectedDatastore ?? original,
      [selectedDatastore, original, update, isLoading, error, datastores]
    )

    const handleDeleteLabel = useCallback(
      (label) => {
        const currentLabels = memoDs.TEMPLATE?.LABELS?.split(',')
        const newLabels = currentLabels.filter((l) => l !== label).join(',')
        const newDsTemplate = { ...memoDs.TEMPLATE, LABELS: newLabels }
        const templateXml = jsonToXml(newDsTemplate)

        update({ id: original.ID, template: templateXml, replace: 0 })
      },
      [memoDs.TEMPLATE?.LABELS, update]
    )

    return (
      <DatastoreCard
        datastore={memoDs ?? original}
        onClickLabel={onClickLabel}
        onDeleteLabel={handleDeleteLabel}
        rootProps={props}
      />
    )
  },
  (prev, next) => prev.className === next.className
)

Row.propTypes = {
  original: PropTypes.object,
  value: PropTypes.object,
  onClickLabel: PropTypes.func,
  zone: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  headerList: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
}

Row.displayName = 'DatastoreRow'

export default Row
