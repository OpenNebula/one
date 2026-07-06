// ... existing headers and includes ...

void OVSwitchDriver::_check_vlan_conflict(VirtualNetwork* vnet)
{
    int tag = vnet->get_vlan_id();
    const vector<int>& trunks = vnet->get_trunk_ids();

    if (tag != 0 && !trunks.empty())
    {
        auto it = find(trunks.begin(), trunks.end(), tag);
        if (it != trunks.end())
        {
            ostringstream oss;
            oss << "Conflicting OVS VLAN configuration: tag " << tag
                << " is also listed in trunks (" << *it << "). "
                << "This is valid for OVS but likely a misconfiguration.";
            NebulaLog::log("VNM", Log::WARNING, oss.str());
        }
    }
}

// In the appropriate create/update function, call _check_vlan_conflict(vnet);