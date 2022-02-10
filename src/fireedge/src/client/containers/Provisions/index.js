/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { useState, useEffect, createElement } from 'react'

import { useHistory } from 'react-router-dom'
import { Container, Box } from '@mui/material'
import { Trash as DeleteIcon, Settings as EditIcon } from 'iconoir-react'

import { PATH } from 'client/apps/provision/routes'
import { useFetch, useSearch } from 'client/hooks'
import { useProvision, useProvisionApi } from 'client/features/One'
import { useGeneralApi } from 'client/features/General'

import { DeleteForm } from 'client/components/Forms/Provision'
import { ListHeader, ListCards } from 'client/components/List'
import AlertError from 'client/components/Alerts/Error'
import { ProvisionCard } from 'client/components/Cards'
import { Translate } from 'client/components/HOC'

import { DialogRequest } from 'client/components/Dialogs'
import DialogInfo from 'client/containers/Provisions/DialogInfo'
import { T } from 'client/constants'

function Provisions() {
  const history = useHistory()
  const [{ content, ...showDialog } = {}, setShowDialog] = useState()
  const handleCloseDialog = () => setShowDialog()

  const { enqueueInfo } = useGeneralApi()
  const provisions = useProvision()

  const { getProvisions, getProvision, configureProvision, deleteProvision } =
    useProvisionApi()

  const { error, fetchRequest, loading, reloading } = useFetch(getProvisions)

  const { result, handleChange } = useSearch({
    list: provisions,
    listOptions: { shouldSort: true, keys: ['ID', 'NAME'] },
  })

  useEffect(() => {
    fetchRequest()
  }, [])

  return (
    <Container disableGutters>
      <ListHeader
        title={T.Provisions}
        reloadButtonProps={{
          'data-cy': 'refresh-provision-list',
          onClick: () => fetchRequest(undefined, { reload: true }),
          isSubmitting: Boolean(loading || reloading),
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
            isLoading={provisions.length === 0 && loading}
            gridProps={{ 'data-cy': 'provisions' }}
            CardComponent={ProvisionCard}
            cardsProps={({ value: { ID, NAME } }) => ({
              handleClick: () =>
                setShowDialog({
                  id: ID,
                  title: `#${ID} ${NAME}`,
                  content: (props) =>
                    createElement(DialogInfo, {
                      ...props,
                      displayName: 'DialogDetailProvision',
                    }),
                }),
              actions: [
                {
                  handleClick: () =>
                    configureProvision(ID)
                      .then(() =>
                        enqueueInfo(`Configuring provision - ID: ${ID}`)
                      )
                      .then(() => fetchRequest(undefined, { reload: true })),
                  icon: <EditIcon />,
                  cy: 'provision-configure',
                },
              ],
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
                        await deleteProvision(ID, formData)
                        enqueueInfo(`Deleting provision - ID: ${ID}`)
                      } finally {
                        handleCloseDialog()
                        fetchRequest(undefined, { reload: true })
                      }
                    },
                  },
                ],
              },
            })}
          />
        )}
      </Box>
      {content && (
        <DialogRequest
          withTabs
          request={() => getProvision(showDialog.id)}
          dialogProps={{
            fixedWidth: true,
            fixedHeight: true,
            handleCancel: handleCloseDialog,
            ...showDialog,
          }}
        >
          {(props) => content(props)}
        </DialogRequest>
      )}
    </Container>
  )
}

export default Provisions
