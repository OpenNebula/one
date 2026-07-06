#!/usr/bin/env python3
"""
PCI probe that extracts device information including SR-IOV PF/VF relationships.
Complements the network interface names and roles improvement.
Outputs JSON to stdout.
"""

import json
import os
import sys

SYS_BUS_PCI = '/sys/bus/pci/devices'

def read_sys_file(path):
    """Read a sysfs file and return stripped content, or None."""
    try:
        with open(path, 'r') as f:
            return f.read().strip()
    except (IOError, OSError):
        return None

def get_pci_devices():
    """Return list of all PCI addresses in /sys/bus/pci/devices."""
    if not os.path.isdir(SYS_BUS_PCI):
        return []
    return os.listdir(SYS_BUS_PCI)

def get_device_info(pci_addr):
    """Extract info for a single PCI device."""
    dev_path = os.path.join(SYS_BUS_PCI, pci_addr)
    info = {}
    info['address'] = pci_addr

    # Basic identifiers
    vendor = read_sys_file(os.path.join(dev_path, 'vendor'))
    device = read_sys_file(os.path.join(dev_path, 'device'))
    class_code = read_sys_file(os.path.join(dev_path, 'class'))
    subsystem_vendor = read_sys_file(os.path.join(dev_path, 'subsystem_vendor'))
    subsystem_device = read_sys_file(os.path.join(dev_path, 'subsystem_device'))
    numa_node = read_sys_file(os.path.join(dev_path, 'numa_node'))

    if vendor:
        info['vendor'] = vendor
    if device:
        info['device'] = device
    if class_code:
        info['class'] = class_code
    if subsystem_vendor:
        info['subsystem_vendor'] = subsystem_vendor
    if subsystem_device:
        info['subsystem_device'] = subsystem_device
    try:
        info['numa_node'] = int(numa_node) if numa_node is not None else -1
    except (ValueError, TypeError):
        info['numa_node'] = -1

    # Driver
    driver_link = os.path.join(dev_path, 'driver')
    if os.path.islink(driver_link):
        driver_path = os.readlink(driver_link)
        info['driver'] = os.path.basename(driver_path)
    else:
        info['driver'] = None

    # Network interface name (if net device)
    net_dir = os.path.join(dev_path, 'net')
    if os.path.isdir(net_dir):
        try:
            interfaces = os.listdir(net_dir)
            if interfaces:
                info['if'] = interfaces[0]  # Assuming single interface per device
        except OSError:
            pass

    # SR-IOV detection
    physfn_link = os.path.join(dev_path, 'physfn')
    if os.path.islink(physfn_link):
        info['role'] = 'VF'
        physfn_path = os.readlink(physfn_link)
        info['pf_address'] = os.path.basename(physfn_path)
    else:
        # Check if this device has Virtual Functions (virtfn* directories)
        virtfn_dirs = [d for d in os.listdir(dev_path) if d.startswith('virtfn')]
        if virtfn_dirs:
            info['role'] = 'PF'
            vf_list = []
            for vfn in sorted(virtfn_dirs, key=lambda x: int(x[6:]) if x[6:].isdigit() else 0):
                vf_link = os.path.join(dev_path, vfn)
                if os.path.islink(vf_link):
                    vf_path = os.readlink(vf_link)
                    vf_list.append(os.path.basename(vf_path))
            info['vf_addresses'] = vf_list
        else:
            info['role'] = 'other'

    # IOMMU group (optional, useful for passthrough)
    iommu_group_link = os.path.join(dev_path, 'iommu_group')
    if os.path.islink(iommu_group_link):
        iommu_path = os.readlink(iommu_group_link)
        info['iommu_group'] = os.path.basename(iommu_path)

    return info

def main():
    devices = get_pci_devices()
    if not devices:
        print(json.dumps({'error': 'Could not access PCI devices'}, indent=2))
        sys.exit(1)

    result = []
    for addr in devices:
        info = get_device_info(addr)
        result.append(info)

    # Sort by address for consistency
    result.sort(key=lambda x: x['address'])

    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
