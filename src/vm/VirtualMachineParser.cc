/* -------------------------------------------------------------------------- */
/* Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */
#include "VirtualMachine.h"
#include "VirtualNetworkPool.h"
#include "DatastorePool.h"
#include "ImagePool.h"
#include "NebulaLog.h"
#include "NebulaUtil.h"
#include "Snapshots.h"
#include "HostShare.h"
#include "Nebula.h"

#include "vm_file_var_syntax.h"
#include "vm_var_syntax.h"
#include "vm_var_parser.h"

#include <sstream>

using namespace std;

/* -------------------------------------------------------------------------- */
/* Parser constanta                                                           */
/* -------------------------------------------------------------------------- */

const char * VirtualMachine::NO_NIC_DEFAULTS[] = {"NETWORK_ID", "NETWORK",
    "NETWORK_UID", "NETWORK_UNAME"};

const int VirtualMachine::NUM_NO_NIC_DEFAULTS = 4;

const char*  VirtualMachine::VROUTER_ATTRIBUTES[] = {
        "VROUTER_ID",
        "VROUTER_KEEPALIVED_ID",
        "VROUTER_KEEPALIVED_PASSWORD"};
const int VirtualMachine::NUM_VROUTER_ATTRIBUTES = 3;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/**
 *  Generates image attributes (DS_ID, TM_MAD, SOURCE...) for KERNEL and
 *  INITRD files.
 *    @param os attribute of the VM template
 *    @param base_name of the attribute "KERNEL", or "INITRD"
 *    @param base_type of the image attribute KERNEL, RAMDISK
 *    @param error_str Returns the error reason, if any
 *    @return 0 on succes
 */
int VirtualMachine::set_os_file(VectorAttribute* os, const string& base_name,
        Image::ImageType base_type, string& error_str)
{
    vector<int>  img_ids;
    Nebula& nd = Nebula::instance();

    ImagePool * ipool = nd.get_ipool();

    int img_id;

    Image::ImageType  type;
    Image::ImageState state;

    DatastorePool * ds_pool = nd.get_dspool();
    int             ds_id;

    string attr;
    string base_name_ds     = base_name + "_DS";
    string base_name_id     = base_name + "_DS_ID";
    string base_name_source = base_name + "_DS_SOURCE";
    string base_name_ds_id  = base_name + "_DS_DSID";
    string base_name_tm     = base_name + "_DS_TM";
    string base_name_cluster= base_name + "_DS_CLUSTER_ID";

    string type_str;

    attr = os->vector_value(base_name_ds);

    if ( attr.empty() )
    {
        return 0;
    }

    if ( parse_file_attribute(attr, img_ids, error_str) != 0 )
    {
        return -1;
    }

    if ( img_ids.size() != 1 )
    {
        error_str = "Only one FILE variable can be used in: " + attr;
        return -1;
    }

    img_id = img_ids.back();

    auto img = ipool->get_ro(img_id);

    if ( img == nullptr )
    {
        error_str = "Image no longer exists in attribute: " + attr;
        return -1;
    }

    state = img->get_state();

    ds_id = img->get_ds_id();
    type  = img->get_type();

    os->remove(base_name);

    os->replace(base_name_id,     img->get_oid());
    os->replace(base_name_source, img->get_source());
    os->replace(base_name_ds_id,  img->get_ds_id());

    img.reset();

    type_str = Image::type_to_str(type);

    if ( type != base_type )
    {
        ostringstream oss;

        oss << base_name << " needs an image of type "
            << Image::type_to_str(base_type) << " and not "
            << type_str;

        error_str = oss.str();
        return -1;
    }

    if ( state != Image::READY )
    {
        ostringstream oss;

        oss << type_str << " Image '" << img_id << " 'not in READY state.";

        error_str = oss.str();
        return -1;
    }

    auto ds = ds_pool->get_ro(ds_id);

    if ( ds == nullptr )
    {
        error_str = "Associated datastore for image does not exist";
        return -1;
    }

    os->replace(base_name_tm, ds->get_tm_mad());

    const set<int>& cluster_ids = ds->get_cluster_ids();

    if (!cluster_ids.empty())
    {
        os->replace(base_name_cluster, one_util::join(cluster_ids, ','));
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_os(string& error_str)
{
    int num;
    int rc;

    vector<Attribute *> os_attr;
    VectorAttribute *   os;

    num = user_obj_template->remove("OS", os_attr);

    for (auto attr : os_attr)
    {
        obj_template->set(attr);
    }

    if ( num == 0 )
    {
        os = new VectorAttribute("OS");
        obj_template->set(os);
    }
    else if ( num > 1 )
    {
        error_str = "Only one OS attribute can be defined.";
        return -1;
    }
    else
    {
        os = dynamic_cast<VectorAttribute *>(os_attr[0]);
    }

    if ( os == 0 )
    {
        error_str = "Internal error parsing OS attribute.";
        return -1;
    }

    rc = set_os_file(os, "KERNEL", Image::KERNEL, error_str);

    if ( rc != 0 )
    {
        return -1;
    }

    rc = set_os_file(os, "INITRD", Image::RAMDISK, error_str);

    string uuid = os->vector_value("UUID");

    if (uuid.empty())
    {
        uuid = one_util::uuid();
        os->replace("UUID", uuid);
    }

    if ( rc != 0 )
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_defaults(string& error_str, Template * tmpl)
{
    int num;

    vector<Attribute *> attr;
    VectorAttribute*    vatt = 0;

    num = tmpl->remove("NIC_DEFAULT", attr);

    if ( num == 0 )
    {
        return 0;
    }

    if ( num > 1 )
    {
        error_str = "Only one NIC_DEFAULT attribute can be defined.";
        goto error_cleanup;
    }

    vatt = dynamic_cast<VectorAttribute *>(attr[0]);

    if ( vatt == 0 )
    {
        error_str = "Wrong format for NIC_DEFAULT attribute.";
        goto error_cleanup;
    }

    for (int i=0; i < NUM_NO_NIC_DEFAULTS; i++)
    {
        if(vatt->vector_value(NO_NIC_DEFAULTS[i]) != "")
        {
            ostringstream oss;
            oss << "Attribute " << NO_NIC_DEFAULTS[i]
                << " is not allowed inside NIC_DEFAULT.";

            error_str = oss.str();

            return -1;
        }
    }

    obj_template->set(vatt);

    return 0;

error_cleanup:

    for (int i = 0; i < num ; i++)
    {
        delete attr[i];
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_vrouter(string& error_str, Template * tmpl)
{
    string st;

    for (int i = 0; i < NUM_VROUTER_ATTRIBUTES; i++)
    {
        tmpl->get(VROUTER_ATTRIBUTES[i], st);

        if (!st.empty())
        {
            obj_template->replace(VROUTER_ATTRIBUTES[i], st);
        }

        tmpl->erase(VROUTER_ATTRIBUTES[i]);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::check_pci_attributes(VectorAttribute * pci, string& error_str)
{
    static std::vector<std::string> attrs = {"VENDOR", "DEVICE", "CLASS"};
    bool   found = false;

    for (const auto& attr: attrs)
    {
        unsigned int val;
        int rc = HostSharePCI::get_pci_value(attr.c_str(), pci, val);

        if (rc == -1)
        {
            error_str = "Wrong Hex value for PCI attribute " + attr;
            return -1;
        }
        else if ( rc != 0 )
        {
            found = true;
        }
    }

    string saddr;

    pci->vector_value("SHORT_ADDRESS", saddr);

    if (saddr.empty() && !found)
    {
        error_str = "SHORT_ADDRESS, DEVICE, VENDOR or CLASS must be defined for PCI.";
        return -1;
    }
    else if (!saddr.empty() && found)
    {
        error_str = "SHORT_ADDRESS cannot be set with DEVICE, VENDOR or CLASS";
        return -1;
    }

    if ( HostSharePCI::set_pci_address(pci, default_bus, true) != 0 )
    {
        error_str = "Wrong BUS in PCI attribute";
        return -1;
    }

    return 0;
}

int VirtualMachine::parse_pci(string& error_str, Template * tmpl)
{
    vector<VectorAttribute *> array_pci;

    int pci_id = 0;

    tmpl->remove("PCI", array_pci);

    for (auto it = array_pci.begin(); it !=array_pci.end(); ++it, ++pci_id)
    {
        (*it)->replace("PCI_ID", pci_id);

        obj_template->set(*it);
    }

    Nebula& nd = Nebula::instance();
    string  default_bus;

    nd.get_configuration_attribute("PCI_PASSTHROUGH_BUS", default_bus);

    for (auto& attr : array_pci)
    {
        if ( check_pci_attributes(attr, error_str) != 0 )
        {
            return -1;
        }

        if ( HostSharePCI::set_pci_address(attr, default_bus, true) != 0 )
        {
            error_str = "Wrong BUS in PCI attribute";
            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_graphics(string& error_str, Template * tmpl)
{
    VectorAttribute * user_graphics = tmpl->get("GRAPHICS");

    if ( user_graphics == 0 )
    {
        return 0;
    }

    VectorAttribute * graphics = new VectorAttribute(user_graphics);

    tmpl->erase("GRAPHICS");

    obj_template->erase("GRAPHICS");
    obj_template->set(graphics);

    if ( !graphics->vector_value("PORT").empty() )
    {
        unsigned int port;

        int rc = graphics->vector_value("PORT", port);

        if (rc == -1 || port > 65535 )
        {
            error_str = "Wrong PORT number in GRAPHICS attribute";
            return -1;
        }
    }

    bool random_passwd;
    graphics->vector_value("RANDOM_PASSWD", random_passwd);
    string password = graphics->vector_value("PASSWD");

    if ( random_passwd && password.empty() )
    {
        password = one_util::random_password();

        if ( graphics->vector_value("TYPE") == "SPICE" )
        {
            // Spice password must be 60 characters maximum
            graphics->replace("PASSWD", password.substr(0, 59));
        }
        else
        {
            graphics->replace("PASSWD", password);
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_requirements(string& error_str)
{
    int rc, num;

    vector<Attribute *> array_reqs;
    SingleAttribute *   reqs;

    string              parsed;

    num = user_obj_template->remove("SCHED_REQUIREMENTS", array_reqs);

    if ( num == 0 ) // Compatibility with old REQUIREMENTS attribute
    {
        num = user_obj_template->remove("REQUIREMENTS", array_reqs);
    }
    else
    {
        user_obj_template->erase("REQUIREMENTS");
    }

    if ( num == 0 )
    {
        return 0;
    }
    else if ( num > 1 )
    {
        error_str = "Only one SCHED_REQUIREMENTS attribute can be defined.";
        goto error_cleanup;
    }

    reqs = dynamic_cast<SingleAttribute *>(array_reqs[0]);

    if ( reqs == 0 )
    {
        error_str = "Wrong format for SCHED_REQUIREMENTS attribute.";
        goto error_cleanup;
    }

    rc = parse_template_attribute(reqs->value(), parsed, error_str);

    if ( rc == 0 )
    {
        SingleAttribute * reqs_parsed;

        reqs_parsed = new SingleAttribute("SCHED_REQUIREMENTS",parsed);
        user_obj_template->set(reqs_parsed);
    }

    /* --- Delete old requirements attribute --- */

    delete array_reqs[0];

    return rc;

error_cleanup:
    for (int i = 0; i < num ; i++)
    {
        delete array_reqs[i];
    }

    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void VirtualMachine::parse_well_known_attributes()
{
    /*
     * List of meaningful attributes, used in other places and expected in
     * obj_template:
     *
     * DISK
     * NIC
     * VCPU
     * MEMORY
     * CPU
     * CONTEXT
     * OS
     * GRAPHICS
     *
     * INPUT
     * FEATURES
     * RAW
     * CLONING_TEMPLATE_ID
     * TOPOLOGY
     * NUMA_NODE
     */
    std::vector<std::string> names = {"INPUT", "FEATURES", "RAW",
        "CLONING_TEMPLATE_ID", "TOPOLOGY", "NUMA_NODE", "HYPERV_OPTIONS",
        "SPICE_OPTIONS"};

    for (auto it = names.begin(); it != names.end() ; ++it)
    {
        vector<Attribute *> v_attr;

        user_obj_template->remove(*it, v_attr);

        for (auto jt=v_attr.begin(); jt != v_attr.end(); jt++)
        {
            obj_template->set(*jt);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* VirtualMachine Lex & YACC parser functions                                 */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_template_attribute(const string& attribute,
                                             string&       parsed,
                                             string&       error_str)
{
    const char *  str;
    int           rc;
    ostringstream oss_parsed;
    char *        error_msg = 0;

    YY_BUFFER_STATE str_buffer = 0;
    yyscan_t        scanner = 0;

    vm_var_lex_init(&scanner);

    str        = attribute.c_str();
    str_buffer = vm_var__scan_string(str, scanner);

    if (str_buffer == 0)
    {
        log("VM",Log::ERROR,"Error setting scan buffer");
        return -1;
    }

    rc = vm_var_parse(this, &oss_parsed, &error_msg, scanner);

    vm_var__delete_buffer(str_buffer, scanner);

    vm_var_lex_destroy(scanner);

    if ( rc != 0 && error_msg != 0 )
    {
        ostringstream oss;

        oss << "Error parsing: " << attribute << ". " << error_msg;
        log("VM", Log::ERROR, oss);

        error_str = oss.str();

        free(error_msg);
    }

    parsed = oss_parsed.str();

    return rc;
}

/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_file_attribute(string       attribute,
                                         vector<int>& img_ids,
                                         string&      error)
{
    const char *  str;
    int           rc;
    ostringstream oss_parsed;
    char *        error_msg = 0;

    size_t non_blank_pos;

    YY_BUFFER_STATE str_buffer = 0;
    yyscan_t        scanner = 0;

    //Removes leading blanks from attribute, these are not managed
    //by the parser as it is common to the other VM varibales
    non_blank_pos = attribute.find_first_not_of(" \t\n\v\f\r");

    if ( non_blank_pos != string::npos )
    {
        attribute.erase(0, non_blank_pos);
    }

    vm_var_lex_init(&scanner);

    str        = attribute.c_str();
    str_buffer = vm_var__scan_string(str, scanner);

    if (str_buffer == 0)
    {
        log("VM",Log::ERROR,"Error setting scan buffer");
        return -1;
    }

    rc = vm_file_var_parse(this, &img_ids, &error_msg, scanner);

    vm_var__delete_buffer(str_buffer, scanner);

    vm_var_lex_destroy(scanner);

    if ( rc != 0  )
    {
        ostringstream oss;

        if ( error_msg != 0 )
        {
            oss << "Error parsing: " << attribute << ". " << error_msg;
            free(error_msg);
        }
        else
        {
            oss << "Unknown error parsing: " << attribute << ".";
        }

        error = oss.str();
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_public_clouds(const char * pname, string& error)
{
    vector<VectorAttribute *>           attrs;

    string p_vatt;

    int rc  = 0;
    int num = user_obj_template->remove(pname, attrs);

    for (auto attr : attrs)
    {
        string str = attr->marshall();

        if ( str.empty() )
        {
            ostringstream oss;
            oss << "Internal error processing " << pname;
            error = oss.str();
            rc    = -1;
            break;
        }

        rc = parse_template_attribute(str, p_vatt, error);

        if ( rc != 0 )
        {
            rc = -1;
            break;
        }

        VectorAttribute * nvatt = new VectorAttribute(pname);

        nvatt->unmarshall(p_vatt);

        user_obj_template->set(nvatt);
    }

    for (int i = 0; i < num ; i++)
    {
        delete attrs[i];
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_cpu_model(Template * tmpl)
{
    vector<VectorAttribute *> cm_attr;

    int num = tmpl->remove("CPU_MODEL", cm_attr);

    if ( num == 0 )
    {
        return 0;
    }

    auto it = cm_attr.begin();

    obj_template->set(*it);

    for ( ++it; it != cm_attr.end(); ++it)
    {
        delete *it;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_topology(Template * tmpl, std::string &error)
{
/**
 *   TOPOLOGY
 *      - NUMA_NODES: number of numa nodes
 *      - PIN_POLICY: CORE, THREAD, SHARED, NONE
 *      - THREADS
 *      - CORES
 *      - SOCKETS
 */
    std::vector<VectorAttribute *> numa_nodes;
    std::vector<VectorAttribute *> vtopol_a;

    VectorAttribute * vtopol = 0;

    tmpl->remove("TOPOLOGY", vtopol_a);

    if ( !vtopol_a.empty() )
    {
        auto it = vtopol_a.begin();
        vtopol  = *it;

        for ( ++it; it != vtopol_a.end(); ++it)
        {
            delete *it;
        }
    }

    tmpl->get("NUMA_NODE", numa_nodes);

    if ( vtopol == 0 && numa_nodes.empty() )
    {
        return 0;
    }

    if ( vtopol == 0 )
    {
        vtopol = new VectorAttribute("TOPOLOGY");
    }

    tmpl->set(vtopol);

    std::string pp_s = vtopol->vector_value("PIN_POLICY");

    HostShare::PinPolicy pp = HostShare::str_to_pin_policy(pp_s);

    /* ---------------------------------------------------------------------- */
    /* Set MEMORY, HUGEPAGE_SIZE, vCPU & update CPU for pinned VMS            */
    /* ---------------------------------------------------------------------- */
    long long    memory;
    unsigned int vcpu = 0;
    unsigned int vcpu_max = 0;

    if (!tmpl->get("MEMORY", memory))
    {
        error = "VM has not MEMORY set";
        return -1;
    }

    if (!tmpl->get("VCPU", vcpu))
    {
        vcpu = 1;
        tmpl->replace("VCPU", 1);
    }

    if ( pp != HostShare::PP_NONE )
    {
        tmpl->replace("CPU", vcpu);
    }

    if (tmpl->get("VCPU_MAX", vcpu_max))
    {
        error = "VM with TOPOLOGY does not support CPU hotplug (VCPU_MAX)";
        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /* Check topology for non pinned & pinned VMs                             */
    /*  - non-pinned VM needs to set SOCKETS, CORES and THREADS               */
    /*  - pinned VM                                                           */
    /*    1. Set sockets to number of NUMA_NODE or 1 if not given             */
    /*    2. core and thread given. Check consistency                         */
    /*    3. core given. Compute threads & check power of 2                   */
    /*    4. other combinations are set by the scheduler                      */
    /* ---------------------------------------------------------------------- */
    unsigned int s, c, t;

    s = c = t = 0;

    vtopol->vector_value("SOCKETS", s);
    vtopol->vector_value("CORES", c);
    vtopol->vector_value("THREADS", t);

    if ( pp == HostShare::PP_NONE )
    {
        if ( c == 0 || t == 0 || s == 0 )
        {
            error = "Non-pinned VMs with a virtual topology needs to set "
                " SOCKETS, CORES and THREADS numbers.";
            return -1;
        }
        else if ((s * c * t) != vcpu)
        {
            error = "Total threads per core and socket needs to match VCPU";
            return -1;
        }

        vtopol->replace("PIN_POLICY", "NONE");

        tmpl->erase("NUMA_NODE");

        return 0;
    }

    if ( s == 0 )
    {
        if ( numa_nodes.empty() )
        {
            s = 1;
        }
        else
        {
            s = numa_nodes.size();
        }

        vtopol->replace("SOCKETS", s);
    }

    if ( c != 0 && t != 0 && (s * c * t) != vcpu)
    {
        error = "Total threads per core and socket needs to match VCPU";
        return -1;
    }

    if ( t == 0 && c != 0 )
    {
        if ( vcpu%(c * s) != 0 )
        {
            error = "VCPU is not multiple of the total number of cores";
            return -1;
        }

        t = vcpu/(c * s);

        if ((t & (t - 1)) != 0 )
        {
            error = "Computed number of threads is not power of 2";
            return -1;
        }

        vtopol->replace("THREADS", t);
    }

    /* ---------------------------------------------------------------------- */
    /* Build NUMA_NODE stanzas for the given topology                         */
    /* ---------------------------------------------------------------------- */
    if (numa_nodes.empty()) // Automatic Homogenous Topology
    {
        if ( vcpu % s != 0 )
        {
            error = "VCPU is not multiple of the number of NUMA nodes";
            return -1;
        }

        if ( memory % s != 0 )
        {
            error = "MEMORY is not multiple of the number of NUMA nodes";
            return -1;
        }

        long long mem_node = memory / s;

        unsigned int cpu_node = vcpu / s;

        for (unsigned int i = 0 ; i < s ; ++i)
        {
            VectorAttribute * node = new VectorAttribute("NUMA_NODE");

            node->replace("TOTAL_CPUS", cpu_node);
            node->replace("MEMORY", mem_node * 1024);

            tmpl->set(node);
        }
    }
    else // Manual/Asymmetric Topology, NUMA_NODE array
    {
        long long    node_mem = 0;
        unsigned int node_cpu = 0;

        long long    nmem = 0;
        unsigned int ncpu = 0;

        std::vector<VectorAttribute *> new_nodes;

        for (auto it = numa_nodes.begin() ; it != numa_nodes.end() ; ++it)
        {
            ncpu = nmem = 0;

            (*it)->vector_value("TOTAL_CPUS", ncpu);
            (*it)->vector_value("MEMORY", nmem);

            if ( ncpu <= 0 || nmem <= 0)
            {
                break;
            }

            VectorAttribute * node = new VectorAttribute("NUMA_NODE");

            node->replace("TOTAL_CPUS", ncpu);
            node->replace("MEMORY", nmem * 1024);

            new_nodes.push_back(node);

            node_cpu += ncpu;
            node_mem += nmem;
        }

        tmpl->erase("NUMA_NODE");

        if (node_cpu != vcpu || node_mem != memory ||
                ncpu <= 0 || nmem <= 0)
        {
            for (auto it = new_nodes.begin(); it != new_nodes.end(); ++it)
            {
                delete *it;
            }
        }

        if (ncpu <= 0)
        {
            error = "A NUMA_NODE must have TOTAL_CPUS greater than 0";
            return -1;
        }

        if (nmem <= 0)
        {
            error = " A NUMA_NODE must have MEMORY greater than 0";
            return -1;
        }

        if (node_cpu != vcpu)
        {
            error = "Total CPUS of NUMA nodes is different from VM VCPU";
            return -1;
        }

        if (node_mem != memory)
        {
            error = "Total MEMORY of NUMA nodes is different from VM MEMORY";
            return -1;
        }

        tmpl->set(new_nodes);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachine::is_pinned() const
{
    VectorAttribute * topology = obj_template->get("TOPOLOGY");

    if ( topology == 0 )
    {
        return false;
    }

    std::string pp_s = topology->vector_value("PIN_POLICY");

    HostShare::PinPolicy pp = HostShare::str_to_pin_policy(pp_s);

    return pp != HostShare::PP_NONE;
}
