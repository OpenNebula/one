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

import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { EditPencil } from 'iconoir-react'
import { Button } from '@modules/components/primitives/Buttons/Default'
import { Text } from '@modules/components/primitives/Text/Default'
import { T, TEXT_VARIANTS } from '@ConstantsModule'
import { getStyles } from './styles'

/**
 * Displays review fields with an optional edit action.
 *
 * @param {object} props - Props
 * @param {object} props.title - Section title
 * @param {object[]} props.rows - Label/value pairs accepting React nodes
 * @param {Function} props.onEdit - Edit handler
 * @param {string} props.editHref - Edit link destination
 * @param {boolean} props.isEditDisabled - Disable editing
 * @param {string} props.dataCy - Test selector
 * @returns {object} Review table
 */
export const ReviewTable = forwardRef(
  (
    { title, rows = [], onEdit, editHref, isEditDisabled = false, dataCy },
    ref
  ) => (
    <Box
      component="section"
      ref={ref}
      data-cy={dataCy}
      sx={(theme) => getStyles({ theme })}
    >
      {(title || onEdit || editHref) && (
        <Box className="review-table-header">
          {title && (
            <Text
              className="review-table-title"
              variant={TEXT_VARIANTS.H3}
              value={title}
            />
          )}
          {(onEdit || editHref) && (
            <Button
              type="transparent"
              className="review-table-edit"
              startIcon={<EditPencil />}
              href={editHref}
              onClick={onEdit}
              isDisabled={isEditDisabled}
              dataCy={dataCy ? `${dataCy}-edit` : undefined}
            >
              {T.Edit}
            </Button>
          )}
        </Box>
      )}
      <Box className="review-table-container">
        <Box component="table" className="review-table">
          <Box component="tbody">
            {rows.map(({ label, value }, index) => (
              <Box component="tr" key={index} className="review-table-row">
                <Box component="th" scope="row" className="review-table-label">
                  <Text
                    variant={TEXT_VARIANTS.BODY_SMALL}
                    value={label}
                    sx={{ color: 'text.onDisabled' }}
                  />
                </Box>
                <Box
                  component="td"
                  className="review-table-value"
                  data-cy={dataCy ? `${dataCy}-value-${index}` : undefined}
                >
                  {['string', 'number'].includes(typeof value) ? (
                    <Text
                      variant={TEXT_VARIANTS.BODY_SMALL}
                      value={value}
                      sx={{ color: 'text.headings' }}
                    />
                  ) : (
                    value
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
)

ReviewTable.propTypes = {
  title: PropTypes.node,
  rows: PropTypes.arrayOf(
    PropTypes.shape({ label: PropTypes.node, value: PropTypes.node })
  ),
  onEdit: PropTypes.func,
  editHref: PropTypes.string,
  isEditDisabled: PropTypes.bool,
  dataCy: PropTypes.string,
}

ReviewTable.displayName = 'ReviewTable'
