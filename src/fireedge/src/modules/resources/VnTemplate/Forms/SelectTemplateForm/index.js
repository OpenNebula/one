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
import { ReactElement, useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import { Table } from '@ComponentsV2Module'
import { vntemplateTable } from '@ModelsModule'

/**
 * Virtual Network Template selection form.
 *
 * @param {object} props - Props
 * @param {Function} props.onSelect - Select handler
 * @returns {ReactElement} Template selection table
 */
export const SelectTemplateForm = ({ onSelect }) => {
  const { data = [], isFetching } = vntemplateTable.useData()
  const [selectedTemplate, setSelectedTemplate] = useState()

  const rowSelection = useMemo(
    () =>
      selectedTemplate?.ID !== undefined
        ? { [String(selectedTemplate.ID)]: true }
        : {},
    [selectedTemplate]
  )

  const handleSelect = useCallback(
    (template) => {
      const id = String(template?.ID)
      const nextTemplate =
        String(selectedTemplate?.ID) === id ? undefined : template
      setSelectedTemplate(nextTemplate)
      onSelect?.(nextTemplate)
    },
    [onSelect, selectedTemplate]
  )

  const handleRowSelectionChange = useCallback(
    (updater) => {
      const next =
        typeof updater === 'function' ? updater(rowSelection) : updater
      const selectedId = Object.keys(next).find((id) => next[id])
      const nextTemplate = data.find(({ ID }) => String(ID) === selectedId)
      setSelectedTemplate(nextTemplate)
      onSelect?.(nextTemplate)
    },
    [data, onSelect, rowSelection]
  )

  return (
    <Table
      columns={vntemplateTable
        .columns()
        .filter(({ id }) => !['owner', 'group', 'time', 'labels'].includes(id))}
      data={data}
      isLoading={isFetching}
      isRowsSelectable
      rowSelection={rowSelection}
      onRowSelectionChange={handleRowSelectionChange}
      getRowId={(row) => String(row.ID)}
      onRowClick={handleSelect}
      size="medium"
      isEnableSearchBar
      isEnableSort
      isEnableFilters
    />
  )
}

SelectTemplateForm.propTypes = {
  onSelect: PropTypes.func,
}
