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
import PropTypes from 'prop-types'
import { memo } from 'react'
import { Stack } from '@mui/material'
import { STYLE_BUTTONS, T, VN_ACTIONS } from '@ConstantsModule'
import ButtonToTriggerForm from '@modules/components/Forms/ButtonToTriggerForm'
import { AddVnetsForm } from '@modules/components/Forms/Cluster'
import AddressRangeCard from '@modules/components/Cards/AddressRangeCard'
import SubmitButton from '@modules/components/FormControl/SubmitButton'

import { useDialog } from '@HooksModule'

import { DialogConfirmation } from '@modules/components/Dialogs'

import { DeleteAddressRangeAction } from '@modules/components/Buttons'

const { DELETE_AR } = VN_ACTIONS

const AddIps = memo(({ formType, submit }) => {
  // Handle submit form
  const handleSubmit = (formData) => {
    submit(formData.amount)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': 'add-vnets',
        label: T.AddIpsProvision,
        importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
        size: STYLE_BUTTONS.SIZE.MEDIUM,
        type: STYLE_BUTTONS.TYPE.FILLED,
      }}
      options={[
        {
          cy: 'add-to-provision-ips',
          name: T.AddIpsProvision,
          dialogProps: {
            title: T.AddIpsProvision,
            dataCy: 'modal-add-to-provision-ips',
            validateOn: 'onSubmit',
            fixedWidth: true,
          },

          form: () => {
            const params = {
              stepProps: {
                formType,
              },
            }

            return AddVnetsForm(params)
          },
          onSubmit: handleSubmit,
        },
      ]}
    />
  )
})

AddIps.propTypes = {
  formType: PropTypes.string,
  filter: PropTypes.func,
  submit: PropTypes.func,
}
AddIps.displayName = 'AddIps'

/**
 * Action to edit administrators of a group.
 *
 * @param {object} props - Properties
 * @param {object} props.vnet - Virtual network
 * @param {object} props.oneConfig - OpenNebula config
 * @param {boolean} props.adminGroup - If the user is admin
 * @param {object} props.actions - List of actions
 * @param {object} props.submit - Submit function
 * @returns {object} - React component
 */
const DeleteIps = ({ vnet, oneConfig, adminGroup, actions = [], submit }) => {
  const { display, show, hide } = useDialog()

  const addressRanges = [vnet?.AR_POOL?.AR ?? []].flat()

  return (
    <>
      <SubmitButton
        id={'del-ip'}
        aria-describedby={'del-ip'}
        label={T['cluster.vnet.del.ip']}
        importance={STYLE_BUTTONS.IMPORTANCE.DANGER}
        size={STYLE_BUTTONS.SIZE.MEDIUM}
        type={STYLE_BUTTONS.TYPE.OUTLINED}
        onClick={(evt) => {
          show()
        }}
      />

      {display && (
        <DialogConfirmation
          handleCancel={() => hide()}
          title={T['cluster.vnet.del.ip']}
          dataCy={'modal-del-ip'}
          fixedWidth
        >
          <Stack gap="1em" py="0.8em">
            {addressRanges.map((ar) => (
              <AddressRangeCard
                key={ar.AR_ID}
                vnet={vnet}
                ar={ar}
                actions={
                  <>
                    {actions[DELETE_AR] === true && (
                      <DeleteAddressRangeAction
                        vnetId={vnet?.ID}
                        ar={ar}
                        oneConfig={oneConfig}
                        adminGroup={adminGroup}
                        submit={submit}
                      />
                    )}
                  </>
                }
              />
            ))}
          </Stack>
        </DialogConfirmation>
      )}
    </>
  )
}

DeleteIps.propTypes = {
  vnet: PropTypes.object,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  actions: PropTypes.array,
  submit: PropTypes.object,
}
DeleteIps.displayName = 'DeleteIps'

export { AddIps, DeleteIps }
