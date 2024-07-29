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
import { useFormContext } from 'react-hook-form'

import { useGetOneConfigQuery } from 'client/features/OneApi/system'
import { useGetMarketplacesQuery } from 'client/features/OneApi/marketplace'
import { MarketplacesTable } from 'client/components/Tables'
import { SCHEMA } from 'client/components/Forms/MarketplaceApp/CreateForm/Steps/MarketplacesTable/schema'
import { onedConfIncludesAction } from 'client/models/Marketplace'
import { Step } from 'client/utils'
import { T } from 'client/constants'

export const STEP_ID = 'marketplace'

const Content = ({ data }) => {
  const { NAME } = data?.[0] ?? {}
  const { setValue } = useFormContext()
  const { data: oneConfig = {} } = useGetOneConfigQuery()

  const handleSelectedRows = (rows) => {
    const { original = {} } = rows?.[0] ?? {}

    setValue(STEP_ID, original.ID !== undefined ? [original] : [])
  }

  return (
    <MarketplacesTable
      singleSelect
      disableGlobalSort
      displaySelectedRows
      pageSize={5}
      getRowId={(market) => String(market.NAME)}
      useQuery={() =>
        useGetMarketplacesQuery(undefined, {
          selectFromResult: ({ data: result = [], ...restOfQuery }) => ({
            data: result?.filter((market) =>
              onedConfIncludesAction(market, oneConfig, 'create')
            ),
            ...restOfQuery,
          }),
        })
      }
      initialState={{ selectedRowIds: { [NAME]: true } }}
      onSelectedRowsChange={handleSelectedRows}
    />
  )
}

/**
 * Step to select the Marketplace.
 *
 * @type {Step} Marketplace step
 */
const MarketplaceStep = () => ({
  id: STEP_ID,
  label: T.SelectMarketplace,
  resolver: SCHEMA,
  content: Content,
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default MarketplaceStep
