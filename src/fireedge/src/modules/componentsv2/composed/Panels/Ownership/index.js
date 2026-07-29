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

import PropTypes from 'prop-types'
import { forwardRef, useCallback, useMemo } from 'react'
import { Box } from '@mui/material'
import { useModalsApi } from '@FeaturesModule'
import { T, ACTIONS } from '@ConstantsModule'
import { Button } from '@modules/componentsv2/primitives/Buttons'
import { getChangeUserForm } from '@modules/componentsv2/composed/Forms/ChangeUserForm'
import { getChangeGroupForm } from '@modules/componentsv2/composed/Forms/ChangeGroupForm'
import { Table } from '@modules/componentsv2/primitives/Tables'
import { Edit } from 'iconoir-react'

const CHANGE_OWNERSHIP_DIALOG_PROPS = {
  dialogWidth: { xs: 'calc(100vw - 32px)', md: '900px', lg: '1040px' },
  dialogMaxWidth: 'calc(100vw - 32px)',
  dialogMaxHeight: 'calc(100vh - 64px)',
  dialogPaperOverflow: 'visible',
  dialogContentMaxHeight: '50vh',
  dialogContentOverflowY: 'auto',
}

export const OwnershipTab = forwardRef(
  (
    {
      title,
      actions,
      userId,
      userName,
      groupId,
      groupName,
      handleEdit,
      isDisabled = false,
      size = 'medium',
    },
    ref
  ) => {
    const { showModal } = useModalsApi()

    /**
     * Submits the selected owner to the resource action.
     *
     * @param {object} newOwnership - Ownership payload
     * @returns {*} Ownership update result
     */
    const handleSubmitChangeOwner = useCallback(
      (newOwnership) => handleEdit?.(newOwnership),
      [handleEdit]
    )

    /**
     * Submits the selected group to the resource action.
     *
     * @param {object} newOwnership - Ownership payload
     * @returns {*} Ownership update result
     */
    const handleSubmitChangeGroup = useCallback(
      (newOwnership) => handleEdit?.(newOwnership),
      [handleEdit]
    )

    /**
     * Opens the owner selection form.
     *
     * @returns {void}
     */
    const handleChangeOwnerForm = useCallback(() => {
      const initialValues =
        userId === undefined || userId === null
          ? undefined
          : { user: String(userId) }

      showModal({
        name: T.ChangeOwner,
        dialogProps: {
          title: T.ChangeOwner,
          dataCy: `modal-${ACTIONS.CHANGE_OWNER}`,
          validateOn: 'onSubmit',
          ...CHANGE_OWNERSHIP_DIALOG_PROPS,
        },
        form: getChangeUserForm({ initialValues }),
        onSubmit: handleSubmitChangeOwner,
      })
    }, [handleSubmitChangeOwner, showModal, userId])

    /**
     * Opens the group selection form.
     *
     * @returns {void}
     */
    const handleChangeGroupForm = useCallback(() => {
      const initialValues =
        groupId === undefined || groupId === null
          ? undefined
          : { group: String(groupId) }

      showModal({
        name: T.ChangeGroup,
        dialogProps: {
          title: T.ChangeGroup,
          dataCy: `modal-${ACTIONS.CHANGE_GROUP}`,
          validateOn: 'onSubmit',
          ...CHANGE_OWNERSHIP_DIALOG_PROPS,
        },
        form: getChangeGroupForm({ initialValues }),
        onSubmit: handleSubmitChangeGroup,
      })
    }, [groupId, handleSubmitChangeGroup, showModal])

    /* eslint-disable jsdoc/require-jsdoc */
    const data = useMemo(
      () => [
        {
          type: 'owner',
          label: T.Owner,
          value: userName,
          initialValue: { text: userName ?? '', value: userId },
          canEdit: actions?.[ACTIONS.CHANGE_OWNER],
          onOpenForm: handleChangeOwnerForm,
        },
        {
          type: 'group',
          label: T.Group,
          value: groupName,
          initialValue: { text: groupName ?? '', value: groupId },
          canEdit: actions?.[ACTIONS.CHANGE_GROUP],
          onOpenForm: handleChangeGroupForm,
        },
      ],
      [
        userId,
        userName,
        groupId,
        groupName,
        actions,
        handleChangeOwnerForm,
        handleChangeGroupForm,
      ]
    )

    const columns = [
      { accessorKey: 'label', header: '' },
      {
        accessorKey: 'value',
        header: '',
        cell: ({ row }) => {
          const { canEdit, onOpenForm, type, value } = row.original
          const isEditDisabled = isDisabled || !canEdit

          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 1,
                width: '100%',
              }}
            >
              <Box
                component="span"
                data-cy={type === 'owner' ? 'owner' : 'group'}
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {value ?? '-'}
              </Box>
              <Button
                type="transparent"
                iconOnly={<Edit />}
                title={T.Edit}
                aria-label={`${T.Edit} ${row.original.label}`}
                dataCy={`ownership-${type}-edit`}
                onClick={onOpenForm}
                isDisabled={isEditDisabled}
              />
            </Box>
          )
        },
      },
    ]

    return (
      <Table
        title={title}
        ref={ref}
        data={data}
        columns={columns}
        size={size}
        isDisabled={isDisabled}
        isDisablePagination
      />
    )
  }
)

OwnershipTab.propTypes = {
  title: PropTypes.string,
  actions: PropTypes.object,
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  userName: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  groupId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  groupName: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  handleEdit: PropTypes.func,
  size: PropTypes.string,
  isDisabled: PropTypes.bool,
}
OwnershipTab.displayName = 'OwnershipTab'
