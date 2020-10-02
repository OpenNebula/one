import { STEP_ID as APPLICATION_ID } from 'client/containers/Application/Create/Steps/BasicConfiguration';
import { STEP_ID as CLUSTER_ID } from 'client/containers/Application/Create/Steps/Clusters';
import { STEP_ID as NETWORKING_ID } from 'client/containers/Application/Create/Steps/Networking';
import { STEP_ID as TIERS_ID } from 'client/containers/Application/Create/Steps/Tiers';

const mapNetworkToUserInput = network => {
  const { mandatory, description, type, idVnet, extra } = network;

  const mandatoryValue = mandatory ? 'M' : 'O';
  const descriptionValue = description ?? '';
  const idVnetValue = idVnet ?? '';
  const extraValue = `:${extra}` ?? '';

  return `${mandatoryValue}|network|${descriptionValue}| |${type}:${idVnetValue}${extraValue}`;
};

const mapTiersToRoles = (tiers, networking, cluster) =>
  tiers?.map(data => {
    const { template, networks, parents, policies, position, tier } = data;

    const networksValue = networks
      ?.reduce((res, id, idx) => {
        const network = networking.find(net => net.id === id);
        const networkString = `NIC = [\n NAME = "NIC${idx}",\n NETWORK_ID = "$${network.name}" ]\n`;

        return [...res, networkString];
      }, [])
      ?.join('')
      ?.concat(`SCHED_REQUIREMENTS = "ClUSTER_ID="${cluster}""`);

    const parentsValue = parents?.reduce((res, id) => {
      const parent = tiers.find(t => t.id === id);
      return [...res, parent?.tier?.name];
    }, []);

    return {
      ...tier,
      parents: parentsValue,
      vm_template: template ? parseInt(template?.template, 10) : undefined,
      vm_template_contents: networksValue,
      elasticity_policies: [],
      scheduled_policies: [],
      position
    };
  });

const mapFormToApplication = data => {
  const {
    [APPLICATION_ID]: application,
    [NETWORKING_ID]: networking,
    [CLUSTER_ID]: cluster,
    [TIERS_ID]: tiers
  } = data;

  return {
    ...application,
    networks:
      networking?.reduce(
        (res, { name, ...network }) => ({
          ...res,
          [name]: mapNetworkToUserInput(network)
        }),
        {}
      ) ?? {},
    roles: mapTiersToRoles(tiers, networking, cluster)
  };
};

export default mapFormToApplication;
