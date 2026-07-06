#include <string>
#include <vector>
#include <sstream>
#include <algorithm>
#include "VirtualNetwork.h"
#include "NebulaLog.h"

// ... existing code ...

void VirtualNetwork::parse(const std::map<std::string, std::string>& attrs)
{
    // ... existing parsing code ...

    // Get tag and trunks
    std::string tag_str = attrs.get("VLAN_TAG");
    std::string trunks_str = attrs.get("VLAN_TRUNKS");

    if (!tag_str.empty() && !trunks_str.empty())
    {
        int tag = std::stoi(tag_str);

        std::vector<int> trunks;
        std::istringstream iss(trunks_str);
        std::string token;
        while (std::getline(iss, token, ','))
        {
            trunks.push_back(std::stoi(token));
        }

        if (std::find(trunks.begin(), trunks.end(), tag) != trunks.end())
        {
            std::ostringstream oss;
            oss << "Warning: VLAN tag " << tag << " is also present in VLAN trunks list (" << trunks_str << "). This configuration is valid for Open vSwitch but likely unintended.";
            NebulaLog::log("VNM", Log::WARNING, oss.str());
        }
    }

    // ... rest of parsing ...
}
