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
import { memo, ReactElement, useEffect } from 'react'

import { Backdrop, Box, CircularProgress } from '@mui/material'
import { Trash as DeleteIcon, Settings as EditIcon } from 'iconoir-react'
import { generatePath, useHistory } from 'react-router-dom'
import { ProviderAPI, useGeneralApi } from '@FeaturesModule'
import { useSearch, useDialog } from '@HooksModule'

import {
  ListHeader,
  ListCards,
  AlertError,
  ProvisionCard,
  DialogConfirmation,
  Translate,
  PATH,
  TranslateProvider,
} from '@ComponentsModule'
import { Info as Information } from '@modules/containers/Providers/Sections/info'
import { T } from '@ConstantsModule'

/**
 * Renders a list of available providers.
 *
 * @returns {ReactElement} List of providers
 */
export function Providers() {
  const history = useHistory()
  const { display, show, hide, values: dialogProps } = useDialog()

  const { enqueueSuccess } = useGeneralApi()
  const { data: providerConfig } = ProviderAPI.useGetProviderConfigQuery()
  const [
    deleteProvider,
    {
      isLoading: isDeleting,
      isSuccess: successDelete,
      originalArgs: { id: deletedProviderId } = {},
    },
  ] = ProviderAPI.useDeleteProviderMutation()

  const {
    refetch,
    data: providers = [],
    isFetching,
    error,
  } = ProviderAPI.useGetProvidersQuery()

  const { result, handleChange } = useSearch({
    list: providers,
    listOptions: { shouldSort: true, keys: ['ID', 'NAME'] },
  })

  const handleDelete = async (id) => {
    try {
      hide()
      await deleteProvider({ id })
    } catch {}
  }

  useEffect(() => {
    successDelete && enqueueSuccess(T.SuccessProviderDeleted, deletedProviderId)
  }, [successDelete])

  return (
    <TranslateProvider>
      <>
        <ListHeader
          title={T.Providers}
          reloadButtonProps={{
            'data-cy': 'refresh-provider-list',
            onClick: () => refetch(),
            isSubmitting: isFetching,
          }}
          addButtonProps={{
            'data-cy': 'create-provider',
            onClick: () => history.push(PATH.INFRASTRUCTURE.PROVIDERS.CREATE),
          }}
          searchProps={{ handleChange }}
        />
        <Box p={3}>
          {error ? (
            <AlertError>{T.CannotConnectOneProvision}</AlertError>
          ) : (
            <ListCards
              list={result ?? providers}
              gridProps={{ 'data-cy': 'providers' }}
              CardComponent={ProvisionCard}
              cardsProps={({ value: { ID, NAME, TEMPLATE } }) => ({
                image: providerConfig[TEMPLATE?.PLAIN?.provider]?.image,
                isProvider: true,
                handleClick: () => show({ id: ID, title: `#${ID} ${NAME}` }),
                actions: [
                  {
                    handleClick: () =>
                      history.push(
                        generatePath(PATH.INFRASTRUCTURE.PROVIDERS.EDIT, {
                          id: ID,
                        })
                      ),
                    icon: <EditIcon />,
                    cy: 'provider-edit',
                  },
                  {
                    handleClick: () =>
                      show({
                        id: ID,
                        delete: true,
                        title: (
                          <Translate
                            word={T.DeleteSomething}
                            values={`#${ID} ${NAME}`}
                          />
                        ),
                        handleAccept: () => handleDelete(ID),
                      }),
                    icon: <DeleteIcon />,
                    isSubmitting: isDeleting,
                    color: 'error',
                    cy: 'provider-delete',
                  },
                ],
              })}
            />
          )}
        </Box>
        {display &&
          dialogProps?.id &&
          (!dialogProps?.delete ? (
            <DialogProvider
              hide={hide}
              id={dialogProps.id}
              dialogProps={dialogProps}
            />
          ) : (
            <DialogConfirmation handleCancel={hide} {...dialogProps}>
              <p>
                <Translate word={T.DoYouWantProceed} />
              </p>
            </DialogConfirmation>
          ))}
      </>
    </TranslateProvider>
  )
}

const DialogProvider = memo(
  ({ id, hide, dialogProps }) => {
    const {
      currentData: providerDetail,
      isLoading: providerIsLoading,
      error: providerError,
    } = ProviderAPI.useGetProviderQuery(id)

    useEffect(() => {
      providerError && hide()
    }, [providerError])

    return providerDetail?.ID !== id || providerIsLoading ? (
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
        <Information id={providerDetail.ID} />
      </DialogConfirmation>
    )
  },
  (prev, next) => prev.id === next.id
)

DialogProvider.propTypes = {
  id: PropTypes.string,
  hide: PropTypes.func,
  dialogProps: PropTypes.object,
}

DialogProvider.displayName = 'DialogProvider'
