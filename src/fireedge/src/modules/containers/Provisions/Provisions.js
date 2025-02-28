/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { Backdrop, Box, CircularProgress } from '@mui/material'
import { Trash as DeleteIcon, Settings as EditIcon } from 'iconoir-react'
import { useHistory } from 'react-router-dom'
import { useGeneralApi, ProvisionAPI } from '@FeaturesModule'
import { useDialog, useSearch } from '@HooksModule'
import AlertError, {
  ProvisionCard,
  Translate,
  ListCards,
  ListHeader,
  DialogConfirmation,
  PATH,
  Form,
} from '@ComponentsModule'

import { T } from '@modules/constants'
import DialogInfo from '@modules/containers/Provisions/DialogInfo/DialogInfo'
const { Provision } = Form

/**
 * Renders a list of available cluster provisions.
 *
 * @returns {ReactElement} List of provisions
 */
export function Provisions() {
  const history = useHistory()
  const { display, show, hide, values: dialogProps } = useDialog()

  const { enqueueInfo } = useGeneralApi()
  const [configureProvision] = ProvisionAPI.useConfigureProvisionMutation()
  const [deleteProvision] = ProvisionAPI.useDeleteProvisionMutation()

  const {
    refetch,
    data: provisions = [],
    isFetching,
    error,
  } = ProvisionAPI.useGetProvisionsQuery()

  const [
    getProvision,
    {
      currentData: provisionDetail,
      isLoading: provisionIsLoading,
      error: provisionError,
      originalArgs,
    },
  ] = ProvisionAPI.useLazyGetProvisionQuery()

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
          onClick: () => history.push(PATH.INFRASTRUCTURE.PROVISIONS.CREATE),
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
                    form: Provision.ConfigureForm,
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
                    form: Provision.DeleteForm,
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
