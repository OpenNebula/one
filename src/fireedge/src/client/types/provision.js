import PropTypes from 'prop-types'

export const UserInput = PropTypes.shape({
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  type: PropTypes.oneOf([
    'text',
    'text64',
    'password',
    'number',
    'number-float',
    'range',
    'range-float',
    'boolean',
    'list',
    'array',
    'list-multiple'
  ]).isRequired,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  min_value: PropTypes.number,
  max_value: PropTypes.number,
  default: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ])
})

export const ProviderType = PropTypes.oneOf(['aws', 'packet'])

export const ProvisionType = PropTypes.oneOf([
  'hybrid+',
  'hybrid+_qemu',
  'hybrid+_firecracker'
])

export const ProvisionHost = PropTypes.shape({
  im_mad: PropTypes.string.isRequired,
  vm_mad: PropTypes.string.isRequired,
  provision: PropTypes.shape({
    count: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    hostname: PropTypes.string
  })
})

export const ProviderPlainInfo = PropTypes.shape({
  image: PropTypes.string,
  location_key: PropTypes.string,
  provision_type: ProvisionType.isRequired
})

export const ProviderTemplate = PropTypes.shape({
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  provider: ProviderType.isRequired,
  plain: ProviderPlainInfo.isRequired,
  connection: PropTypes.objectOf(PropTypes.string),
  inputs: PropTypes.arrayOf(UserInput)
})

export const ProvisionTemplate = PropTypes.shape({
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  provider: ProviderType.isRequired,
  provision_type: ProvisionType.isRequired,
  defaults: PropTypes.shape({
    provision: PropTypes.shape({
      provider_name: PropTypes.string
    })
  }).isRequired,
  hosts: PropTypes.arrayOf(ProvisionHost),
  inputs: PropTypes.arrayOf(UserInput)
})

export const Provider = PropTypes.shape({
  ID: PropTypes.string.isRequired,
  UID: PropTypes.string.isRequired,
  GID: PropTypes.string.isRequired,
  UNAME: PropTypes.string.isRequired,
  GNAME: PropTypes.string.isRequired,
  NAME: PropTypes.string.isRequired,
  TYPE: PropTypes.string.isRequired,
  PERMISSIONS: PropTypes.shape({
    OWNER_U: PropTypes.oneOf(['0', '1']).isRequired,
    OWNER_M: PropTypes.oneOf(['0', '1']).isRequired,
    OWNER_A: PropTypes.oneOf(['0', '1']).isRequired,
    GROUP_U: PropTypes.oneOf(['0', '1']).isRequired,
    GROUP_M: PropTypes.oneOf(['0', '1']).isRequired,
    GROUP_A: PropTypes.oneOf(['0', '1']).isRequired,
    OTHER_U: PropTypes.oneOf(['0', '1']).isRequired,
    OTHER_M: PropTypes.oneOf(['0', '1']).isRequired,
    OTHER_A: PropTypes.oneOf(['0', '1']).isRequired
  }).isRequired,
  TEMPLATE: PropTypes.shape({
    PLAIN: ProviderPlainInfo,
    PROVISION_BODY: PropTypes.oneOfType([
      // encrypted
      PropTypes.string,
      PropTypes.shape({
        provider: ProviderType,
        connection: PropTypes.objectOf(PropTypes.string),
        registration_time: PropTypes.number,
        description: PropTypes.string,
        inputs: PropTypes.arrayOf(UserInput)
      }).isRequired
    ])
  })
})

const ProvisionInfrastructure = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired
})

export const Provision = PropTypes.shape({
  ID: PropTypes.string.isRequired,
  UID: PropTypes.string.isRequired,
  GID: PropTypes.string.isRequired,
  UNAME: PropTypes.string.isRequired,
  GNAME: PropTypes.string.isRequired,
  NAME: PropTypes.string.isRequired,
  TYPE: PropTypes.string.isRequired,
  PERMISSIONS: PropTypes.shape({
    OWNER_U: PropTypes.oneOf(['0', '1']).isRequired,
    OWNER_M: PropTypes.oneOf(['0', '1']).isRequired,
    OWNER_A: PropTypes.oneOf(['0', '1']).isRequired,
    GROUP_U: PropTypes.oneOf(['0', '1']).isRequired,
    GROUP_M: PropTypes.oneOf(['0', '1']).isRequired,
    GROUP_A: PropTypes.oneOf(['0', '1']).isRequired,
    OTHER_U: PropTypes.oneOf(['0', '1']).isRequired,
    OTHER_M: PropTypes.oneOf(['0', '1']).isRequired,
    OTHER_A: PropTypes.oneOf(['0', '1']).isRequired
  }).isRequired,
  TEMPLATE: PropTypes.shape({
    BODY: PropTypes.shape({
      name: PropTypes.string,
      description: PropTypes.string,
      start_time: PropTypes.number,
      state: PropTypes.number,
      provider: PropTypes.string,
      provision: PropTypes.shape({
        infrastructure: PropTypes.shape({
          clusters: PropTypes.arrayOf(ProvisionInfrastructure),
          datastores: PropTypes.arrayOf(ProvisionInfrastructure),
          networks: PropTypes.arrayOf(ProvisionInfrastructure)
        }),
        resource: PropTypes.object
      }),
      image: PropTypes.string,
      provision_type: ProvisionType
    }).isRequired
  })
})
