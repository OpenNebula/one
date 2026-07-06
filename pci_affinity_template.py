import re

class PCIAffinityTemplate:
    """Parse VM template attributes for PCI affinity/antiaffinity."""

    @staticmethod
    def parse_pci_attributes(template_str):
        """
        Parse VM template string and extract PCI device requests with affinity.
        
        Expected format:
            PCI_PASSTHROUGH = [
                "vendor=0x8086, device=0x10fb, affinity_group=group1, affinity_type=antiaffinity",
                "vendor=0x8086, device=0x10fb, affinity_group=group1, affinity_type=antiaffinity"
            ]
        Returns:
            list: List of dicts with parsed fields.
        """
        devices = []
        # Match one or more PCI_PASSTHROUGH lines
        pattern = r'PCI_PASSTHROUGH\s*=\s*\[([^\]]+)\]'
        match = re.search(pattern, template_str, re.IGNORECASE | re.DOTALL)
        if not match:
            return devices

        content = match.group(1)
        # Split by comma-separated entries in quotes? Each entry is a string inside [ ... ]
        # We'll split by double quotes and parse each
        entries = re.findall(r'"([^"]+)"', content)
        for entry in entries:
            device = {}
            parts = entry.split(',')
            for part in parts:
                part = part.strip()
                if '=' not in part:
                    continue
                key, value = part.split('=', 1)
                key = key.strip().lower()
                value = value.strip()
                if key == 'vendor':
                    device['vendor'] = value
                elif key == 'device':
                    device['device'] = value
                elif key == 'class':
                    device['class_id'] = value
                elif key == 'affinity_group':
                    device['affinity_group'] = value
                elif key == 'affinity_type':
                    if value.lower() in ('affinity', 'antiaffinity'):
                        device['affinity_type'] = value.lower()
                # Add other PCI fields as needed
            if 'affinity_type' in device and 'affinity_group' in device:
                devices.append(device)
        return devices
