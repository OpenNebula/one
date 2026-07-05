#!/bin/bash
# PCI probe with Virtual Function relationship monitoring
# Outputs JSON array of PCI devices with PF/VF information

SYSFS_PCI="/sys/bus/pci/devices"

if [ ! -d "$SYSFS_PCI" ]; then
    echo "[]"
    exit 1
fi

echo "["
first=true
for devdir in "$SYSFS_PCI"/*; do
    [ -d "$devdir" ] || continue
    pci_addr=$(basename "$devdir")
    
    # Read base attributes
    vendor=$(cat "$devdir/vendor" 2>/dev/null | tr -d '\n' | tr -d ' ')
    device=$(cat "$devdir/device" 2>/dev/null | tr -d '\n' | tr -d ' ')
    class=$(cat "$devdir/class" 2>/dev/null | tr -d '\n' | tr -d ' ')
    numa_node=$(cat "$devdir/numa_node" 2>/dev/null || echo "-1")
    driver=""
    if [ -L "$devdir/driver" ]; then
        driver=$(basename $(readlink "$devdir/driver"))
    fi
    
    # Get interface name if net device
    ifname=""
    for netdev in "$devdir/net"/*; do
        [ -d "$netdev" ] || continue
        ifname=$(basename "$netdev")
        break
    done
    
    # Determine PF/VF relationships
    pf_address=""
    vf_list=()
    if [ -L "$devdir/physfn" ]; then
        # This is a VF
        pf_path=$(readlink -f "$devdir/physfn")
        pf_address=$(basename "$pf_path")
    elif [ -f "$devdir/sriov_totalvfs" ]; then
        # This is a PF
        total_vfs=$(cat "$devdir/sriov_totalvfs" 2>/dev/null || echo 0)
        if [ "$total_vfs" -gt 0 ]; then
            for virtfn in "$devdir/virtfn"*; do
                [ -L "$virtfn" ] || continue
                vf_pci=$(basename $(readlink -f "$virtfn"))
                vf_list+=("$vf_pci")
            done
        fi
    fi
    
    # Check if it's a VF by class (DPDK-style)
    vf_class=""
    if [ -n "$pf_address" ]; then
        vf_class="Virtual Function"
    fi
    
    # Build JSON object
    if [ "$first" = true ]; then
        first=false
    else
        echo ","
    fi
    
    echo "  {"
    echo "    \"PCI_ID\": \"$pci_addr\","
    echo "    \"VENDOR\": \"$vendor\","
    echo "    \"DEVICE\": \"$device\","
    echo "    \"CLASS\": \"$class\","
    echo "    \"NUMA_NODE\": \"$numa_node\","
    echo "    \"DRIVER\": \"$driver\","
    echo "    \"SHORT_ADDRESS\": \"$pci_addr\","
    if [ -n "$ifname" ]; then
        echo "    \"IFCONF_NAME\": \"$ifname\","
    fi
    echo "    \"PCI_ROLE\": \"$([ -n "$pf_address" ] && echo 'VF' || ([ -f "$devdir/sriov_totalvfs" ] && echo 'PF') || echo '')\","
    if [ -n "$pf_address" ]; then
        echo "    \"PF_ADDRESS\": \"$pf_address\","
    fi
    if [ ${#vf_list[@]} -gt 0 ]; then
        echo "    \"VF_COUNT\": ${#vf_list[@]},"
        echo "    \"VF_LIST\": ["
        for i in "${!vf_list[@]}"; do
            if [ $i -gt 0 ]; then echo ","; fi
            echo "      \"${vf_list[$i]}\""
        done
        echo "    ]"
    fi
    echo "  }"
done
echo "]"
