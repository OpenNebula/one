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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'

import { Stack, TextField } from '@mui/material'
import { UseFiltersInstanceProps } from 'react-table'

import { Tr } from 'client/components/HOC'

/**
 * Render category filter to table.
 *
 * @param {object} props - Props
 * @param {UseFiltersInstanceProps} props.column - Props
 * @returns {ReactElement} Component JSX
 */
const CategoryFilter = ({ column: { Header, filterValue, setFilter, id } }) => (
  <Stack direction="row">
    <TextField
      fullWidth
      label={Tr(Header)}
      value={new Date(filterValue)}
      onChange={(evt) => {
        console.log(evt.target.value)
      }}
      color="secondary"
      type="date"
      inputProps={{ 'data-cy': `after-${id}` }}
    />
    <TextField
      fullWidth
      label={Tr(Header)}
      value={new Date(filterValue)}
      onChange={(evt) => {
        console.log(evt.target.value)
      }}
      color="secondary"
      type="date"
      inputProps={{ 'data-cy': `before-${id}` }}
    />
  </Stack>
)

CategoryFilter.propTypes = {
  column: PropTypes.object,
}

export default CategoryFilter
