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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { Trash, Edit } from 'iconoir-react'

import { AttachPciForm } from '@modules/resources/resources/VirtualMachine/Forms'
import { useTranslation } from '@ProvidersModule'
import { T } from '@ConstantsModule'
import { useGeneralApi, useModalsApi } from '@FeaturesModule'

import { SubmitButton } from '@ComponentsV2Module'

const AttachPciAction = memo(
  ({ vmId, pci, indexPci, onSubmit, sx, oneConfig, adminGroup }) => {
    const { translate } = useTranslation()
    const { showModal } = useModalsApi()

    const { setFieldPath } = useGeneralApi()

    const handleOpenForm = () => {
      setFieldPath(`extra.PciDevices.PCI.${indexPci}`)
      showModal({
        dialogProps: { title: T.AttachPci, dataCy: 'modal-attach-pci' },
        onSubmit: onSubmit,

        form: AttachPciForm({
          initialValues: pci,
          stepProps: { oneConfig, adminGroup },
        }),
      })
    }

    return (
      <SubmitButton
        data-cy={`edit-${indexPci}`}
        iconOnly={<Edit />}
        tooltip={translate(T.Edit)}
        label={T.AttachPci}
        onClick={handleOpenForm}
      />
    )
  }
)

const DetachPciAction = memo(
  ({ vmId, indexPci, onSubmit, sx, oneConfig, adminGroup }) => {
    const { translate } = useTranslation()

    return (
      <SubmitButton
        data-cy={`detach-pci-${indexPci}`}
        iconOnly={<Trash />}
        tooltip={translate(T.Detach)}
      />
    )
  }
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
