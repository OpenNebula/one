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
import { memo, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import secGroupApi, {
  useUpdateSecGroupMutation,
} from 'client/features/OneApi/securityGroup'
import { SecurityGroupCard } from 'client/components/Cards'
import { jsonToXml } from 'client/models/Helper'

const Row = memo(
  ({ original, value, onClickLabel, ...props }) => {
    const [update] = useUpdateSecGroupMutation()

    const {
      data: secgroups,
      error,
      isLoading,
    } = secGroupApi.endpoints.getSecGroups.useQuery(undefined)

    const secGroup = useMemo(
      () => secgroups?.find((sg) => +sg.ID === +original.ID) ?? original,
      [secgroups, original]
    )

    const memoSecGroup = useMemo(
      () => secGroup ?? original,
      [secGroup, original, update, isLoading, error, secgroups]
    )

    const handleDeleteLabel = useCallback(
      (label) => {
        const currentLabels = memoSecGroup.TEMPLATE?.LABELS?.split(',')
        const newLabels = currentLabels.filter((l) => l !== label).join(',')
        const newSecGroupTemplate = {
          ...memoSecGroup.TEMPLATE,
          LABELS: newLabels,
        }
        const templateXml = jsonToXml(newSecGroupTemplate)

        update({ id: original.ID, template: templateXml, replace: 0 })
      },
      [memoSecGroup.TEMPLATE?.LABELS, update]
    )

    return (
      <SecurityGroupCard
        securityGroup={memoSecGroup}
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
  handleClick: PropTypes.func,
  onClickLabel: PropTypes.func,
}

Row.displayName = 'SecurityGroupRow'

export default Row
