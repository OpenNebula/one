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

import vmTemplateApi, {
  useUpdateTemplateMutation,
} from 'client/features/OneApi/vmTemplate'
import { VmTemplateCard } from 'client/components/Cards'
import { jsonToXml } from 'client/models/Helper'

const Row = memo(
  ({ original, value, onClickLabel, ...props }) => {
    const [update] = useUpdateTemplateMutation()

    const state = vmTemplateApi.endpoints.getTemplates.useQueryState(
      undefined,
      {
        selectFromResult: ({ data = [] }) =>
          data.find((template) => +template.ID === +original.ID),
      }
    )

    const memoTemplate = useMemo(() => state ?? original, [state, original])

    const handleDeleteLabel = useCallback(
      (label) => {
        const currentLabels = memoTemplate.TEMPLATE?.LABELS?.split(',')
        const newLabels = currentLabels.filter((l) => l !== label).join(',')
        const newUserTemplate = { ...memoTemplate.TEMPLATE, LABELS: newLabels }
        const templateXml = jsonToXml(newUserTemplate)

        update({ id: original.ID, template: templateXml, replace: 0 })
      },
      [memoTemplate.TEMPLATE?.LABELS, update]
    )

    return (
      <VmTemplateCard
        template={memoTemplate}
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

Row.displayName = 'VmTemplateRow'

export default Row
