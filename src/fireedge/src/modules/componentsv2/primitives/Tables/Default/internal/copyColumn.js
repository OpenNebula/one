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

import { Component } from 'react'
import { Checkbox } from '@modules/componentsv2/primitives/Buttons/Checkbox'
/**
 * @returns {Component} Copy column
 */
export const CopyColumn = () => ({
  id: 'COPY',
  header: ({ table }) => (
    <Checkbox
      checked={
        table.getIsSomeRowsSelected() ? null : table.getIsAllRowsSelected()
      }
      onChange={() => table.toggleAllRowsSelected()}
      onClick={(e) => e.stopPropagation()}
    />
  ),
  width: '75px',
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      isDisabled={!row.getCanSelect()}
      onChange={() => row.toggleSelected()}
      onClick={(e) => e.stopPropagation()}
    />
  ),
  meta: { disableHeaderTooltip: true },
  enableSorting: false,
})
