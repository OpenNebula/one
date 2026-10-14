#!/bin/bash
set -e

VM_NAME="one-fabricmanager"
BASE_XML_TPL="/etc/one/one-fabricmanager.xml"
CONFIG_FILE="/etc/one/fabricmanager.conf"
FINAL_XML="/var/lib/one/fabricmanager/${VM_NAME}.xml"

# --- 1. Load Configuration ---
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: Configuration file $CONFIG_FILE not found." >&2
  exit 1
fi
source "$CONFIG_FILE" || { echo "Error sourcing config file $CONFIG_FILE"; exit 1; }

# --- 2. Dynamic UEFI (OS) Generation ---
if [ -f /usr/share/OVMF/OVMF_CODE_4M.fd ]; then
  # Ubuntu 24.04
  LOADER_PATH="/usr/share/OVMF/OVMF_CODE_4M.fd"
  NVRAM_TEMPLATE_PATH="/usr/share/OVMF/OVMF_VARS_4M.fd"
  OS_XML_FRAGMENT="  <os>\n    <type arch='x86_64' machine='q35'>hvm</type>\n    <loader readonly='yes' type='pflash'>$LOADER_PATH</loader>\n    <nvram template='$NVRAM_TEMPLATE_PATH'/>\n  </os>"
else
  # Ubuntu 22.04
  LOADER_PATH="/usr/share/OVMF/OVMF_CODE.fd"
  OS_XML_FRAGMENT="  <os>\n    <type arch='x86_64' machine='q35'>hvm</type>\n    <loader readonly='yes' type='pflash'>$LOADER_PATH</loader>\n    <nvram/>\n  </os>"
fi

# --- 3. Dynamic PCI Auto-Discovery ---
PCI_XML_FRAGMENT=""
GUEST_BUS_DECIMAL=1

echo "Scanning for NVSwitch devices (Vendor: $VENDOR_ID, Devices: $NVS_IDS)..."

# Iterate over all PCI devices
for dev_path in /sys/bus/pci/devices/*; do
  pci_addr=$(basename "$dev_path")

  # Read vendor and device ID from sysfs
  dev_vendor=$(cat "$dev_path/vendor")
  dev_id=$(cat "$dev_path/device")

  # Strip "0x" prefix
  dev_vendor=${dev_vendor#0x}
  dev_id=${dev_id#0x}

  # Check 1: Match Vendor ID
  if [ "$dev_vendor" != "$VENDOR_ID" ]; then
    continue
  fi

  # Check 2: Match one of the Device IDs
  found_id=false
  for allowed_id in $NVS_IDS; do
    if [ "$dev_id" == "$allowed_id" ]; then
      found_id=true
      break
    fi
  done

  if [ "$found_id" == "false" ]; then
    continue
  fi

  # Check 3: Verify the driver is vfio-pci
  driver=$(basename "$(readlink -f "$dev_path/driver")" 2>/dev/null || echo "none")
  if [ "$driver" != "vfio-pci" ]; then
    echo "  [SKIP] Found NVSwitch $pci_addr, but driver is '$driver' (expected 'vfio-pci')."
    continue
  fi

  # --- All checks passed. Add this device. ---
  echo "  [OK] Found valid NVSwitch: $pci_addr (Driver: $driver)"

  # Parse 0000:07:00.0 into domain, bus, slot, func
  domain="0x$(echo "$pci_addr" | cut -d: -f1)"
  bus="0x$(echo "$pci_addr" | cut -d: -f2)"
  slot="0x$(echo "$pci_addr" | cut -d: -f3 | cut -d. -f1)"
  func="0x$(echo "$pci_addr" | cut -d. -f2)"

  # Format guest bus ID (e.g. 1 -> "0x01")
  GUEST_BUS_HEX=$(printf "0x%02x" $GUEST_BUS_DECIMAL)

  # Add the complete <hostdev> block
  PCI_XML_FRAGMENT+="    <hostdev mode='subsystem' type='pci' managed='yes'>\n      <source>\n        <address domain='$domain' bus='$bus' slot='$slot' function='$func'/>\n      </source>\n      <address type='pci' domain='0x0000' bus='$GUEST_BUS_HEX' slot='0x00' function='0x0'/>\n    </hostdev>\n"

  GUEST_BUS_DECIMAL=$((GUEST_BUS_DECIMAL + 1))
done

# --- 4. Assemble Final XML ---
awk -v os_xml="$OS_XML_FRAGMENT" -v pci_xml="$PCI_XML_FRAGMENT" -v image_path="$IMAGE_PATH" '
  # First, substitute the image path
  {
    gsub("__IMAGE_PATH__", image_path)
  }

  # Insert the <os> block after </cpu>
  /<\/cpu>/ {
    print
    print os_xml
    next
  }

  # Insert the PCI <hostdev> blocks before </devices>
  /<\/devices>/ {
    print pci_xml
  }

  {
    print
  }
' "$BASE_XML_TPL" > "$FINAL_XML"

echo "Generated final XML at $FINAL_XML"
exit 0
