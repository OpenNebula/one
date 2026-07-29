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

import { forwardRef, Component, useRef } from 'react'
import { Box, useTheme } from '@mui/material'
import { Button } from '@modules/componentsv2/primitives/Buttons'
import { getStyles } from '@modules/componentsv2/composed/DetailsDrawer/Default/slots/info/styles'
import { EditPencil } from 'iconoir-react'
import PropTypes from 'prop-types'
import EditableTitle from '@modules/componentsv2/composed/DetailsDrawer/Default/slots/info/EditableTitle'
import { DEFAULT_IMAGE, STYLE_BUTTONS, T } from '@ConstantsModule'
import { Tooltip } from '@modules/componentsv2/primitives/Tooltip'
import { useTranslation } from '@ProvidersModule'
import { CompactToolbar } from '@modules/componentsv2/primitives/Buttons/CompactToolbar'
import { TagList } from '@modules/componentsv2/primitives/Tags/List'
import { SkeletonLoading } from '@modules/componentsv2/primitives/Loaders'

const hasValue = (value) =>
  value !== undefined && value !== null && value !== '' && value !== false

/**
 * InfoSlot component.
 *
 * @param {object} root0 - Params
 * @returns {Component} - InfoSlot component
 */
export const InfoSlot = forwardRef(
  (
    {
      icon,
      title,
      isTitleEditable = false,
      onTitleChange,
      isTitleEditDisabled = false,
      id,
      labels = [],
      tags = [],
      isLoading = false,
      Toolbar,
      dataCy,
    },
    ref
  ) => {
    const { translate, translateText } = useTranslation()
    const { scale } = useTheme()
    const editableTitleRef = useRef(null)
    const clickToRename = translate(T.ClickToRename)

    const handleEditTitle = () => {
      editableTitleRef.current?.startEditing()
    }

    return (
      <Box
        sx={(theme) =>
          getStyles({
            theme,
          })
        }
        ref={ref}
      >
        <Box className={'info-container'}>
          <Box className="info-top-row">
            <Box className="info-header">
              {icon && (
                <Box className="icon-container">
                  <img
                    className="info-icon"
                    src={icon}
                    alt=""
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = DEFAULT_IMAGE
                    }}
                  />
                </Box>
              )}
              <Box className="info-title-wrapper">
                {title &&
                  (isTitleEditable ? (
                    <EditableTitle
                      ref={editableTitleRef}
                      value={title}
                      onSave={onTitleChange}
                      isDisabled={isTitleEditDisabled}
                      dataCy={dataCy && `${dataCy}-title`}
                    />
                  ) : (
                    <Box
                      className="info-title"
                      data-cy={dataCy && `${dataCy}-title`}
                    >
                      {title}
                    </Box>
                  ))}
                {id && (
                  <Box className="info-id" data-cy={dataCy && `${dataCy}-id`}>
                    {`#${id}`}
                  </Box>
                )}
                {isTitleEditable && !isTitleEditDisabled && (
                  <Tooltip
                    title={clickToRename}
                    placement="bottom"
                    followCursor
                  >
                    <Button
                      data-cy={dataCy && `${dataCy}-edit-title`}
                      type={STYLE_BUTTONS.TYPE.TRANSPARENT}
                      size="medium"
                      iconOnly={<EditPencil width={'16px'} height={'16px'} />}
                      onClick={handleEditTitle}
                    />
                  </Tooltip>
                )}
              </Box>
            </Box>
            {Toolbar && (
              <Box className="info-action-toggles">
                <CompactToolbar resetKey={id}>{Toolbar()}</CompactToolbar>
              </Box>
            )}
          </Box>
          {(!!labels?.length || !!tags?.length || isLoading) && (
            <Box className="info-metadata">
              {!!labels?.length && (
                <Box className="info-ownership">
                  {labels?.map(([ltitle, value], idx) => (
                    <Box key={idx} className="region-label">
                      {ltitle && (
                        <span className="region-label--title">
                          {typeof ltitle === 'string'
                            ? translateText(ltitle)
                            : ltitle}
                        </span>
                      )}
                      {hasValue(value) && (
                        <span className="region-label--value">{value}</span>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
              {(isLoading || !!tags?.length) && (
                <Box className="info-tags">
                  <SkeletonLoading
                    loading={isLoading}
                    width={scale[1200] * 2}
                    height={scale[550]}
                    variant="rectangular"
                    borderRadius="round"
                  >
                    <TagList tags={tags} max={tags.length} wrap />
                  </SkeletonLoading>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    )
  }
)

InfoSlot.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  labels: PropTypes.array,
  tags: PropTypes.array,
  isLoading: PropTypes.bool,
  Toolbar: PropTypes.func,
  isTitleEditable: PropTypes.bool,
  onTitleChange: PropTypes.func,
  isTitleEditDisabled: PropTypes.bool,
  dataCy: PropTypes.string,
}

InfoSlot.displayName = 'InfoSlot'
