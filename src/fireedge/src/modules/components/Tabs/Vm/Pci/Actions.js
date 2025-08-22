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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { Trash, Edit } from 'iconoir-react'

import ButtonToTriggerForm from '@modules/components/Forms/ButtonToTriggerForm'
import { AttachPciForm } from '@modules/components/Forms/Vm'
import { Tr, Translate } from '@modules/components/HOC'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { useGeneralApi } from '@FeaturesModule'

const AttachPciAction = memo(
  ({ vmId, pci, indexPci, onSubmit, sx, oneConfig, adminGroup }) => {
    const { setFieldPath } = useGeneralApi()

    return (
      <ButtonToTriggerForm
        buttonProps={
          pci
            ? {
                'data-cy': `edit-${indexPci}`,
                icon: <Edit />,
                tooltip: Tr(T.Edit),
                sx,
              }
            : {
                'data-cy': 'attach-pci',
                label: T.AttachPci,
                sx,
                importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
                size: STYLE_BUTTONS.SIZE.MEDIUM,
                type: STYLE_BUTTONS.TYPE.FILLED,
              }
        }
        options={[
          {
            dialogProps: { title: T.AttachPci, dataCy: 'modal-attach-pci' },
            form: () => {
              setFieldPath(`extra.PciDevices.PCI.${indexPci}`)

              return AttachPciForm({
                initialValues: pci,
                stepProps: { oneConfig, adminGroup },
              })
            },
            onSubmit: onSubmit,
          },
        ]}
      />
    )
  }
)

const DetachPciAction = memo(
  ({ vmId, indexPci, onSubmit, sx, oneConfig, adminGroup }) => (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `detach-pci-${indexPci}`,
        icon: <Trash />,
        tooltip: Tr(T.Detach),
        sx,
      }}
      options={[
        {
          isConfirmDialog: true,
          dialogProps: {
            title: (
              <Translate word={T.DetachSomething} values={`PCI${indexPci}`} />
            ),
            children: <p>{Tr(T.DoYouWantProceed)}</p>,
          },
          onSubmit: onSubmit,
        },
      ]}
    />
  )
)

const ActionPropTypes = {
  vmId: PropTypes.string,
  pci: PropTypes.object,
  snapshot: PropTypes.object,
  name: PropTypes.string,
  onSubmit: PropTypes.func,
  sx: PropTypes.object,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  indexPci: PropTypes.number,
}

AttachPciAction.propTypes = ActionPropTypes
AttachPciAction.displayName = 'AttachPciAction'
DetachPciAction.propTypes = ActionPropTypes
DetachPciAction.displayName = 'DetachPciAction'

export { AttachPciAction, DetachPciAction }
