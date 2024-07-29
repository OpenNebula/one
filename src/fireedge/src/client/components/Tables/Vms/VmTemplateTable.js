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
import { Box, styled } from '@mui/material'
import { SubmitButton } from 'client/components/FormControl'
import { Tr } from 'client/components/HOC'
import VmTemplatesTable from 'client/components/Tables/VmTemplates'
import { T } from 'client/constants'
import { Table as TableIcon, TableRows } from 'iconoir-react'
import PropTypes from 'prop-types'
import { memo, useState } from 'react'

const StyledBoxStyles = styled(Box)(() => ({
  '&': {
    textAlign: 'right',
  },
}))

const Table = memo((props) => {
  const [enableStyles, setEnableStyles] = useState(true)

  const { classes, ...restProps } = props
  const propsClass = restProps

  enableStyles && (propsClass.classes = classes)

  const handleClasses = () => setEnableStyles(!enableStyles)

  return (
    <>
      <StyledBoxStyles>
        <SubmitButton
          data-cy="clear-styles-table"
          tooltip={Tr(enableStyles ? T.ItemsRow : T.ItemsTables)}
          icon={enableStyles ? <TableRows /> : <TableIcon />}
          onClick={handleClasses}
        />
      </StyledBoxStyles>
      <VmTemplatesTable {...propsClass} />
    </>
  )
})

Table.propTypes = {
  classes: PropTypes.object,
}

Table.displayName = 'TableStyled'

export default Table
