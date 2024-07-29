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
import PropTypes from 'prop-types'
import { memo, useCallback, useMemo } from 'react'

import { BackupJobCard } from 'client/components/Cards'
import backupjobApi, {
  useUpdateBackupJobMutation,
} from 'client/features/OneApi/backupjobs'
import { jsonToXml } from 'client/models/Helper'

const Row = memo(
  ({ original, value, onClickLabel, ...props }) => {
    const [update] = useUpdateBackupJobMutation()

    const state = backupjobApi.endpoints.getBackupJobs.useQueryState(
      undefined,
      {
        selectFromResult: ({ data = [] }) =>
          data.find((backupjob) => +backupjob.ID === +original.ID),
      }
    )

    const memoBackupJob = useMemo(() => state ?? original, [state, original])

    const handleDeleteLabel = useCallback(
      (label) => {
        const currentLabels = memoBackupJob.TEMPLATE?.LABELS?.split(',')
        const newLabels = currentLabels.filter((l) => l !== label).join(',')
        const newUserTemplate = { ...memoBackupJob.TEMPLATE, LABELS: newLabels }
        const templateXml = jsonToXml(newUserTemplate)

        update({ id: original.ID, template: templateXml, replace: 0 })
      },
      [memoBackupJob.TEMPLATE?.LABELS, update]
    )

    return (
      <BackupJobCard
        template={memoBackupJob}
        rootProps={props}
        onClickLabel={onClickLabel}
        onDeleteLabel={handleDeleteLabel}
      />
    )
  },
  (prev, next) => prev.className === next.className
)

Row.propTypes = {
  original: PropTypes.object,
  value: PropTypes.object,
  isSelected: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
  onClickLabel: PropTypes.func,
}

Row.displayName = 'VirtualDataCenterRow'

export default Row
