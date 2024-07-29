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

import { useHistory } from 'react-router-dom'
import { Box, Backdrop, CircularProgress } from '@mui/material'
import { Trash as DeleteIcon, Settings as EditIcon } from 'iconoir-react'

import {
  useGetProvisionsQuery,
  useLazyGetProvisionQuery,
  useConfigureProvisionMutation,
  useDeleteProvisionMutation,
} from 'client/features/OneApi/provision'
import { useSearch, useDialog } from 'client/hooks'
import { useGeneralApi } from 'client/features/General'

import { DeleteForm, ConfigureForm } from 'client/components/Forms/Provision'
import { ListHeader, ListCards } from 'client/components/List'
import AlertError from 'client/components/Alerts/Error'
import { ProvisionCard } from 'client/components/Cards'
import { Translate } from 'client/components/HOC'

import { DialogConfirmation } from 'client/components/Dialogs'
import DialogInfo from 'client/containers/Provisions/DialogInfo'
import { PATH } from 'client/apps/provision/routes'
import { T } from 'client/constants'

/**
 * Renders a list of available cluster provisions.
 *
 * @returns {ReactElement} List of provisions
 */
function Provisions() {
  const history = useHistory()
  const { display, show, hide, values: dialogProps } = useDialog()

  const { enqueueInfo } = useGeneralApi()
  const [configureProvision] = useConfigureProvisionMutation()
  const [deleteProvision] = useDeleteProvisionMutation()

  const {
    refetch,
    data: provisions = [],
    isFetching,
    error,
  } = useGetProvisionsQuery()

  const [
    getProvision,
    {
      currentData: provisionDetail,
      isLoading: provisionIsLoading,
      error: provisionError,
      originalArgs,
    },
  ] = useLazyGetProvisionQuery()

  const { result, handleChange } = useSearch({
    list: provisions,
    listOptions: { shouldSort: true, keys: ['ID', 'NAME'] },
  })

  const handleClickfn = (ID, NAME) => {
    getProvision(ID)
    show({ id: ID, title: `#${ID} ${NAME}` })
  }

  return (
    <>
      <ListHeader
        title={T.Provisions}
        reloadButtonProps={{
          'data-cy': 'refresh-provision-list',
          onClick: () => refetch(),
          isSubmitting: isFetching,
        }}
        addButtonProps={{
          'data-cy': 'create-provision',
          onClick: () => history.push(PATH.PROVISIONS.CREATE),
        }}
        searchProps={{ handleChange }}
      />
      <Box p={3}>
        {error ? (
          <AlertError>{T.CannotConnectOneProvision}</AlertError>
        ) : (
          <ListCards
            list={result ?? provisions}
            gridProps={{ 'data-cy': 'provisions' }}
            CardComponent={ProvisionCard}
            cardsProps={({ value: { ID, NAME } }) => ({
              handleClick: () => handleClickfn(ID, NAME),
              configureAction: {
                buttonProps: {
                  'data-cy': 'provision-configure',
                  icon: <EditIcon />,
                },
                options: [
                  {
                    dialogProps: {
                      title: (
                        <Translate
                          word={T.ConfigureProvision}
                          values={`#${ID} ${NAME}`}
                        />
                      ),
                    },
                    form: ConfigureForm,
                    onSubmit: async (formData) => {
                      try {
                        await configureProvision({ id: ID, ...formData })
                        enqueueInfo(T.InfoProvisionConfigure, ID)
                      } finally {
                        hide()
                      }
                    },
                  },
                ],
              },
              deleteAction: {
                buttonProps: {
                  'data-cy': 'provision-delete',
                  icon: <DeleteIcon />,
                  color: 'error',
                },
                options: [
                  {
                    dialogProps: {
                      title: (
                        <Translate
                          word={T.DeleteSomething}
                          values={`#${ID} ${NAME}`}
                        />
                      ),
                    },
                    form: DeleteForm,
                    onSubmit: async (formData) => {
                      try {
                        await deleteProvision({ id: ID, ...formData })
                        enqueueInfo(T.InfoProvisionDelete, ID)
                      } finally {
                        hide()
                      }
                    },
                  },
                ],
              },
            })}
          />
        )}
      </Box>
      {display &&
        !provisionError &&
        (provisionDetail?.ID !== originalArgs || provisionIsLoading ? (
          <Backdrop
            open
            sx={{
              zIndex: (theme) => theme.zIndex.drawer + 1,
              color: (theme) => theme.palette.common.white,
            }}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
        ) : (
          <DialogConfirmation
            fixedWidth
            fixedHeight
            handleCancel={hide}
            {...dialogProps}
          >
            <DialogInfo id={provisionDetail.ID} />
          </DialogConfirmation>
        ))}
    </>
  )
}

export default Provisions
