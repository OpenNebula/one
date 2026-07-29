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

import { Dialog, DialogContent, DialogTitle, Stack } from '@mui/material'
import { Cancel } from 'iconoir-react'
import { ReactElement, useCallback, useMemo } from 'react'
import { useHistory } from 'react-router'

import { Button, Table, Text } from '@ComponentsV2Module'
import { PATH, T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'
import { vmtemplateTable } from '@ModelsModule'
import { VirtualMachines } from '@modules/containers/VirtualMachines/VirtualMachines'

/**
 * Displays the VM create template selector.
 *
 * @returns {ReactElement} Virtual machines list with template selector dialog
 */
export function CreateVm() {
  const history = useHistory()

  const {
    data = [],
    isFetching: isRefreshing,
    refetch: refresh,
  } = vmtemplateTable.useData()

  const templates = useMemo(
    () =>
      data?.filter(({ TEMPLATE = {} } = {}) => TEMPLATE?.VROUTER !== 'YES') ??
      [],
    [data]
  )

  const handleClose = useCallback(() => {
    history.replace(PATH.INSTANCE.VMS.LIST)
  }, [history])

  const redirectToInstantiate = useCallback(
    (template) => {
      history.push(PATH.TEMPLATE.VMS.INSTANTIATE, {
        ...template,
        navigateUrl: 'vm',
      })
    },
    [history]
  )

  return (
    <>
      <VirtualMachines />
      <Dialog
        open
        fullWidth
        maxWidth="lg"
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 'min(1120px, calc(100vw - 64px))',
            maxWidth: 'none',
            minHeight: '620px',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
          >
            <Text
              value={T.SelectVmTemplate}
              variant={TEXT_VARIANTS.H6}
              weight={TEXT_WEIGHTS.SEMIBOLD}
            />
            <Button
              iconOnly={<Cancel />}
              type="secondary"
              title={T.Close}
              onClick={handleClose}
            />
          </Stack>
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            pb: 3,
          }}
        >
          <Table
            columns={vmtemplateTable.columns()}
            data={templates}
            isLoading={isRefreshing}
            isRowsSelectable
            isMultiRowSelection={false}
            getRowId={(row) => row.ID}
            onRowClick={redirectToInstantiate}
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            isEnableSearchBar
            isEnableSort
            isEnableFilters
            searchPlaceholder={T.SearchTemplates}
            defaultPageSize={5}
            pageSizeOptions={[5, 10, 25, 50, 100]}
            skeletonRows={4}
            size="medium"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
