// ... existing code ...

// Added function to check OVS VLAN tag conflict
static void check_ovs_vlan_conflict(const VectorAttribute* vlan, const string& driver) {
    if (driver != "ovswitch") return;

    string tag_str = vlan->vector_value("TAG");
    string trunks_str = vlan->vector_value("TRUNKS");
    if (tag_str.empty() || trunks_str.empty()) return;

    int tag = atoi(tag_str.c_str());
    if (tag < 1 || tag > 4094) return;

    // Parse trunks
    vector<string> trunks;
    stringstream ss(trunks_str);
    string token;
    while (getline(ss, token, ',')) {
        int trunk = atoi(token.c_str());
        if (trunk < 1 || trunk > 4094) continue;
        if (trunk == tag) {
            NebulaLog::warn("VNM", "OVS VLAN configuration warning: tag " + tag_str +
                            " is included in trunks: " + trunks_str);
            // Optionally fail: throw exception
            // throw NebulaException("OVS VLAN tag cannot be in trunks.");
            break;
        }
    }
}

// In VirtualNetwork::parse() (or post_update_template) add call
// Assuming the VLAN attribute is retrieved as "VLAN"
void VirtualNetwork::parse(const Template& tmpl) {
    // ... existing parsing ...
    const VectorAttribute* vlan = tmpl.get("VLAN");
    if (vlan != nullptr) {
        string driver = tmpl.get("VLAN_DRIVER") ? tmpl.get("VLAN_DRIVER")->value() : "";
        check_ovs_vlan_conflict(vlan, driver);
    }
    // ... rest ...
}

// In post_update_template() similar call
void VirtualNetwork::post_update_template(const Template& tmpl) {
    // ... existing ...
    const VectorAttribute* vlan = tmpl.get("VLAN");
    if (vlan != nullptr) {
        string driver = get_vlan_driver(); // or from existing
        check_ovs_vlan_conflict(vlan, driver);
    }
    // ... rest ...
}

// ... existing code ...