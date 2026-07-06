// ... existing code ...

#include <sstream>

// ... other includes ...

void VirtualNetwork::check_ovs_vlan_conflict()
{
    int tag;
    vector<int> trunks;
    bool has_tag = get_template_attribute("VLAN_ID", tag);
    bool has_trunks = get_template_attribute("VLAN_TRUNKS", trunks);

    if (has_tag && has_trunks)
    {
        for (size_t i = 0; i < trunks.size(); ++i)
        {
            if (trunks[i] == tag)
            {
                ostringstream oss;
                oss << "Warning: VLAN tag " << tag << " is also listed in VLAN_TRUNKS. This configuration is ambiguous in Open vSwitch.";
                NebulaLog::log("VNM", Log::WARNING, oss.str());
                break;
            }
        }
    }
}

// In the method that processes template update/create (e.g., add_template or post_update_template)
// Add call to check_ovs_vlan_conflict() after setting VLAN attributes.
// Example:

int VirtualNetwork::post_update_template()
{
    // ... existing logic ...
    check_ovs_vlan_conflict();
    // ... continue ...
}

// Similarly for create, call check_ovs_vlan_conflict() after parsing template.
