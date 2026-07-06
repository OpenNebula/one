import re

class PCIAffinityScheduler:
    """Filter hosts based on PCI device affinity/antiaffinity constraints."""

    @staticmethod
    def filter_hosts(hosts, vm_request):
        """
        Filter hosts that can satisfy the VM's PCI affinity constraints.
        
        Args:
            hosts (list): List of host dictionaries, each containing 'pci_devices' list.
            vm_request (dict): VM request with 'pci_devices' list, each having fields:
                - vendor (str, optional)
                - device (str, optional)
                - class_id (str, optional)
                - affinity_group (str, optional): Group ID for affinity/antiaffinity.
                - affinity_type (str): 'affinity' or 'antiaffinity'.
        Returns:
            list: Hosts that meet all constraints.
        """
        if not vm_request.get('pci_devices'):
            return hosts

        # Group requested devices by affinity constraints
        affinity_groups = {}
        for dev in vm_request['pci_devices']:
            group = dev.get('affinity_group', None)
            if group and dev.get('affinity_type'):
                affinity_groups.setdefault(group, []).append(dev)
            # Devices without constraints are ignored for affinity

        def host_satisfies(host):
            host_pci = host.get('pci_devices', [])
            # For each affinity group, check host can assign devices meeting constraints
            for group, devices in affinity_groups.items():
                if not devices:
                    continue
                # For antiaffinity: each device must use a different 'affinity_key' (e.g., bus address of PF)
                # For affinity: all devices must share the same 'affinity_key'
                # Determine the available key candidates from host that match the device filters
                candidates = []
                for host_dev in host_pci:
                    if any(PCIAffinityScheduler._matches(host_dev, req) for req in devices):
                        # Determine the affinity key: e.g., the bus address without function (for SR-IOV PF)
                        key = host_dev.get('parent_bus', host_dev.get('bus'))
                        candidates.append(key)
                # Deduplicate unique keys
                unique_keys = set(candidates)
                # For antiaffinity: need at least as many unique keys as devices
                # For affinity: need at least one key that can host all devices (same key)
                affinity_type = devices[0].get('affinity_type')
                if affinity_type == 'antiaffinity':
                    if len(unique_keys) < len(devices):
                        return False
                elif affinity_type == 'affinity':
                    # Check if any key appears at least len(devices) times
                    if not any(candidates.count(key) >= len(devices) for key in unique_keys):
                        return False
                # else ignore
            return True

        return [h for h in hosts if host_satisfies(h)]

    @staticmethod
    def _matches(host_dev, req):
        """Check if host device matches the request's filter criteria."""
        if req.get('vendor') and str(host_dev.get('vendor','')).lower() != str(req['vendor']).lower():
            return False
        if req.get('device') and str(host_dev.get('device','')).lower() != str(req['device']).lower():
            return False
        if req.get('class_id') and str(host_dev.get('class_id','')).lower() != str(req['class_id']).lower():
            return False
        # Additional checks can be added (e.g., address match)
        return True
