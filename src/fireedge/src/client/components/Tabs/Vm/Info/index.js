import * as React from 'react'
import PropTypes from 'prop-types'

import { Permissions, Ownership } from 'client/components/Tabs/Common'
import Information from 'client/components/Tabs/Vm/Info/information'

const VmInfoTab = ({ tabProps, ...data }) => {
  const { ID, UNAME, GNAME, PERMISSIONS } = data

  return (
    <div style={{
      display: 'grid',
      gap: '1em',
      gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
      padding: '1em'
    }}>
      {tabProps?.information_panel?.enabled &&
        <Information {...data} />
      }
      {tabProps?.permissions_panel?.enabled &&
        <Permissions id={ID} {...PERMISSIONS} />
      }
      {tabProps?.ownership_panel?.enabled &&
        <Ownership userName={UNAME} groupName={GNAME} />
      }
    </div>
  )
}

VmInfoTab.propTypes = {
  tabProps: PropTypes.object
}

VmInfoTab.displayName = 'VmInfoTab'

export default VmInfoTab
