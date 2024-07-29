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

import serviceTemplateApi, {
  useUpdateServiceTemplateMutation,
} from 'client/features/OneApi/serviceTemplate'
import { ServiceTemplateCard } from 'client/components/Cards'

const Row = memo(
  ({ original, value, ...props }) => {
    const [update] = useUpdateServiceTemplateMutation()

    const state =
      serviceTemplateApi.endpoints.getServiceTemplates.useQueryState(
        undefined,
        {
          selectFromResult: ({ data = [] }) =>
            data.find((template) => +template.ID === +original.ID),
        }
      )

    const memoTemplate = useMemo(() => state ?? original, [state, original])

    const handleDeleteLabel = useCallback(
      (label) => {
        const currentLabels = memoTemplate.TEMPLATE.BODY.labels?.split(',')
        const labels = currentLabels.filter((l) => l !== label).join(',')

        update({ id: memoTemplate.ID, template: { labels }, append: true })
      },
      [memoTemplate.TEMPLATE.BODY?.labels, update]
    )

    return (
      <ServiceTemplateCard
        template={memoTemplate}
        rootProps={props}
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
  handleClick: PropTypes.func,
}

Row.displayName = 'ServiceTemplateRow'

export default Row
