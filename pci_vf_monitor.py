#!/usr/bin/env python3
"""
OpenNebula PCI probe enhancement: add Physical Function (PF) to Virtual Function (VF) relationship.
This script reads /sys/bus/pci/devices/ and outputs a JSON array of PCI devices,
enriched with PF address for VFs and list of VF addresses for PFs.
"""

import json
import os
import sys

def read_sysfs(path):
    try:
        with open(path, 'r') as f:
            return f.read().strip()
    except (FileNotFoundError, IOError):
        return None

def get_pci_devices():
    devices_path = '/sys/bus/pci/devices'
    devices = {}
    try:
        for dev in os.listdir(devices_path):
            dev_path = os.path.join(devices_path, dev)
            if not os.path.isdir(dev_path):
                continue
            vendor = read_sysfs(os.path.join(dev_path, 'vendor'))
            device = read_sysfs(os.path.join(dev_path, 'device'))
            if not vendor or not device:
                continue
            # Check if it's a VF by looking for physfn link
            physfn_link = os.path.join(dev_path, 'physfn')
            if os.path.islink(physfn_link):
                pf_bdf = os.path.basename(os.readlink(physfn_link))
                role = 'VF'
            else:
                pf_bdf = None
                # Check if it's a PF by looking for virtfn links
                role = 'PF' if os.path.isdir(os.path.join(dev_path, 'virtfn0')) else 'OTHER'
            devices[dev] = {
                'address': dev,
                'vendor': vendor,
                'device': device,
                'role': role,
                'pf_address': pf_bdf,
                'vf_list': [] if role == 'PF' else None
            }
    except OSError as e:
        print(f"Error reading PCI devices: {e}", file=sys.stderr)
        sys.exit(1)
    # Second pass: populate vf_list for PFs
    for dev, info in devices.items():
        if info['role'] == 'PF':
            dev_path = os.path.join(devices_path, dev)
            i = 0
            while True:
                vf_link = os.path.join(dev_path, f'virtfn{i}')
                if os.path.islink(vf_link):
                    vf_bdf = os.path.basename(os.readlink(vf_link))
                    if vf_bdf in devices:
                        info['vf_list'].append(vf_bdf)
                    i += 1
                else:
                    break
    return list(devices.values())

if __name__ == '__main__':
    devices = get_pci_devices()
    print(json.dumps(devices, indent=2))
