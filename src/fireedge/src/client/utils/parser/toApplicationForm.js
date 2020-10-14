import { v4 as uuidv4 } from 'uuid';

import { STEP_ID as APPLICATION_ID } from 'client/containers/ApplicationsTemplates/Create/Steps/BasicConfiguration';
import { STEP_ID as CLUSTER_ID } from 'client/containers/ApplicationsTemplates/Create/Steps/Clusters';
import { STEP_ID as NETWORKING_ID } from 'client/containers/ApplicationsTemplates/Create/Steps/Networking';
import { STEP_ID as TIERS_ID } from 'client/containers/ApplicationsTemplates/Create/Steps/Tiers';

import parseTemplateToObject from './templateToObject';

const parseNetwork = input => {
  const [name, values] = input;
  const network = String(values).split('|');
  // 0 mandatory; 1 network (user input type); 2 description; 3 empty; 4 info_network;
  const mandatory = network[0] === 'M';
  const description = network[2];

  // 0 type; 1 id; 3 extra (optional)
  const info = network[4].split(':');
  const type = info[0];
  const idVnet = info[1];
  const extra = info[2] ?? '';

  return {
    id: uuidv4(),
    name,
    mandatory,
    description,
    type,
    idVnet,
    extra
  };
};

const parseCluster = tiers => {
  const NUM_REG = /(\d+)/g;

  const clusters = tiers?.map(({ vm_template_contents: content = '' }) => {
    const { sched_requirements: schedRequirements } = parseTemplateToObject(
      content
    );

    return schedRequirements?.match(NUM_REG)?.join();
  });

  return clusters?.find(i => i !== undefined);
};

const parseTiers = (roles, networking) =>
  roles
    ?.reduce((res, data) => {
      const {
        name,
        cardinality,
        parents,
        shutdown_action: shutdownAction,
        vm_template: vmTemplate,
        vm_template_contents: content = '',
        elasticity_policies: elasticityPolicies,
        scheduled_policies: scheduledPolicies,
        position = { x: 0, y: 0 }
      } = data;

      const hash = parseTemplateToObject(content);
      const nics = hash.nic;

      const networks =
        nics?.map(({ network_id: networkId }) => {
          const nicName = networkId?.replace('$', '');
          const network = networking?.find(vnet => vnet.name === nicName);
          return network.id;
        }) ?? [];

      return [
        ...res,
        {
          id: uuidv4(),
          template: { template: String(vmTemplate) },
          networks,
          parents,
          policies: { elasticityPolicies, scheduledPolicies },
          position,
          tier: { name, cardinality, shutdown_action: shutdownAction }
        }
      ];
    }, [])
    .reduce((res, tier, _, src) => {
      const parents = tier.parents?.map(name => {
        const parent = src.find(item => item.tier.name === name);
        return parent?.id;
      });

      return [...res, { ...tier, parents }];
    }, []);

const mapApplicationToForm = data => {
  const {
    NAME,
    TEMPLATE: {
      BODY: { networks = [], roles, ...application }
    }
  } = data;

  const networking = Object.entries(networks)?.map(parseNetwork) ?? [];
  const tiers = parseTiers(roles, networking) ?? [];
  const cluster = [...(parseCluster(roles) ?? '')];

  return {
    [APPLICATION_ID]: {
      ...application,
      name: NAME
    },
    [NETWORKING_ID]: networking,
    [CLUSTER_ID]: cluster,
    [TIERS_ID]: tiers
  };
};

export default mapApplicationToForm;
