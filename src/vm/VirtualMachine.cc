/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
#include <limits.h>
#include <string.h>
#include <time.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <regex.h>
#include <unistd.h>

#include <iostream>
#include <sstream>
#include <queue>

#include "VirtualMachine.h"
#include "VirtualNetworkPool.h"
#include "ImagePool.h"
#include "NebulaLog.h"
#include "NebulaUtil.h"
#include "Snapshots.h"

#include "Nebula.h"

#include "vm_file_var_syntax.h"
#include "vm_var_syntax.h"

/* ************************************************************************** */
/* Virtual Machine :: Constructor/Destructor                                  */
/* ************************************************************************** */

VirtualMachine::VirtualMachine(int           id,
                               int           _uid,
                               int           _gid,
                               const string& _uname,
                               const string& _gname,
                               int           umask,
                               VirtualMachineTemplate * _vm_template):
        PoolObjectSQL(id,VM,"",_uid,_gid,_uname,_gname,table),
        last_poll(0),
        state(INIT),
        prev_state(INIT),
        lcm_state(LCM_INIT),
        prev_lcm_state(LCM_INIT),
        resched(0),
        stime(time(0)),
        etime(0),
        deploy_id(""),
        history(0),
        previous_history(0),
        _log(0)
{
    if (_vm_template != 0)
    {
        // This is a VM Template, with the root TEMPLATE.
        _vm_template->set_xml_root("USER_TEMPLATE");

        user_obj_template = _vm_template;
    }
    else
    {
        user_obj_template = new VirtualMachineTemplate(false,'=',"USER_TEMPLATE");
    }

    obj_template = new VirtualMachineTemplate;

    set_umask(umask);
}

VirtualMachine::~VirtualMachine()
{
    for (unsigned int i=0 ; i < history_records.size() ; i++)
    {
        delete history_records[i];
    }

    for (map<int, Snapshots *>::const_iterator it = snapshots.begin();
            it != snapshots.end() ; it++)
    {
        delete it->second;
    }

    delete _log;
    delete obj_template;
    delete user_obj_template;
}

/* ************************************************************************** */
/* Virtual Machine :: Database Access Functions                               */
/* ************************************************************************** */

const char * VirtualMachine::table = "vm_pool";

const char * VirtualMachine::db_names =
    "oid, name, body, uid, gid, last_poll, state, lcm_state, "
    "owner_u, group_u, other_u";

const char * VirtualMachine::db_bootstrap = "CREATE TABLE IF NOT EXISTS "
    "vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
    "gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, "
    "owner_u INTEGER, group_u INTEGER, other_u INTEGER)";


const char * VirtualMachine::monit_table = "vm_monitoring";

const char * VirtualMachine::monit_db_names = "vmid, last_poll, body";

const char * VirtualMachine::monit_db_bootstrap = "CREATE TABLE IF NOT EXISTS "
    "vm_monitoring (vmid INTEGER, last_poll INTEGER, body MEDIUMTEXT, "
    "PRIMARY KEY(vmid, last_poll))";


const char * VirtualMachine::showback_table = "vm_showback";

const char * VirtualMachine::showback_db_names = "vmid, year, month, body";

const char * VirtualMachine::showback_db_bootstrap =
    "CREATE TABLE IF NOT EXISTS vm_showback "
    "(vmid INTEGER, year INTEGER, month INTEGER, body MEDIUMTEXT, "
    "PRIMARY KEY(vmid, year, month))";

const char * VirtualMachine::NO_NIC_DEFAULTS[] = {"NETWORK_ID", "NETWORK",
    "NETWORK_UID", "NETWORK_UNAME"};

const int VirtualMachine::NUM_NO_NIC_DEFAULTS = 4;

const char * VirtualMachine::NETWORK_CONTEXT[][2] = {
        {"IP", "IP"},
        {"MAC", "MAC"},
        {"MASK", "NETWORK_MASK"},
        {"NETWORK", "NETWORK_ADDRESS"},
        {"GATEWAY", "GATEWAY"},
        {"DNS", "DNS"},
        {"SEARCH_DOMAIN", "SEARCH_DOMAIN"},
        {"MTU", "GUEST_MTU"},
        {"VROUTER_IP", "VROUTER_IP"},
        {"VROUTER_MANAGEMENT", "VROUTER_MANAGEMENT"}};
const int VirtualMachine::NUM_NETWORK_CONTEXT = 10;

const char*  VirtualMachine::NETWORK6_CONTEXT[][2] = {
        {"IP6", "IP6_GLOBAL"},
        {"GATEWAY6", "GATEWAY6"},
        {"CONTEXT_FORCE_IPV4", "CONTEXT_FORCE_IPV4"},
        {"VROUTER_IP6", "VROUTER_IP6_GLOBAL"}};

const int VirtualMachine::NUM_NETWORK6_CONTEXT = 4;

const char*  VirtualMachine::VROUTER_ATTRIBUTES[] = {
        "VROUTER_ID",
        "VROUTER_KEEPALIVED_ID",
        "VROUTER_KEEPALIVED_PASSWORD"};
const int VirtualMachine::NUM_VROUTER_ATTRIBUTES = 3;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::select(SqlDB * db)
{
    ostringstream   oss;
    ostringstream   ose;

    string system_dir;
    int    rc;
    int    last_seq;

    Nebula& nd = Nebula::instance();

    // Rebuild the VirtualMachine object
    rc = PoolObjectSQL::select(db);

    if( rc != 0 )
    {
        return rc;
    }

    //Get History Records. Current history is built in from_xml() (if any).
    if( hasHistory() )
    {
        last_seq = history->seq - 1;

        for (int i = last_seq; i >= 0; i--)
        {
            History * hp;

            hp = new History(oid, i);
            rc = hp->select(db);

            if ( rc != 0)
            {
                goto error_previous_history;
            }

            history_records[i] = hp;

            if ( i == last_seq )
            {
                previous_history = hp;
            }
        }
    }

    if ( state == DONE ) //Do not recreate dirs. They may be deleted
    {
        _log = 0;

        return 0;
    }

    //--------------------------------------------------------------------------
    //Create support directories for this VM
    //--------------------------------------------------------------------------
    oss.str("");
    oss << nd.get_vms_location() << oid;

    mkdir(oss.str().c_str(), 0700);
    chmod(oss.str().c_str(), 0700);

    //--------------------------------------------------------------------------
    //Create Log support for this VM
    //--------------------------------------------------------------------------
    try
    {
        Log::MessageType   clevel;
        NebulaLog::LogType log_system;

        log_system  = nd.get_log_system();
        clevel      = nd.get_debug_level();

        switch(log_system)
        {
            case NebulaLog::FILE_TS:
            case NebulaLog::FILE:
                _log = new FileLog(nd.get_vm_log_filename(oid), clevel);
                break;

            case NebulaLog::SYSLOG:
                _log = new SysLogResource(oid, obj_type, clevel);
                break;

            case NebulaLog::CERR:
                _log = new CerrLog(clevel);
                break;

            default:
                throw runtime_error("Unknown log system.");
                break;
        }
    }
    catch(exception &e)
    {
        ose << "Error creating log: " << e.what();
        NebulaLog::log("ONE",Log::ERROR, ose);

        _log = 0;
    }

    return 0;

error_previous_history:
    ose << "Cannot get previous history record (seq:" << history->seq
        << ") for VM id: " << oid;

    log("ONE", Log::ERROR, ose);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::insert(SqlDB * db, string& error_str)
{
    int    rc;
    string name;
    string prefix;

    string value;
    int    ivalue;
    float  fvalue;

    ostringstream oss;

    // ------------------------------------------------------------------------
    // Set a name if the VM has not got one and VM_ID
    // ------------------------------------------------------------------------

    oss << oid;
    value = oss.str();

    user_obj_template->erase("VMID");
    obj_template->add("VMID", value);

    user_obj_template->get("TEMPLATE_ID", value);
    user_obj_template->erase("TEMPLATE_ID");

    if (!value.empty())
    {
        obj_template->add("TEMPLATE_ID", value);
    }

    user_obj_template->get("NAME",name);
    user_obj_template->erase("NAME");

    user_obj_template->get("TEMPLATE_NAME", prefix);
    user_obj_template->erase("TEMPLATE_NAME");

    if (prefix.empty())
    {
        prefix = "one";
    }

    if (name.empty() == true)
    {
        oss.str("");
        oss << prefix << "-" << oid;
        name = oss.str();
    }

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    this->name = name;

    // ------------------------------------------------------------------------
    // Parse the Public Cloud specs for this VM
    // ------------------------------------------------------------------------

    if (parse_public_clouds(error_str) != 0)
    {
        goto error_public;
    }

    // ------------------------------------------------------------------------
    // Check for CPU, VCPU and MEMORY attributes
    // ------------------------------------------------------------------------

    if ( user_obj_template->get("MEMORY", ivalue) == false || ivalue <= 0 )
    {
        goto error_memory;
    }

    user_obj_template->erase("MEMORY");
    obj_template->add("MEMORY", ivalue);

    if ( user_obj_template->get("CPU", fvalue) == false || fvalue <= 0 )
    {
        goto error_cpu;
    }

    user_obj_template->erase("CPU");
    obj_template->add("CPU", fvalue);

    // VCPU is optional, first check if the attribute exists, then check it is
    // an integer
    user_obj_template->get("VCPU", value);

    if ( value.empty() == false )
    {
        if ( user_obj_template->get("VCPU", ivalue) == false || ivalue <= 0 )
        {
            goto error_vcpu;
        }

        user_obj_template->erase("VCPU");
        obj_template->add("VCPU", ivalue);
    }

    // ------------------------------------------------------------------------
    // Check the cost attributes
    // ------------------------------------------------------------------------

    if ( user_obj_template->get("CPU_COST", fvalue) == true )
    {
        if ( fvalue < 0 )
        {
            goto error_cpu_cost;
        }

        user_obj_template->erase("CPU_COST");
        obj_template->add("CPU_COST", fvalue);
    }

    if ( user_obj_template->get("MEMORY_COST", fvalue) == true )
    {
        if ( fvalue < 0 )
        {
            goto error_memory_cost;
        }

        user_obj_template->erase("MEMORY_COST");
        obj_template->add("MEMORY_COST", fvalue);
    }

    if ( user_obj_template->get("DISK_COST", fvalue) == true )
    {
        if ( fvalue < 0 )
        {
            goto error_disk_cost;
        }

        user_obj_template->erase("DISK_COST");
        obj_template->add("DISK_COST", fvalue);
    }

    // ------------------------------------------------------------------------
    // Check the OS attribute
    // ------------------------------------------------------------------------

    rc = parse_os(error_str);

    if ( rc != 0 )
    {
        goto error_os;
    }

    // ------------------------------------------------------------------------
    // Parse the defaults to merge
    // ------------------------------------------------------------------------

    rc = parse_defaults(error_str);

    if ( rc != 0 )
    {
        goto error_defaults;
    }

    // ------------------------------------------------------------------------
    // Parse the virtual router attributes
    // ------------------------------------------------------------------------

    rc = parse_vrouter(error_str);

    if ( rc != 0 )
    {
        goto error_vrouter;
    }

    // ------------------------------------------------------------------------
    // Get network leases
    // ------------------------------------------------------------------------

    rc = get_network_leases(error_str);

    if ( rc != 0 )
    {
        goto error_leases_rollback;
    }

    // ------------------------------------------------------------------------
    // Get disk images
    // ------------------------------------------------------------------------

    rc = get_disk_images(error_str);

    if ( rc != 0 )
    {
        // The get_disk_images method has an internal rollback for
        // the acquired images, release_disk_images() would release all disks
        goto error_leases_rollback;
    }

    // ------------------------------------------------------------------------
    // PCI Devices
    // ------------------------------------------------------------------------

    rc = parse_pci(error_str);

    if ( rc != 0 )
    {
        goto error_pci;
    }

    // -------------------------------------------------------------------------
    // Parse the context & requirements
    // -------------------------------------------------------------------------

    rc = parse_context(error_str);

    if ( rc != 0 )
    {
        goto error_context;
    }

    rc = parse_requirements(error_str);

    if ( rc != 0 )
    {
        goto error_requirements;
    }

    rc = automatic_requirements(error_str);

    if ( rc != 0 )
    {
        goto error_requirements;
    }

    if ( parse_graphics(error_str) != 0 )
    {
        goto error_graphics;
    }

    // -------------------------------------------------------------------------
    // Get and set DEPLOY_ID for imported VMs
    // -------------------------------------------------------------------------

    user_obj_template->get("IMPORT_VM_ID", value);
    user_obj_template->erase("IMPORT_VM_ID");

    if (!value.empty())
    {
        const char * one_vms = "^one-[[:digit:]]+$";

        if (one_util::regex_match(one_vms, value.c_str()) == 0)
        {
            goto error_one_vms;
        }
        else
        {
            deploy_id = value;
            obj_template->add("IMPORTED", "YES");
        }
    }

    // ------------------------------------------------------------------------

    parse_well_known_attributes();

    // ------------------------------------------------------------------------
    // Insert the VM
    // ------------------------------------------------------------------------

    rc = insert_replace(db, false, error_str);

    if ( rc != 0 )
    {
        goto error_update;
    }

    return 0;

error_update:
    goto error_rollback;

error_pci:
    goto error_rollback;

error_context:
    goto error_rollback;

error_requirements:
    goto error_rollback;

error_graphics:
    goto error_rollback;

error_rollback:
    release_disk_images();

error_leases_rollback:
    release_network_leases();
    goto error_common;

error_cpu:
    error_str = "CPU attribute must be a positive float or integer value.";
    goto error_common;

error_vcpu:
    error_str = "VCPU attribute must be a positive integer value.";
    goto error_common;

error_memory:
    error_str = "MEMORY attribute must be a positive integer value.";
    goto error_common;

error_cpu_cost:
    error_str = "CPU_COST attribute must be a positive float or integer value.";
    goto error_common;

error_memory_cost:
    error_str = "MEMORY_COST attribute must be a positive float or integer value.";
    goto error_common;

error_disk_cost:
    error_str = "DISK_COST attribute must be a positive float or integer value.";
    goto error_common;

error_one_vms:
    error_str = "Trying to import an OpenNebula VM: 'one-*'.";
    goto error_common;

error_os:
error_defaults:
error_vrouter:
error_public:
error_name:
error_common:
    NebulaLog::log("ONE",Log::ERROR, error_str);

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::set_os_file(VectorAttribute *  os,
                                const string&      base_name,
                                Image::ImageType   base_type,
                                string&            error_str)
{
    vector<int>  img_ids;
    Nebula& nd = Nebula::instance();

    ImagePool * ipool = nd.get_ipool();
    Image *     img   = 0;

    int img_id;

    Image::ImageType  type;
    Image::ImageState state;

    DatastorePool * ds_pool = nd.get_dspool();
    Datastore *     ds;
    int             ds_id;

    string attr;
    string base_name_ds     = base_name + "_DS";
    string base_name_id     = base_name + "_DS_ID";
    string base_name_source = base_name + "_DS_SOURCE";
    string base_name_ds_id  = base_name + "_DS_DSID";
    string base_name_tm     = base_name + "_DS_TM";
    string base_name_cluster= base_name + "_DS_CLUSTER_ID";

    string type_str;

    attr = os->vector_value(base_name_ds.c_str());

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

    img = ipool->get(img_id, true);

    if ( img == 0 )
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

    img->unlock();

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

    ds = ds_pool->get(ds_id, true);

    if ( ds == 0 )
    {
        error_str = "Associated datastore for image does not exist";
        return -1;
    }

    os->replace(base_name_tm, ds->get_tm_mad());

    if ( ds->get_cluster_id() != ClusterPool::NONE_CLUSTER_ID )
    {
        os->replace(base_name_cluster, ds->get_cluster_id());
    }

    ds->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_os(string& error_str)
{
    int num;
    int rc;

    vector<Attribute *> os_attr;
    VectorAttribute *   os;

    vector<Attribute *>::iterator it;

    num = user_obj_template->remove("OS", os_attr);

    for (it=os_attr.begin(); it != os_attr.end(); it++)
    {
        obj_template->set(*it);
    }

    if ( num == 0 )
    {
        return 0;
    }
    else if ( num > 1 )
    {
        error_str = "Only one OS attribute can be defined.";
        return -1;
    }

    os = dynamic_cast<VectorAttribute *>(os_attr[0]);

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

    if ( rc != 0 )
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_defaults(string& error_str)
{
    int num;

    vector<Attribute *> attr;
    VectorAttribute*    vatt = 0;

    num = user_obj_template->remove("NIC_DEFAULT", attr);

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

int VirtualMachine::parse_vrouter(string& error_str)
{
    string st;

    for (int i = 0; i < NUM_VROUTER_ATTRIBUTES; i++)
    {
        user_obj_template->get(VROUTER_ATTRIBUTES[i], st);

        if (!st.empty())
        {
            obj_template->replace(VROUTER_ATTRIBUTES[i], st);
        }

        user_obj_template->erase(VROUTER_ATTRIBUTES[i]);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void parse_context_network(const char* vars[][2], int num_vars,
        VectorAttribute * context, VectorAttribute * nic)
{
    string nic_id = nic->vector_value("NIC_ID");

    for (int i=0; i < num_vars; i++)
    {
        ostringstream cvar;
        string cval;

        cvar << "ETH" << nic_id << "_" << vars[i][0];

        cval = context->vector_value(cvar.str().c_str());

        if (!cval.empty())
        {
            continue;
        }

        cval = nic->vector_value(vars[i][1]); //Check the NIC

        if (cval.empty()) //Will check the AR and VNET
        {
            ostringstream cval_ss;

            cval_ss << "$NETWORK["<< vars[i][1] <<", NIC_ID=\""<< nic_id <<"\"]";
            cval = cval_ss.str();
        }

        context->replace(cvar.str(), cval);
    }
}

/* -------------------------------------------------------------------------- */

static void clear_context_network(const char* vars[][2], int num_vars,
        VectorAttribute * context, int nic_id)
{
    ostringstream att_name;

    for (int i=0; i < num_vars; i++)
    {
        att_name.str("");

        att_name << "ETH" << nic_id << "_" << vars[i][0];

        context->remove(att_name.str());
    }
}

/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_context(string& error_str)
{
    int rc, num;

    vector<Attribute *> array_context;
    VectorAttribute *   context;
    VectorAttribute *   context_parsed;

    string * str;
    string   parsed;
    string   files_ds;
    string   files_ds_parsed;
    string   st;

    ostringstream oss_parsed;

    vector<int>  img_ids;

    num = obj_template->remove("CONTEXT", array_context);

    if ( num == 0 )
    {
        return 0;
    }
    else if ( num > 1 )
    {
        error_str = "Only one CONTEXT attribute can be defined.";
        goto error_cleanup;
    }

    context = dynamic_cast<VectorAttribute *>(array_context[0]);

    if ( context == 0 )
    {
        error_str = "Wrong format for CONTEXT attribute.";
        goto error_cleanup;
    }

    //Backup datastore files to parse them later

    files_ds = context->vector_value("FILES_DS");

    context->remove("FILES_DS");

    // ----------- Inject Network context in marshalled string  ----------------

    bool net_context;
    context->vector_value("NETWORK", net_context);

    if (net_context)
    {
        vector<VectorAttribute *> vatts;
        int num_vatts = obj_template->get("NIC", vatts);

        for(int i=0; i<num_vatts; i++)
        {
            parse_context_network(NETWORK_CONTEXT, NUM_NETWORK_CONTEXT,
                    context, vatts[i]);

            if (!vatts[i]->vector_value("IP6_GLOBAL").empty())
            {
                parse_context_network(NETWORK6_CONTEXT, NUM_NETWORK6_CONTEXT,
                        context, vatts[i]);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Parse CONTEXT variables & free vector attributes
    // -------------------------------------------------------------------------

    str = context->marshall();

    if (str == 0)
    {
        error_str = "Cannot marshall CONTEXT";
        goto error_cleanup;
    }

    rc = parse_template_attribute(*str, parsed, error_str);

    delete str;

    if (rc != 0)
    {
        goto error_cleanup;
    }

    for (int i = 0; i < num ; i++)
    {
        delete array_context[i];
    }

    // -------------------------------------------------------------------------
    // Parse FILE_DS variables
    // -------------------------------------------------------------------------

    if (!files_ds.empty())
    {
        if ( parse_file_attribute(files_ds, img_ids, error_str) != 0 )
        {
            return -1;
        }

        if ( img_ids.size() > 0 )
        {
            vector<int>::iterator it;

            Nebula& nd = Nebula::instance();

            ImagePool * ipool = nd.get_ipool();
            Image  *    img   = 0;

            Image::ImageType type;
            Image::ImageState state;

            for ( it=img_ids.begin() ; it < img_ids.end(); it++ )
            {
                img = ipool->get(*it, true);

                if ( img != 0 )
                {
                    oss_parsed << img->get_source() << ":'"
                               << img->get_name() << "' ";

                    type  = img->get_type();
                    state = img->get_state();

                    img->unlock();

                    if (type != Image::CONTEXT)
                    {
                        error_str = "Only images of type CONTEXT can be used in"
                                    " FILE_DS attribute.";
                        return -1;
                    }

                    if ( state != Image::READY )
                    {
                        ostringstream oss;

                        oss << Image::type_to_str(type)
                            << " Image '" << *it << "' not in READY state.";

                        error_str = oss.str();

                        return -1;
                    }

                }
            }
        }
    }

    files_ds_parsed = oss_parsed.str();

    context_parsed = new VectorAttribute("CONTEXT");
    context_parsed->unmarshall(parsed);

    if ( !files_ds_parsed.empty() )
    {
        context_parsed->replace("FILES_DS", files_ds_parsed);
    }

    obj_template->set(context_parsed);

    // -------------------------------------------------------------------------
    // OneGate URL
    // -------------------------------------------------------------------------

    bool token;
    context_parsed->vector_value("TOKEN", token);

    if (token)
    {
        string endpoint;

        Nebula::instance().get_configuration_attribute(
                    "ONEGATE_ENDPOINT", endpoint);

        if ( endpoint.empty() )
        {
            error_str = "CONTEXT/TOKEN set, but OneGate endpoint was not "
                "defined in oned.conf or CONTEXT.";
            return -1;
        }

        context_parsed->replace("ONEGATE_ENDPOINT", endpoint);
        context_parsed->replace("VMID", oid);

        // The token_password is taken from the owner user's template.
        // We store this original owner in case a chown operation is performed.
        add_template_attribute("CREATED_BY", uid);
    }

    // -------------------------------------------------------------------------
    // Virtual Router attributes
    // -------------------------------------------------------------------------

    for (int i = 0; i < NUM_VROUTER_ATTRIBUTES; i++)
    {
        obj_template->get(VROUTER_ATTRIBUTES[i], st);

        if (!st.empty())
        {
            context_parsed->replace(VROUTER_ATTRIBUTES[i], st);
        }
    }

    return rc;

error_cleanup:
    for (int i = 0; i < num ; i++)
    {
        delete array_context[i];
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::reparse_context()
{
    int rc;

    VectorAttribute * context_parsed;

    string * str;
    string   parsed;
    string   error_str;

    const VectorAttribute * context = obj_template->get("CONTEXT");

    if ( context == 0 )
    {
        return -1;
    }

    // -------------------------------------------------------------------------
    // Parse CONTEXT variables & free vector attributes
    // -------------------------------------------------------------------------

    str = context->marshall();

    if (str == 0)
    {
        return -1;
    }

    rc = parse_template_attribute(*str, parsed, error_str);

    delete str;

    if (rc != 0)
    {
        return -1;
    }

    context_parsed = new VectorAttribute("CONTEXT");
    context_parsed->unmarshall(parsed);

    obj_template->erase("CONTEXT");
    obj_template->set(context_parsed);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_pci(string& error_str)
{
    VectorAttribute *               pci;
    vector<Attribute *>             array_pci;
    vector<Attribute *>::iterator   it;

    unsigned int val;

    user_obj_template->remove("PCI", array_pci);

    static string attrs[] = {"VENDOR", "DEVICE", "CLASS"};

    for (it = array_pci.begin(); it !=array_pci.end(); it++)
    {
        obj_template->set(*it);
    }

    for (it = array_pci.begin(); it !=array_pci.end(); it++)
    {
        bool found = false;

        pci = dynamic_cast<VectorAttribute * >(*it);

        if ( pci == 0 )
        {
            error_str = "PCI attribute must be a vector attribute";
            return -1;
        }

        for (int i=0; i<3; i++)
        {
            int rc = HostSharePCI::get_pci_value(attrs[i].c_str(), pci, val);

            if (rc == -1)
            {
                ostringstream oss;
                oss << "Wrong value for PCI/" << attrs[i] << ": "
                    << pci->vector_value(attrs[i].c_str())
                    <<". It must be a hex value";

                error_str = oss.str();
                return -1;
            }
            else if ( rc != 0 )
            {
                found = true;
            }
        }

        if (!found)
        {
            error_str = "Missing mandatory attributes inside PCI. "
                        "Either DEVICE, VENDOR or CLASS must be defined";

            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_graphics(string& error_str)
{
    vector<Attribute *> array_graphics;
    VectorAttribute *   graphics;

    vector<Attribute *>::iterator it;

    int num = user_obj_template->remove("GRAPHICS", array_graphics);

    for (it=array_graphics.begin(); it != array_graphics.end(); it++)
    {
        obj_template->set(*it);
    }

    if ( num == 0 )
    {
        return 0;
    }

    graphics = dynamic_cast<VectorAttribute * >(array_graphics[0]);

    if ( graphics == 0 )
    {
        return 0;
    }

    string port = graphics->vector_value("PORT");
    int    port_i;

    int rc = graphics->vector_value("PORT", port_i);

    if ( port.empty() )
    {
        Nebula&       nd = Nebula::instance();

        ostringstream oss;
        istringstream iss;

        int           base_port;
        string        base_port_s;

        int limit = 65535;

        nd.get_configuration_attribute("VNC_BASE_PORT",base_port_s);
        iss.str(base_port_s);
        iss >> base_port;

        oss << ( base_port + ( oid % (limit - base_port) ));
        graphics->replace("PORT", oss.str());
    }
    else if ( rc == -1 || port_i < 0 )
    {
        error_str = "Wrong PORT number in GRAPHICS attribute";
        return -1;
    }

    string random_passwd = graphics->vector_value("RANDOM_PASSWD");

    if ( !random_passwd.empty() )
    {
        graphics->replace("PASSWD", one_util::random_password());
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
     */

    vector<Attribute *>             v_attr;
    vector<Attribute *>::iterator   it;

    string names[] = {"INPUT", "FEATURES", "RAW"};

    for (int i=0; i<3; i++)
    {
        v_attr.clear();

        user_obj_template->remove(names[i], v_attr);

        for (it=v_attr.begin(); it != v_attr.end(); it++)
        {
            obj_template->set(*it);
        }
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

static int check_and_set_cluster_id(const char *      id_name,
                                    const VectorAttribute * vatt,
                                    string&           cluster_id)
{
    string vatt_cluster_id;

    vatt_cluster_id = vatt->vector_value(id_name);

    if ( !vatt_cluster_id.empty() )
    {
        if ( cluster_id.empty() )
        {
            cluster_id = vatt_cluster_id;
        }
        else if ( cluster_id != vatt_cluster_id )
        {
            return -1;
        }
    }

    return 0;
}

/* ------------------------------------------------------------------------ */

int VirtualMachine::automatic_requirements(string& error_str)
{
    int num_vatts;
    vector<const VectorAttribute  *> vatts;

    ostringstream   oss;
    string          requirements;
    string          cluster_id = "";

    set<string> clouds;

    int num_public = get_public_clouds(clouds);

    int incomp_id;
    int rc;

    // Get cluster id from the KERNEL and INITRD (FILE Datastores)
    const VectorAttribute * osatt = obj_template->get("OS");

    if ( osatt != 0 )
    {
        rc = check_and_set_cluster_id("KERNEL_CLUSTER_ID", osatt, cluster_id);

        if ( rc != 0 )
        {
            goto error_kernel;
        }

        rc = check_and_set_cluster_id("INITRD_CLUSTER_ID", osatt, cluster_id);

        if ( rc != 0 )
        {
            goto error_initrd;
        }
    }

    // Get cluster id from all DISK vector attributes (IMAGE Datastore)
    num_vatts = obj_template->get("DISK",vatts);

    for(int i=0; i<num_vatts; i++)
    {
        rc = check_and_set_cluster_id("CLUSTER_ID", vatts[i], cluster_id);

        if ( rc != 0 )
        {
            incomp_id = i;
            goto error_disk;
        }
    }

    vatts.clear();

    // Get cluster id from all NIC vector attributes
    num_vatts = obj_template->get("NIC", vatts);

    for(int i=0; i<num_vatts; i++)
    {
        rc = check_and_set_cluster_id("CLUSTER_ID", vatts[i], cluster_id);

        if ( rc != 0 )
        {
            incomp_id = i;
            goto error_nic;
        }
    }

    if ( !cluster_id.empty() )
    {
        oss << "CLUSTER_ID = " << cluster_id << " & !(PUBLIC_CLOUD = YES)";
    }
    else
    {
        oss << "!(PUBLIC_CLOUD = YES)";
    }

    if (num_public != 0)
    {
        set<string>::iterator it = clouds.begin();

        oss << " | (PUBLIC_CLOUD = YES & (";

        oss << "HYPERVISOR = " << *it ;

        for (++it; it != clouds.end() ; ++it)
        {
            oss << " | HYPERVISOR = " << *it;
        }

        oss << "))";
    }

    obj_template->add("AUTOMATIC_REQUIREMENTS", oss.str());

    return 0;

error_disk:
    oss << "Incompatible clusters in DISK. Datastore for DISK "<< incomp_id
        << " is not the same as the one used by other VM elements (cluster "
        << cluster_id << ")";
    goto error_common;

error_kernel:
    oss << "Incompatible cluster in KERNEL datastore, it should be in cluster "
        << cluster_id << ".";
    goto error_common;

error_initrd:
    oss << "Incompatible cluster in INITRD datastore, it should be in cluster "
        << cluster_id << ".";
    goto error_common;

error_nic:
    oss << "Incompatible clusters in NIC. Network for NIC "<< incomp_id
        << " is not the same as the one used by other VM elements (cluster "
        << cluster_id << ")";
    goto error_common;

error_common:
    error_str = oss.str();

    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VirtualMachine::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;
    int             rc;

    string xml_body;
    char * sql_name;
    char * sql_xml;

    sql_name =  db->escape_str(name.c_str());

    if ( sql_name == 0 )
    {
        goto error_generic;
    }

    sql_xml = db->escape_str(to_xml(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if ( validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
    }

    if(replace)
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    oss << " INTO " << table << " ("<< db_names <<") VALUES ("
        <<          oid             << ","
        << "'" <<   sql_name        << "',"
        << "'" <<   sql_xml         << "',"
        <<          uid             << ","
        <<          gid             << ","
        <<          last_poll       << ","
        <<          state           << ","
        <<          lcm_state       << ","
        <<          owner_u         << ","
        <<          group_u         << ","
        <<          other_u         << ")";

    db->free_str(sql_name);
    db->free_str(sql_xml);

    rc = db->exec(oss);

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the VM to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_generic:
    error_str = "Error inserting VM in DB.";
error_common:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::update_monitoring(SqlDB * db)
{
    ostringstream oss;
    int           rc;

    string xml_body;
    string error_str;
    char * sql_xml;

    oss << "<VM>"
        << "<ID>" << oid << "</ID>"
        << "<LAST_POLL>" << last_poll << "</LAST_POLL>"
        << monitoring.to_xml(xml_body)
        << "</VM>";

    sql_xml = db->escape_str(oss.str().c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if ( validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
    }

    oss.str("");

    oss << "REPLACE INTO " << monit_table << " ("<< monit_db_names <<") VALUES ("
        <<          oid             << ","
        <<          last_poll       << ","
        << "'" <<   sql_xml         << "')";

    db->free_str(sql_xml);

    rc = db->exec(oss);

    return rc;

error_xml:
    db->free_str(sql_xml);

    error_str = "could not transform the VM to XML.";

    goto error_common;

error_body:
    error_str = "could not insert the VM in the DB.";

error_common:
    oss.str("");
    oss << "Error updating VM monitoring information, " << error_str;

    NebulaLog::log("ONE",Log::ERROR, oss);

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::add_history(
    int   hid,
    int   cid,
    const string& hostname,
    const string& vmm_mad,
    const string& vnm_mad,
    const string& tm_mad,
    const string& ds_location,
    int           ds_id)
{
    ostringstream os;
    int           seq;
    string        vm_xml;

    if (history == 0)
    {
        seq = 0;
    }
    else
    {
        seq = history->seq + 1;

        previous_history = history;
    }

    to_xml_extended(vm_xml, 0);

    history = new History(oid,
                          seq,
                          hid,
                          hostname,
                          cid,
                          vmm_mad,
                          vnm_mad,
                          tm_mad,
                          ds_location,
                          ds_id,
                          vm_xml);

    history_records.push_back(history);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::cp_history()
{
    History * htmp;
    string    vm_xml;

    if (history == 0)
    {
        return;
    }

    to_xml_extended(vm_xml, 0);

    htmp = new History(oid,
                       history->seq + 1,
                       history->hid,
                       history->hostname,
                       history->cid,
                       history->vmm_mad_name,
                       history->vnm_mad_name,
                       history->tm_mad_name,
                       history->ds_location,
                       history->ds_id,
                       vm_xml);

    previous_history = history;
    history          = htmp;

    history_records.push_back(history);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::cp_previous_history()
{
    History * htmp;
    string    vm_xml;

    if ( previous_history == 0 || history == 0)
    {
        return;
    }

    to_xml_extended(vm_xml, 0);

    htmp = new History(oid,
                       history->seq + 1,
                       previous_history->hid,
                       previous_history->hostname,
                       previous_history->cid,
                       previous_history->vmm_mad_name,
                       previous_history->vnm_mad_name,
                       previous_history->tm_mad_name,
                       previous_history->ds_location,
                       previous_history->ds_id,
                       vm_xml);

    previous_history = history;
    history          = htmp;

    history_records.push_back(history);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::get_requirements (int& cpu, int& memory, int& disk,
        vector<VectorAttribute *>& pci_devs)
{
    istringstream   iss;
    float           fcpu;

    pci_devs.clear();

    if ((get_template_attribute("MEMORY",memory) == false) ||
        (get_template_attribute("CPU",fcpu) == false))
    {
        cpu    = 0;
        memory = 0;
        disk   = 0;

        return;
    }

    cpu    = (int) (fcpu * 100);//now in 100%
    memory = memory * 1024;     //now in Kilobytes
    disk   = 0;

    obj_template->get("PCI", pci_devs);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::check_resize (
        float cpu, int memory, int vcpu, string& error_str)
{
    if (cpu < 0)
    {
        error_str = "CPU must be a positive float or integer value.";
        return -1;
    }

    if (memory < 0)
    {
        error_str = "MEMORY must be a positive integer value.";
        return -1;
    }

    if (vcpu < 0)
    {
        error_str = "VCPU must be a positive integer value.";
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::resize(float cpu, int memory, int vcpu, string& error_str)
{
    ostringstream oss;

    int rc = check_resize(cpu, memory, vcpu, error_str);

    if (rc != 0)
    {
        return rc;
    }

    if (cpu > 0)
    {
        oss << cpu;
        replace_template_attribute("CPU", oss.str());
        oss.str("");
    }

    if (memory > 0)
    {
        oss << memory;
        replace_template_attribute("MEMORY", oss.str());
        oss.str("");
    }

    if (vcpu > 0)
    {
        oss << vcpu;
        replace_template_attribute("VCPU", oss.str());
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void assign_disk_targets(queue<pair <string, VectorAttribute *> >& _queue,
                                set<string>& used_targets)
{
    int    index = 0;
    string target;

    pair <string, VectorAttribute *> disk_pair;

    while (_queue.size() > 0 )
    {
        disk_pair = _queue.front();
        index     = 0;

        do
        {
            target = disk_pair.first + static_cast<char>(('a'+ index));
            index++;
        }
        while ( used_targets.count(target) > 0 && index < 26 );

        disk_pair.second->replace("TARGET", target);
        used_targets.insert(target);

        _queue.pop();
    }
}

/* -------------------------------------------------------------------------- */

int VirtualMachine::get_disk_images(string& error_str)
{
    vector<Attribute *> disks;
    vector<Attribute *> context_disks;

    int               num_disks, num_context, rc;
    ImagePool *       ipool;
    VectorAttribute * disk;
    vector<int>       acquired_images;

    int     image_id;
    string  dev_prefix;
    string  target;

    queue<pair <string, VectorAttribute *> > os_disk;
    queue<pair <string, VectorAttribute *> > cdrom_disks;
    queue<pair <string, VectorAttribute *> > datablock_disks;

    set<string> used_targets;

    ostringstream    oss;
    Image::ImageType img_type;

    Nebula& nd = Nebula::instance();
    ipool      = nd.get_ipool();

    vector<Attribute*>::iterator it;

    num_context = user_obj_template->remove("CONTEXT", context_disks);
    num_disks   = user_obj_template->remove("DISK", disks);

    for (it=context_disks.begin(); it != context_disks.end(); )
    {
        if ( (*it)->type() != Attribute::VECTOR )
        {
            delete *it;
            num_context--;
            it = context_disks.erase(it);
        }
        else
        {
            obj_template->set(*it);
            ++it;
        }
    }

    for (it=disks.begin(); it != disks.end(); )
    {
        if ( (*it)->type() != Attribute::VECTOR )
        {
            delete *it;
            num_disks--;
            it = disks.erase(it);
        }
        else
        {
            obj_template->set(*it);
            ++it;
        }
    }

    if ( num_disks > 20 )
    {
        goto error_max_disks;
    }

    // -------------------------------------------------------------------------
    // Set DISK attributes & Targets
    // -------------------------------------------------------------------------
    for(int i=0; i<num_disks; i++)
    {
        Snapshots * snap;

        disk = static_cast<VectorAttribute * >(disks[i]);

        rc = ipool->acquire_disk(oid,
                                 disk,
                                 i,
                                 img_type,
                                 dev_prefix,
                                 uid,
                                 image_id,
                                 &snap,
                                 error_str);
        if (rc == 0 )
        {
            if (snap != 0)
            {
                if (img_type == Image::OS || img_type == Image::DATABLOCK)
                {
                    snapshots.insert(pair<int, Snapshots *>(i, snap));
                }
                else
                {
                    delete snap;
                }
            }

            acquired_images.push_back(image_id);

            target = disk->vector_value("TARGET");

            if ( !target.empty() )
            {
                if (  used_targets.insert(target).second == false )
                {
                    goto error_duplicated_target;
                }
            }
            else
            {
                switch(img_type)
                {
                    case Image::OS:
                        // The first OS disk gets the first device (a),
                        // other OS's will be managed as DATABLOCK's
                        if ( os_disk.empty() )
                        {
                            os_disk.push( make_pair(dev_prefix, disk) );
                        }
                        else
                        {
                            datablock_disks.push( make_pair(dev_prefix, disk) );
                        }
                        break;

                    case Image::CDROM:
                        cdrom_disks.push( make_pair(dev_prefix, disk) );
                        break;

                    case Image::DATABLOCK:
                        datablock_disks.push( make_pair(dev_prefix, disk) );
                        break;

                    default:
                        break;
                }
            }
        }
        else
        {
            oss << "DISK " << i << ": " << error_str;
            error_str = oss.str();

            goto error_common;
        }
    }

    // -------------------------------------------------------------------------
    // The context is the last of the cdroms
    // -------------------------------------------------------------------------
    if ( num_context > 0 )
    {
        disk = static_cast<VectorAttribute * >(context_disks[0]);

        target = disk->vector_value("TARGET");

        if ( !target.empty() )
        {
            if (  used_targets.insert(target).second == false )
            {
                goto error_duplicated_target;
            }
        }
        else
        {
            dev_prefix = disk->vector_value("DEV_PREFIX");

            if ( dev_prefix.empty() )
            {
                dev_prefix = ipool->default_cdrom_dev_prefix();
            }

            cdrom_disks.push(make_pair(dev_prefix, disk));
        }

        // Disk IDs are 0..num-1, context disk is is num
        disk->replace("DISK_ID", num_disks);
    }

    assign_disk_targets(os_disk, used_targets);
    assign_disk_targets(cdrom_disks, used_targets);
    assign_disk_targets(datablock_disks, used_targets);

    return 0;

error_max_disks:
    error_str = "Exceeded the maximum number of disks (20)";
    return -1;

error_duplicated_target:
    oss << "Two disks have defined the same target " << target;
    error_str = oss.str();

error_common:
    ImageManager *  imagem  = nd.get_imagem();

    vector<int>::iterator img_it;

    for ( img_it=acquired_images.begin() ; img_it < acquired_images.end(); img_it++ )
    {
        imagem->release_image(oid, *img_it, false);
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::get_disk_info(int&         max_disk_id,
                                   set<string>& used_targets)
{
    vector<VectorAttribute  *> disk;
    VectorAttribute * context;

    string target;

    int disk_id;
    int num_disks;

    max_disk_id = -1;

    num_disks = obj_template->get("DISK", disk);

    for(int i=0; i<num_disks; i++)
    {
        target = disk[i]->vector_value("TARGET");

        if ( !target.empty() )
        {
            used_targets.insert(target);
        }

        disk[i]->vector_value("DISK_ID", disk_id);

        if ( disk_id > max_disk_id )
        {
            max_disk_id = disk_id;
        }
    }

    disk.clear();

    context = obj_template->get("CONTEXT");

    if ( context != 0 )
    {
        target = context->vector_value("TARGET");

        if ( !target.empty() )
        {
            used_targets.insert(target);
        }

        context->vector_value("DISK_ID", disk_id);

        if ( disk_id > max_disk_id )
        {
            max_disk_id = disk_id;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VectorAttribute * VirtualMachine::set_up_attach_disk(
                int                      vm_id,
                VirtualMachineTemplate * tmpl,
                set<string>&             used_targets,
                int                      max_disk_id,
                int                      uid,
                int&                     image_id,
                Snapshots **             snap,
                string&                  error_str)
{
    VectorAttribute * new_disk;

    string target;

    Nebula&       nd     = Nebula::instance();
    ImagePool *   ipool  = nd.get_ipool();
    ImageManager* imagem = nd.get_imagem();

    string           dev_prefix;
    Image::ImageType img_type;

    image_id = -1;
    *snap    = 0;

    // -------------------------------------------------------------------------
    // Get the DISK attribute from the template
    // -------------------------------------------------------------------------
    new_disk = tmpl->get("DISK");

    if ( new_disk == 0 )
    {
        error_str = "Internal error parsing DISK attribute";
        return 0;
    }

    new_disk = new_disk->clone();

    // -------------------------------------------------------------------------
    // Acquire the new disk image
    // -------------------------------------------------------------------------
    int rc = ipool->acquire_disk(vm_id,
                                 new_disk,
                                 max_disk_id + 1,
                                 img_type,
                                 dev_prefix,
                                 uid,
                                 image_id,
                                 snap,
                                 error_str);
    if ( rc != 0 )
    {
        delete new_disk;
        return 0;
    }

    target = new_disk->vector_value("TARGET");

    if ( !target.empty() )
    {
        if (  used_targets.insert(target).second == false )
        {
            ostringstream oss;

            oss << "Target " << target << " is already in use.";
            error_str = oss.str();

            imagem->release_image(vm_id, image_id, false);

            delete new_disk;
            delete *snap;

            *snap    = 0;
            image_id = -1;

            return 0;
        }
    }
    else
    {
        queue<pair <string, VectorAttribute *> > disks_queue;

        disks_queue.push(make_pair(dev_prefix, new_disk));

        assign_disk_targets(disks_queue, used_targets);
    }

    return new_disk;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::set_attach_disk(int disk_id)
{
    VectorAttribute * disk;

    disk = get_disk(disk_id);

    if ( disk != 0 )
    {
        disk->replace("ATTACH", "YES");
        return 0;
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VectorAttribute* VirtualMachine::get_attach_disk()
{
    vector<VectorAttribute *> disk;

    int num_disks = obj_template->get("DISK", disk);

    for(int i=0; i<num_disks; i++)
    {
        if ( disk[i]->vector_value("ATTACH") == "YES" )
        {
            return disk[i];
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::clear_attach_disk()
{
    vector<VectorAttribute *> disks;

    int num_disks = obj_template->get("DISK", disks);

    for(int i=0; i < num_disks; i++)
    {
        if ( disks[i]->vector_value("ATTACH") == "YES" )
        {
            disks[i]->remove("ATTACH");
            return;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VectorAttribute * VirtualMachine::delete_attach_disk(Snapshots **snap)
{
    vector<VectorAttribute  *> disks;

    int num_disks = obj_template->get("DISK", disks);

    *snap = 0;

    for(int i=0; i<num_disks; i++)
    {
        if ( disks[i]->vector_value("ATTACH") == "YES" )
        {
            int disk_id;

            disks[i]->vector_value("DISK_ID", disk_id);

            map<int, Snapshots *>::iterator it = snapshots.find(disk_id);

            if (it != snapshots.end())
            {
                *snap = it->second;
                snapshots.erase(it);
            }

            return static_cast<VectorAttribute *>(obj_template->remove(disks[i]));
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachine::is_volatile(const VectorAttribute * disk)
{
    string type = disk->vector_value("TYPE");

    one_util::toupper(type);

    return ( type == "SWAP" || type == "FS");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachine::is_persistent(const VectorAttribute * disk)
{
    bool pers_disk;

    disk->vector_value("PERSISTENT", pers_disk);

    return pers_disk;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachine::is_imported() const
{
    bool imported = false;

    get_template_attribute("IMPORTED", imported);

    return imported;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachine::is_imported_action_supported(History::VMAction action) const
{
    if (!hasHistory())
    {
        return false;
    }

    VirtualMachineManager * vmm = Nebula::instance().get_vmm();

    return vmm->is_imported_action_supported(get_vmm_mad(), action);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

long long VirtualMachine::get_system_disk_size(Template * tmpl)
{
    long long size = 0;
    long long disk_size, snapshot_size;

    vector<const VectorAttribute*> disks;

    int num_disks = tmpl->get("DISK", disks);

    for (int i = 0 ; i < num_disks ; i++)
    {
        if (disks[i]->vector_value("SIZE", disk_size) != 0)
        {
            continue;
        }

        if (is_volatile(disks[i]))
        {
            size += disk_size;
        }
        else if ( disk_tm_target(disks[i]) == "SYSTEM")
        {
            size += disk_size;

            if (disks[i]->vector_value("DISK_SNAPSHOT_TOTAL_SIZE", snapshot_size) == 0)
            {
                size += snapshot_size;
            }
        }
    }

    return size;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string VirtualMachine::disk_tm_target(const VectorAttribute *  disk)
{
    bool    clone;
    string  target;

    if (disk->vector_value("CLONE", clone) != 0)
    {
        return "";
    }

    if (clone)
    {
        target = disk->vector_value("CLONE_TARGET");
    }
    else
    {
        target = disk->vector_value("LN_TARGET");
    }

    return one_util::toupper(target);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VectorAttribute * VirtualMachine::get_attach_nic_info(
                            VirtualMachineTemplate * tmpl,
                            int&                     max_nic_id,
                            string&                  error_str)
{
    vector<VectorAttribute *> nics;
    VectorAttribute * nic;

    int nic_id;
    int num_nics;

    // -------------------------------------------------------------------------
    // Get the highest NIC_ID
    // -------------------------------------------------------------------------
    max_nic_id = -1;

    num_nics = obj_template->get("NIC", nics);

    for(int i=0; i<num_nics; i++)
    {
        nics[i]->vector_value("NIC_ID", nic_id);

        if ( nic_id > max_nic_id )
        {
            max_nic_id = nic_id;
        }
    }

    // -------------------------------------------------------------------------
    // Get the new NIC attribute from the template
    // -------------------------------------------------------------------------

    nics.clear();

    if ( tmpl->get("NIC", nics) != 1 )
    {
        error_str = "The template must contain one NIC attribute";
        return 0;
    }

    nic = tmpl->get("NIC");

    if ( nic == 0 )
    {
        error_str = "Internal error parsing NIC attribute";
        return 0;
    }

    nic = nic->clone();

    merge_nic_defaults(nic);

    return nic;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::set_up_attach_nic(
                        int                      vm_id,
                        set<int>&                vm_sgs,
                        VectorAttribute *        new_nic,
                        vector<VectorAttribute*> &rules,
                        int                      max_nic_id,
                        int                      uid,
                        string&                  error_str)
{
    Nebula&             nd     = Nebula::instance();
    VirtualNetworkPool* vnpool = nd.get_vnpool();

    set<int> nic_sgs;

    int rc = vnpool->nic_attribute(PoolObjectSQL::VM,
                        new_nic, max_nic_id+1, uid, vm_id, error_str);

    if ( rc == -1 ) //-2 is not using a pre-defined network
    {
        return -1;
    }

    get_security_groups(new_nic, nic_sgs);

    for (set<int>::iterator it = vm_sgs.begin(); it != vm_sgs.end(); it++)
    {
        nic_sgs.erase(*it);
    }

    get_security_group_rules(vm_id, nic_sgs, rules);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VectorAttribute* VirtualMachine::get_attach_nic()
{
    vector<VectorAttribute  *> nics;
    int num_nics;

    num_nics = obj_template->get("NIC", nics);

    for(int i=0; i<num_nics; i++)
    {
        if ( nics[i]->vector_value("ATTACH") == "YES" )
        {
            return nics[i];
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::attach_nic_success()
{
    VectorAttribute * nic = get_attach_nic();

    if (nic != 0)
    {
        nic->remove("ATTACH");
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VectorAttribute * VirtualMachine::attach_nic_failure()
{

    VectorAttribute * nic = get_attach_nic();

    if (nic == 0)
    {
        return 0;
    }

    obj_template->remove(nic);

    VectorAttribute * context = obj_template->get("CONTEXT");

    if (context != 0)
    {
        int nic_id;

        nic->vector_value("NIC_ID", nic_id);

        clear_context_network(NETWORK_CONTEXT,  NUM_NETWORK_CONTEXT,  context, nic_id);
        clear_context_network(NETWORK6_CONTEXT, NUM_NETWORK6_CONTEXT, context, nic_id);
    }

    return nic;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::detach_nic_failure()
{
    bool net_context;

    VectorAttribute * nic = get_attach_nic();

    if (nic == 0)
    {
        return;
    }

    nic->remove("ATTACH");

    VectorAttribute * context = obj_template->get("CONTEXT");

    if (context == 0)
    {
        return;
    }

    context->vector_value("NETWORK", net_context);

    if (net_context)
    {
        parse_context_network(NETWORK_CONTEXT, NUM_NETWORK_CONTEXT,
                context, nic);

        if (!nic->vector_value("IP6_GLOBAL").empty())
        {
            parse_context_network(NETWORK6_CONTEXT, NUM_NETWORK6_CONTEXT,
                    context, nic);
        }

        reparse_context();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VectorAttribute * VirtualMachine::detach_nic_success()
{
    VectorAttribute * nic = get_attach_nic();

    if (nic == 0)
    {
        return 0;
    }

    obj_template->remove(nic);

    return nic;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::set_attach_nic(
        VectorAttribute *       new_nic,
        vector<VectorAttribute*> &rules)
{
    bool                net_context;

    vector<VectorAttribute*>::iterator it;

    new_nic->replace("ATTACH", "YES");

    obj_template->set(new_nic);

    for(it = rules.begin(); it != rules.end(); it++ )
    {
        obj_template->set(*it);
    }

    VectorAttribute * context = obj_template->get("CONTEXT");

    if (context == 0)
    {
        return;
    }

    context->vector_value("NETWORK", net_context);

    if (net_context)
    {
        parse_context_network(NETWORK_CONTEXT, NUM_NETWORK_CONTEXT,
                context, new_nic);

        if (!new_nic->vector_value("IP6_GLOBAL").empty())
        {
            parse_context_network(NETWORK6_CONTEXT, NUM_NETWORK6_CONTEXT,
                    context, new_nic);
        }

        reparse_context();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::set_detach_nic(int nic_id)
{
    int n_id;

    vector<VectorAttribute *> nics;

    bool found = false;

    int num_nics = obj_template->get("NIC", nics);

    for(int i=0; !found && i<num_nics; i++)
    {
        nics[i]->vector_value("NIC_ID", n_id);

        if ( n_id == nic_id )
        {
            nics[i]->replace("ATTACH", "YES");
            found = true;
        }
    }

    if (!found)
    {
        return -1;
    }

    VectorAttribute * context = obj_template->get("CONTEXT");

    if (context != 0)
    {
        clear_context_network(NETWORK_CONTEXT,  NUM_NETWORK_CONTEXT,
                            context, nic_id);

        clear_context_network(NETWORK6_CONTEXT, NUM_NETWORK6_CONTEXT,
                            context, nic_id);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::release_disk_images()
{
    int iid;
    int num_disks;
    int did = -1;

    bool img_error;

    vector<const VectorAttribute * > disks;
    ImageManager *              imagem;

    string  disk_base_path = "";

    Nebula& nd = Nebula::instance();
    imagem     = nd.get_imagem();

    num_disks  = get_template_attribute("DISK",disks);

    for(int i=0; i<num_disks; i++)
    {
        img_error = (state == ACTIVE && lcm_state != EPILOG) &&
                     state != PENDING && state != HOLD;

        if ( disks[i]->vector_value("IMAGE_ID", iid) == 0 )
        {
            disks[i]->vector_value("DISK_ID", did);

            map<int, Snapshots *>::iterator it = snapshots.find(did);

            if (it != snapshots.end())
            {
                imagem->set_image_snapshots(iid, *(it->second));
            }

            imagem->release_image(oid, iid, img_error);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::new_snapshot(string& name, int& snap_id)
{
    int num_snaps;
    int id;
    int max_id = -1;

    vector<VectorAttribute *> snaps;

    num_snaps = obj_template->get("SNAPSHOT", snaps);

    for(int i=0; i<num_snaps; i++)
    {
        snaps[i]->vector_value("SNAPSHOT_ID", id);

        if (id > max_id)
        {
            max_id = id;
        }
    }

    snap_id = max_id + 1;

    if (name.empty())
    {
        ostringstream oss;

        oss << "snapshot-" << snap_id;

        name = oss.str();
    }

    VectorAttribute * snap = new VectorAttribute("SNAPSHOT");
    snap->replace("SNAPSHOT_ID", snap_id);
    snap->replace("NAME", name);
    snap->replace("TIME", (int)time(0));
    snap->replace("HYPERVISOR_ID", "");

    snap->replace("ACTIVE", "YES");

    obj_template->set(snap);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::set_active_snapshot(int snap_id)
{
    int s_id;

    vector<VectorAttribute *> snaps;
    int num_snaps = obj_template->get("SNAPSHOT", snaps);

    for(int i=0; i<num_snaps; i++)
    {
        snaps[i]->vector_value("SNAPSHOT_ID", s_id);

        if ( s_id == snap_id )
        {
            snaps[i]->replace("ACTIVE", "YES");
            return 0;
        }
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::update_snapshot_id(string& hypervisor_id)
{
    vector<VectorAttribute  *> snaps;
    int num_snaps = obj_template->get("SNAPSHOT", snaps);

    for(int i=0; i<num_snaps; i++)
    {
        if ( snaps[i]->vector_value("ACTIVE") == "YES" )
        {
            snaps[i]->replace("HYPERVISOR_ID", hypervisor_id);
            break;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::clear_active_snapshot()
{
    vector<VectorAttribute  *> snaps;

    int num_snaps = obj_template->get("SNAPSHOT", snaps);

    for(int i=0; i<num_snaps; i++)
    {
        if ( snaps[i]->vector_value("ACTIVE") == "YES" )
        {
            snaps[i]->remove("ACTIVE");
            return;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::delete_active_snapshot()
{
    vector<VectorAttribute *> snaps;
    int num_snaps = obj_template->get("SNAPSHOT", snaps);

    for(int i=0; i<num_snaps; i++)
    {
        if ( snaps[i]->vector_value("ACTIVE") == "YES" )
        {
            delete obj_template->remove(snaps[i]);

            return;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::delete_snapshots()
{
    obj_template->erase("SNAPSHOT");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::get_network_leases(string& estr)
{
    int                   num_nics, rc;
    vector<Attribute  * > nics;
    VirtualNetworkPool *  vnpool;
    VectorAttribute *     nic;

    Nebula& nd = Nebula::instance();
    vnpool     = nd.get_vnpool();

    vector<VectorAttribute*>            sg_rules;
    vector<VectorAttribute*>::iterator  it;

    set<int> vm_sgs;

    num_nics = user_obj_template->remove("NIC",nics);

    for (vector<Attribute*>::iterator it=nics.begin(); it != nics.end(); )
    {
        if ( (*it)->type() != Attribute::VECTOR )
        {
            delete *it;
            num_nics--;
            it = nics.erase(it);
        }
        else
        {
            obj_template->set(*it);
            ++it;
        }
    }

    for(int i=0; i<num_nics; i++)
    {
        nic = static_cast<VectorAttribute * >(nics[i]);

        merge_nic_defaults(nic);

        rc = vnpool->nic_attribute(PoolObjectSQL::VM, nic, i, uid, oid, estr);

        if (rc == -1)
        {
            return -1;
        }
    }

    get_security_groups(vm_sgs);

    get_security_group_rules(get_oid(), vm_sgs, sg_rules);

    for(it = sg_rules.begin(); it != sg_rules.end(); it++ )
    {
        obj_template->set(*it);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::merge_nic_defaults(VectorAttribute* nic)
{
    VectorAttribute * nic_def = obj_template->get("NIC_DEFAULT");

    if (nic_def == 0)
    {
        return;
    }

    nic->merge(nic_def, false);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::release_network_leases()
{
    string vnid;
    string ip;

    vector<VectorAttribute const  * > nics;
    int num_nics = get_template_attribute("NIC",nics);

    for(int i=0; i<num_nics; i++)
    {
        release_network_leases(nics[i], oid);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::release_network_leases(
        VectorAttribute const * nic, int vmid)
{
    VirtualNetworkPool* vnpool = Nebula::instance().get_vnpool();
    VirtualNetwork*     vn;

    int     vnid;
    int     ar_id;
    string  mac;
    string  error_msg;

    if ( nic == 0 )
    {
        return -1;
    }

    release_security_groups(vmid, nic);

    if (nic->vector_value("NETWORK_ID", vnid) != 0)
    {
        return -1;
    }

    mac = nic->vector_value("MAC");

    if (mac.empty())
    {
        return -1;
    }

    vn = vnpool->get(vnid, true);

    if ( vn == 0 )
    {
        return -1;
    }

    if (nic->vector_value("AR_ID", ar_id) == 0)
    {
        vn->free_addr(ar_id, PoolObjectSQL::VM, vmid, mac);
    }
    else
    {
        vn->free_addr(PoolObjectSQL::VM, vmid, mac);
    }

    vnpool->update(vn);

    vn->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::get_security_groups(set<int>& sgs) const
{
    vector<VectorAttribute *> ns;

    int num_nics = obj_template->get("NIC", ns);

    for(int i=0; i<num_nics; i++)
    {
        get_security_groups(ns[i], sgs);
    }
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::get_security_group_rules(int id, set<int>& secgroups,
        vector<VectorAttribute*> &rules)
{
    set<int>::iterator sg_it;

    SecurityGroup*     sgroup;
    SecurityGroupPool* sgroup_pool = Nebula::instance().get_secgrouppool();

    vector<VectorAttribute*>::iterator rule_it;
    vector<VectorAttribute*> sgroup_rules;

    int                 vnet_id;
    VirtualNetwork*     vnet;
    VirtualNetworkPool* vnet_pool = Nebula::instance().get_vnpool();

    for (sg_it = secgroups.begin(); sg_it != secgroups.end(); sg_it++, sgroup_rules.clear())
    {
        sgroup = sgroup_pool->get(*sg_it, true);

        if (sgroup == 0)
        {
            continue;
        }

        sgroup->add_vm(id);

        sgroup_pool->update(sgroup);

        sgroup->get_rules(sgroup_rules);

        sgroup->unlock();

        for (rule_it = sgroup_rules.begin(); rule_it != sgroup_rules.end(); rule_it++)
        {
            if ( (*rule_it)->vector_value("NETWORK_ID", vnet_id) != -1 )
            {
                vector<VectorAttribute*> vnet_rules;

                VectorAttribute * rule = *rule_it;

                vnet = vnet_pool->get(vnet_id, true);

                if (vnet == 0)
                {
                    continue;
                }

                vnet->process_security_rule(rule, vnet_rules);

                delete rule;

                rules.insert(rules.end(), vnet_rules.begin(), vnet_rules.end());

                vnet->unlock();
            }
            else
            {
                rules.push_back(*rule_it);
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::release_security_groups(int id, const VectorAttribute *nic)
{
    set<int>::iterator it;
    set<int> secgroups;

    SecurityGroup*      sgroup;
    SecurityGroupPool*  sgroup_pool = Nebula::instance().get_secgrouppool();

    get_security_groups(nic, secgroups);

    for (it = secgroups.begin(); it != secgroups.end(); it++)
    {
        sgroup = sgroup_pool->get(*it, true);

        if (sgroup == 0)
        {
            continue;
        }

        sgroup->del_vm(id);

        sgroup_pool->update(sgroup);

        sgroup->unlock();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::get_vrouter_id()
{
    int vrid;

    if (!obj_template->get("VROUTER_ID", vrid))
    {
        vrid = -1;
    }

    return vrid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachine::is_vrouter()
{
    return get_vrouter_id() != -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachine::is_vrouter_action_supported(History::VMAction action)
{
    return (action == History::MIGRATE_ACTION ||
            action == History::LIVE_MIGRATE_ACTION ||
            action == History::HOLD_ACTION ||
            action == History::RELEASE_ACTION ||
            action == History::RESUME_ACTION ||
            action == History::BOOT_ACTION ||
            action == History::REBOOT_ACTION ||
            action == History::REBOOT_HARD_ACTION ||
            action == History::RESCHED_ACTION ||
            action == History::UNRESCHED_ACTION ||
            action == History::DISK_SNAPSHOT_CREATE_ACTION ||
            action == History::DISK_SNAPSHOT_DELETE_ACTION);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::generate_context(string &files, int &disk_id,
        const string& token_password)
{
    ofstream file;
    string   files_ds;

    vector<const VectorAttribute*> attrs;

    map<string, string>::const_iterator it;

    files = "";
    bool token;

    if ( history == 0 )
    {
        return -1;
    }

    const VectorAttribute * context = obj_template->get("CONTEXT");

    if ( context == 0 )
    {
        log("VM", Log::INFO, "Virtual Machine has no context");
        return 0;
    }

    file.open(history->context_file.c_str(),ios::out);

    if (file.fail() == true)
    {
        ostringstream oss;

        oss << "Could not open context file: " << history->context_file;
        log("VM", Log::ERROR, oss);
        return -1;
    }

    files    = context->vector_value("FILES");
    files_ds = context->vector_value("FILES_DS");

    if (!files_ds.empty())
    {
        files += " ";
        files += files_ds;
    }

    for (size_t i=0;i<files.length();i++)
    {
        if (files[i] == '\n')
        {
            files[i] = ' ';
        }
    }

    context->vector_value("TOKEN", token);

    if (token)
    {
        ofstream      token_file;
        ostringstream oss;

        string* encrypted;
        string  tk_error;

        if (token_password.empty())
        {
            tk_error = "CONTEXT/TOKEN set, but TOKEN_PASSWORD is not defined"
                " in the user template.";

            file.close();

            log("VM", Log::ERROR, tk_error.c_str());
            set_template_error_message(tk_error);

            return -1;
        }

        token_file.open(history->token_file.c_str(), ios::out);

        if (token_file.fail())
        {
            tk_error = "Cannot create token file";

            file.close();

            log("VM", Log::ERROR, tk_error.c_str());
            set_template_error_message(tk_error);

            return -1;
        }

        oss << oid << ':' << stime;

        encrypted = one_util::aes256cbc_encrypt(oss.str(), token_password);

        token_file << *encrypted << endl;

        token_file.close();

        delete encrypted;

        files += (" " + history->token_file);
    }

    const map<string, string> values = context->value();

    file << "# Context variables generated by OpenNebula\n";

    for (it=values.begin(); it != values.end(); it++ )
    {
        //Replace every ' in value by '\''
        string escape_str(it->second);
        size_t pos = 0;

        while ((pos = escape_str.find('\'', pos)) != string::npos)
        {
            escape_str.replace(pos,1,"'\\''");
            pos = pos + 4;
        }

        file << it->first <<"='" << escape_str << "'" << endl;
    }

    file.close();

    context->vector_value("DISK_ID", disk_id);

    return 1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::get_created_by_uid() const
{
    int created_by_uid;

    if (obj_template->get("CREATED_BY", created_by_uid))
    {
        return created_by_uid;
    }

    return get_uid();
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const VectorAttribute* VirtualMachine::get_disk(int disk_id) const
{
    int tdisk_id;

    vector<const VectorAttribute  *> disks;
    int num_disks = obj_template->get("DISK", disks);

    for(int i=0; i<num_disks; i++)
    {
        disks[i]->vector_value("DISK_ID", tdisk_id);

        if ( tdisk_id == disk_id )
        {
            return disks[i];
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const VectorAttribute* VirtualMachine::get_nic(int nic_id) const
{
    int num_nics;
    int tnic_id;

    vector<const VectorAttribute  *> nics;

    num_nics = obj_template->get("NIC", nics);

    for(int i=0; i<num_nics; i++)
    {
        nics[i]->vector_value("NIC_ID", tnic_id);

        if ( tnic_id == nic_id )
        {
            return nics[i];
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::set_saveas_disk(int disk_id, int snap_id, int &iid,
                                    long long &size, string& err_str)
{
    iid = -1;

    VectorAttribute * disk = get_disk(disk_id);

    if (disk == 0)
    {
        err_str = "DISK does not exist.";
        return -1;
    }

    if (disk->vector_value("IMAGE_ID", iid) != 0)
    {
        iid = -1;
        err_str = "DISK does not have a valid IMAGE_ID.";
        return -1;
    }

    const Snapshots * snaps = get_disk_snapshots(disk_id, err_str);

    if (snap_id != -1)
    {
        if (snaps == 0 || !snaps->exists(snap_id))
        {
            err_str = "Snapshot does not exist.";
            return -1;
        }
    }

    disk->replace("HOTPLUG_SAVE_AS_ACTIVE", "YES");
    disk->replace("HOTPLUG_SAVE_AS_SNAPSHOT_ID", snap_id);

    size = 0;
    disk->vector_value("SIZE", size);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::set_saveas_disk(int disk_id, const string& source, int iid)
{
    if (lcm_state != HOTPLUG_SAVEAS && lcm_state != HOTPLUG_SAVEAS_SUSPENDED
        && lcm_state != HOTPLUG_SAVEAS_POWEROFF )
    {
        return -1;
    }

    VectorAttribute * disk = get_disk(disk_id);

    if ( disk == 0 )
    {
        return -1;
    }

    disk->replace("HOTPLUG_SAVE_AS", iid);
    disk->replace("HOTPLUG_SAVE_AS_SOURCE", source);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::set_saveas_state()
{
    switch (state)
    {
        case ACTIVE:
            if (lcm_state != RUNNING)
            {
                return -1;
            }

            set_state(HOTPLUG_SAVEAS);
            break;

        case POWEROFF:
            set_state(ACTIVE);
            set_state(HOTPLUG_SAVEAS_POWEROFF);
            break;

        case SUSPENDED:
            set_state(ACTIVE);
            set_state(HOTPLUG_SAVEAS_SUSPENDED);
            break;

        default:
            return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::clear_saveas_state()
{
    switch (lcm_state)
    {
        case HOTPLUG_SAVEAS:
            set_state(RUNNING);
            break;

        case HOTPLUG_SAVEAS_POWEROFF:
            set_state(POWEROFF);
            set_state(LCM_INIT);
            break;

        case HOTPLUG_SAVEAS_SUSPENDED:
            set_state(SUSPENDED);
            set_state(LCM_INIT);
            break;

        default:
            return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::clear_saveas_disk()
{
    vector<VectorAttribute  *> disks;

    int  image_id;
    bool active;

    int num_disks = obj_template->get("DISK", disks);

    for(int i=0; i<num_disks; i++)
    {
        disks[i]->vector_value("HOTPLUG_SAVE_AS_ACTIVE", active);

        if (active)
        {
            disks[i]->vector_value("HOTPLUG_SAVE_AS", image_id);

            disks[i]->remove("HOTPLUG_SAVE_AS_ACTIVE");
            disks[i]->remove("HOTPLUG_SAVE_AS");
            disks[i]->remove("HOTPLUG_SAVE_AS_SOURCE");
            disks[i]->remove("HOTPLUG_SAVE_AS_SNAPSHOT_ID");

            return image_id;
        }
    }

    return -1;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::get_saveas_disk(int& disk_id, string& source,
        int& image_id, string& snap_id, string& tm_mad, string& ds_id)
{
    vector<VectorAttribute  *> disks;

    int rc;
    int num_disks = obj_template->get("DISK", disks);

    for(int i=0; i<num_disks; i++)
    {
        if ( disks[i]->vector_value("HOTPLUG_SAVE_AS_ACTIVE") == "YES" )
        {
            rc  = disks[i]->vector_value("HOTPLUG_SAVE_AS_SOURCE", source);
            rc += disks[i]->vector_value("HOTPLUG_SAVE_AS", image_id);
            rc += disks[i]->vector_value("HOTPLUG_SAVE_AS_SNAPSHOT_ID", snap_id);
            rc += disks[i]->vector_value("DISK_ID",  disk_id);
            rc += disks[i]->vector_value("DATASTORE_ID", ds_id);
            rc += disks[i]->vector_value("TM_MAD", tm_mad);

            return rc;
        }
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::set_auth_request(int uid,
                                      AuthRequest& ar,
                                      VirtualMachineTemplate *tmpl)
{
    int num;
    vector<VectorAttribute  *> vectors;

    Nebula& nd = Nebula::instance();

    ImagePool *          ipool  = nd.get_ipool();
    VirtualNetworkPool * vnpool = nd.get_vnpool();
    SecurityGroupPool *  sgpool = nd.get_secgrouppool();

    set<int>        sgroups;
    SecurityGroup * sgroup;

    num = tmpl->get("DISK", vectors);

    for(int i=0; i<num; i++)
    {
        ipool->authorize_disk(vectors[i], uid, &ar);
    }

    vectors.clear();

    num = tmpl->get("NIC", vectors);

    for(int i=0; i<num; i++, sgroups.clear())
    {
        vnpool->authorize_nic(PoolObjectSQL::VM, vectors[i], uid, &ar);

        get_security_groups(vectors[i], sgroups);

        for(set<int>::iterator it = sgroups.begin(); it != sgroups.end(); it++)
        {
            sgroup = sgpool->get(*it, true);

            if(sgroup != 0)
            {
                PoolObjectAuth perm;
                sgroup->get_permissions(perm);

                sgroup->unlock();

                ar.add_auth(AuthRequest::USE, perm);
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::disk_extended_info(int uid,
                                       VirtualMachineTemplate *tmpl)
{
    ImagePool * ipool  = Nebula::instance().get_ipool();

    vector<VectorAttribute  * > disks;
    int num = tmpl->get("DISK",disks);

    for(int i=0; i<num; i++)
    {
        ipool->disk_attribute(disks[i], i, uid);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachine::volatile_disk_extended_info(Template *tmpl)
{
    int  num;
    vector<VectorAttribute  * > disks;
    DatastorePool * ds_pool = Nebula::instance().get_dspool();

    bool found = false;

    num = tmpl->get("DISK", disks);

    for(int i=0; i<num; i++)
    {
        if ( !is_volatile(disks[i]) )
        {
            continue;
        }

        found = true;

        if (hasHistory())
        {
            ds_pool->disk_attribute(get_ds_id(), disks[i]);
        }
    }

    return found;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

pthread_mutex_t VirtualMachine::lex_mutex = PTHREAD_MUTEX_INITIALIZER;

extern "C"
{
    typedef struct yy_buffer_state * YY_BUFFER_STATE;

    int vm_var_parse (VirtualMachine * vm,
                      ostringstream *  parsed,
                      char **          errmsg);

    int vm_file_var_parse (VirtualMachine * vm,
                           vector<int> *    img_ids,
                           char **          errmsg);

    int vm_var_lex_destroy();

    YY_BUFFER_STATE vm_var__scan_string(const char * str);

    void vm_var__delete_buffer(YY_BUFFER_STATE);
}

/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_template_attribute(const string& attribute,
                                             string&       parsed,
                                             string&       error_str)
{
    YY_BUFFER_STATE  str_buffer = 0;
    const char *     str;
    int              rc;
    ostringstream    oss_parsed;
    char *           error_msg = 0;

    pthread_mutex_lock(&lex_mutex);

    str        = attribute.c_str();
    str_buffer = vm_var__scan_string(str);

    if (str_buffer == 0)
    {
        goto error_yy;
    }

    rc = vm_var_parse(this, &oss_parsed, &error_msg);

    vm_var__delete_buffer(str_buffer);

    vm_var_lex_destroy();

    pthread_mutex_unlock(&lex_mutex);

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

error_yy:
    log("VM",Log::ERROR,"Error setting scan buffer");
    pthread_mutex_unlock(&lex_mutex);
    return -1;
}

/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_file_attribute(string       attribute,
                                         vector<int>& img_ids,
                                         string&      error)
{
    YY_BUFFER_STATE  str_buffer = 0;
    const char *     str;
    int              rc;
    ostringstream    oss_parsed;
    char *           error_msg = 0;

    size_t non_blank_pos;

    //Removes leading blanks from attribute, these are not managed
    //by the parser as it is common to the other VM varibales
    non_blank_pos = attribute.find_first_not_of(" \t\n\v\f\r");

    if ( non_blank_pos != string::npos )
    {
        attribute.erase(0, non_blank_pos);
    }

    pthread_mutex_lock(&lex_mutex);

    str        = attribute.c_str();
    str_buffer = vm_var__scan_string(str);

    if (str_buffer == 0)
    {
        goto error_yy;
    }

    rc = vm_file_var_parse(this, &img_ids, &error_msg);

    vm_var__delete_buffer(str_buffer);

    vm_var_lex_destroy();

    pthread_mutex_unlock(&lex_mutex);

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

error_yy:
    log("VM",Log::ERROR,"Error setting scan buffer");
    pthread_mutex_unlock(&lex_mutex);
    return -1;
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& VirtualMachine::to_xml_extended(string& xml, int n_history) const
{
    string template_xml;
    string user_template_xml;
    string monitoring_xml;
    string history_xml;
    string perm_xml;
    string snap_xml;

    ostringstream   oss;

    oss << "<VM>"
        << "<ID>"        << oid       << "</ID>"
        << "<UID>"       << uid       << "</UID>"
        << "<GID>"       << gid       << "</GID>"
        << "<UNAME>"     << uname     << "</UNAME>"
        << "<GNAME>"     << gname     << "</GNAME>"
        << "<NAME>"      << name      << "</NAME>"
        << perms_to_xml(perm_xml)
        << "<LAST_POLL>" << last_poll << "</LAST_POLL>"
        << "<STATE>"     << state     << "</STATE>"
        << "<LCM_STATE>" << lcm_state << "</LCM_STATE>"
        << "<PREV_STATE>"     << prev_state     << "</PREV_STATE>"
        << "<PREV_LCM_STATE>" << prev_lcm_state << "</PREV_LCM_STATE>"
        << "<RESCHED>"   << resched   << "</RESCHED>"
        << "<STIME>"     << stime     << "</STIME>"
        << "<ETIME>"     << etime     << "</ETIME>"
        << "<DEPLOY_ID>" << deploy_id << "</DEPLOY_ID>"
        << monitoring.to_xml(monitoring_xml)
        << obj_template->to_xml(template_xml)
        << user_obj_template->to_xml(user_template_xml);

    if ( hasHistory() && n_history > 0 )
    {
        oss << "<HISTORY_RECORDS>";

        if ( n_history == 2 )
        {
            for (unsigned int i=0; i < history_records.size(); i++)
            {
                oss << history_records[i]->to_xml(history_xml);
            }
        }
        else
        {
            oss << history->to_xml(history_xml);
        }

        oss << "</HISTORY_RECORDS>";
    }
    else
    {
        oss << "<HISTORY_RECORDS/>";
    }

    for (map<int, Snapshots *>::const_iterator it = snapshots.begin();
            it != snapshots.end() ; it++)
    {
        oss << it->second->to_xml(snap_xml);
    }

    oss << "</VM>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::from_xml(const string &xml_str)
{
    vector<xmlNodePtr> content;

    int istate;
    int ilcmstate;
    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml_str);

    // Get class base attributes
    rc += xpath(oid,       "/VM/ID",    -1);

    rc += xpath(uid,       "/VM/UID",   -1);
    rc += xpath(gid,       "/VM/GID",   -1);

    rc += xpath(uname,     "/VM/UNAME", "not_found");
    rc += xpath(gname,     "/VM/GNAME", "not_found");
    rc += xpath(name,      "/VM/NAME",  "not_found");

    rc += xpath(last_poll, "/VM/LAST_POLL", 0);
    rc += xpath(resched,   "/VM/RESCHED",   0);

    rc += xpath(stime,     "/VM/STIME",    0);
    rc += xpath(etime,     "/VM/ETIME",    0);
    rc += xpath(deploy_id, "/VM/DEPLOY_ID","");

    // Permissions
    rc += perms_from_xml();

    //VM states
    rc += xpath(istate,    "/VM/STATE",     0);
    rc += xpath(ilcmstate, "/VM/LCM_STATE", 0);

    state     = static_cast<VmState>(istate);
    lcm_state = static_cast<LcmState>(ilcmstate);

    xpath(istate,    "/VM/PREV_STATE",     istate);
    xpath(ilcmstate, "/VM/PREV_LCM_STATE", ilcmstate);

    prev_state     = static_cast<VmState>(istate);
    prev_lcm_state = static_cast<LcmState>(ilcmstate);

    // Virtual Machine template
    ObjectXML::get_nodes("/VM/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }
    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    // Virtual Machine Monitoring

    ObjectXML::get_nodes("/VM/MONITORING", content);

    if (content.empty())
    {
        return -1;
    }

    rc += monitoring.from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    // Virtual Machine user template

    ObjectXML::get_nodes("/VM/USER_TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += user_obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    // Last history entry

    ObjectXML::get_nodes("/VM/HISTORY_RECORDS/HISTORY", content);

    if (!content.empty())
    {
        history = new History(oid);
        rc += history->from_xml_node(content[0]);

        history_records.resize(history->seq + 1);
        history_records[history->seq] = history;

        ObjectXML::free_nodes(content);
        content.clear();
    }

    // Virtual Machine user template

    ObjectXML::get_nodes("/VM/SNAPSHOTS", content);

    for (vector<xmlNodePtr>::iterator it=content.begin();it!=content.end();it++)
    {
        Snapshots * snap = new Snapshots(-1);

        rc += snap->from_xml_node(*it);

        if ( rc != 0)
        {
            delete snap;
            break;
        }

        snapshots.insert(pair<int, Snapshots *>(snap->get_disk_id(), snap));
    }

    if (!content.empty())
    {
        ObjectXML::free_nodes(content);
        content.clear();
    }

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string VirtualMachine::get_system_dir() const
{
    ostringstream oss;

    oss << history->ds_location << "/" << history->ds_id << "/"<< oid;

    return oss.str();
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::update_info(const string& monitor_data)
{
    int    rc;
    string error;

    ostringstream oss;

    last_poll = time(0);

    rc = monitoring.update(monitor_data, error);

    if ( rc != 0)
    {
        oss << "Ignoring monitoring information, error:" << error
            << ". Monitor information was: " << monitor_data;

        NebulaLog::log("VMM", Log::ERROR, oss);

        set_template_error_message(oss.str());

        log("VMM", Log::ERROR, oss);

        return -1;
    }

    set_vm_info();

    clear_template_monitor_error();

    oss << "VM " << oid << " successfully monitored: " << monitor_data;

    NebulaLog::log("VMM", Log::DEBUG, oss);

    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::replace_template(
        const string&   tmpl_str,
        bool            keep_restricted,
        string&         error)
{
    VirtualMachineTemplate * new_tmpl =
            new VirtualMachineTemplate(false,'=',"USER_TEMPLATE");

    if ( new_tmpl == 0 )
    {
        error = "Cannot allocate a new template";
        return -1;
    }

    if ( new_tmpl->parse_str_or_xml(tmpl_str, error) != 0 )
    {
        delete new_tmpl;
        return -1;
    }

    if (keep_restricted)
    {
        new_tmpl->remove_restricted();

        if (user_obj_template != 0)
        {
            user_obj_template->remove_all_except_restricted();

            string aux_error;
            new_tmpl->merge(user_obj_template, aux_error);
        }
    }

    delete user_obj_template;

    user_obj_template = new_tmpl;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::append_template(
        const string&   tmpl_str,
        bool            keep_restricted,
        string&         error)
{
    VirtualMachineTemplate * new_tmpl =
            new VirtualMachineTemplate(false,'=',"USER_TEMPLATE");

    if ( new_tmpl == 0 )
    {
        error = "Cannot allocate a new template";
        return -1;
    }

    if ( new_tmpl->parse_str_or_xml(tmpl_str, error) != 0 )
    {
        delete new_tmpl;
        return -1;
    }

    if (keep_restricted)
    {
        new_tmpl->remove_restricted();
    }

    if (user_obj_template != 0)
    {
        user_obj_template->merge(new_tmpl, error);
        delete new_tmpl;
    }
    else
    {
        user_obj_template = new_tmpl;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::set_template_error_message(const string& message)
{
    set_template_error_message("ERROR", message);
}

/* -------------------------------------------------------------------------- */

void VirtualMachine::set_template_error_message(const string& name,
                                               const string& message)
{
    SingleAttribute * attr;
    ostringstream     error_value;

    error_value << one_util::log_time() << " : " << message;

    attr = new SingleAttribute(name, error_value.str());

    user_obj_template->erase(name);
    user_obj_template->set(attr);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::clear_template_error_message()
{
    user_obj_template->erase("ERROR");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::set_template_monitor_error(const string& message)
{
    set_template_error_message("ERROR_MONITOR", message);
}

/* -------------------------------------------------------------------------- */

void VirtualMachine::clear_template_monitor_error()
{
    user_obj_template->erase("ERROR_MONITOR");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::get_public_clouds(const string& pname, set<string> &clouds) const
{
    vector<VectorAttribute *>                 attrs;
    vector<VectorAttribute *>::const_iterator it;

    user_obj_template->get(pname, attrs);

    if ( !attrs.empty() && pname == "EC2" )
    {
	    clouds.insert("ec2");
    }

    for (it = attrs.begin(); it != attrs.end(); it++)
    {
        string type = (*it)->vector_value("TYPE");

        if (!type.empty())
        {
            clouds.insert(type);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_public_clouds(const char * pname, string& error)
{
    vector<VectorAttribute *>           attrs;
    vector<VectorAttribute *>::iterator it;

    string * str;
    string p_vatt;

    int rc  = 0;
    int num = user_obj_template->remove(pname, attrs);

    for (it = attrs.begin(); it != attrs.end(); it++)
    {
        str = (*it)->marshall();

        if ( str == 0 )
        {
            ostringstream oss;
            oss << "Internal error processing " << pname;
            error = oss.str();
            rc    = -1;
            break;
        }

        rc = parse_template_attribute(*str, p_vatt, error);

        delete str;

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

int VirtualMachine::set_snapshot_disk(int did, int snap_id)
{
    VectorAttribute * disk;

    disk = get_disk(did);

    if ( disk == 0 )
    {
        return -1;
    }

    disk->replace("DISK_SNAPSHOT_ACTIVE", "YES");
    disk->replace("DISK_SNAPSHOT_ID", snap_id);

    return 0;
}

/* -------------------------------------------------------------------------- */

void VirtualMachine::clear_snapshot_disk()
{
    vector<VectorAttribute  *> disks;
    int num_disks = obj_template->get("DISK", disks);

    for(int i=0; i<num_disks; i++)
    {
        if ( disks[i]->vector_value("DISK_SNAPSHOT_ACTIVE") == "YES" )
        {
            disks[i]->remove("DISK_SNAPSHOT_ACTIVE");
            disks[i]->remove("DISK_SNAPSHOT_ID");
            return;
        }
    }
}

/* -------------------------------------------------------------------------- */

int VirtualMachine::get_snapshot_disk(int& ds_id, string& tm_mad,
        int& disk_id, int& snap_id)
{
    vector<VectorAttribute *> disks;
    int num_disks = obj_template->get("DISK", disks);

    for(int i=0; i<num_disks; i++)
    {
        if ( disks[i]->vector_value("DISK_SNAPSHOT_ACTIVE") == "YES" )
        {
            map<int, Snapshots *>::iterator it;
            int did, rc;

            if (disks[i]->vector_value("DISK_ID", did) == -1)
            {
                return -1;
            }

            it = snapshots.find(did);

            if (it == snapshots.end())
            {
                return -1;
            }

            tm_mad  = disks[i]->vector_value("TM_MAD");
            rc =  disks[i]->vector_value("DATASTORE_ID", ds_id);
            rc += disks[i]->vector_value("DISK_ID", disk_id);
            rc += disks[i]->vector_value("DISK_SNAPSHOT_ID", snap_id);

            if (tm_mad.empty() || rc != 0)
            {
                return -1;
            }

            return 0;
        }
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::new_disk_snapshot(int did, const string& name, string& error)
{
    map<int, Snapshots *>::iterator it;
    long long size_mb, snap_size;
    int snap_id;

    VectorAttribute * disk;

    disk = get_disk(did);

    if ( disk == 0 )
    {
        error = "VM disk does not exist";
        return -1;
    }

    if (is_volatile(disk))
    {
        error = "Cannot make snapshots on volatile disks";
        return -1;
    }

    if (disk->vector_value("SIZE", size_mb) != 0 )
    {
        error = "Wrong size in disk";
        return -1;
    }

    it = snapshots.find(did);

    if ( it == snapshots.end() )
    {
        Snapshots * snap = new Snapshots(did);

        snap_id   = snap->create_snapshot(name, size_mb);
        snap_size = size_mb;

        if (snap_id != -1)
        {
            snapshots.insert(pair<int, Snapshots *>(did, snap));
        }
        else
        {
            delete snap;
        }
    }
    else
    {
        snap_id   = it->second->create_snapshot(name, size_mb);
        snap_size = it->second->get_total_size();
    }

    if (snap_id != -1)
    {
        disk->replace("DISK_SNAPSHOT_ACTIVE", "YES");
        disk->replace("DISK_SNAPSHOT_ID", snap_id);
        disk->replace("DISK_SNAPSHOT_TOTAL_SIZE", snap_size);
    }

    return snap_id;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const Snapshots * VirtualMachine::get_disk_snapshots(int did, string& error) const
{
    const VectorAttribute * disk = get_disk(did);

    if ( disk == 0 )
    {
        error = "VM disk does not exist";
        return 0;
    }

    map<int, Snapshots *>::const_iterator it = snapshots.find(did);

    if (it == snapshots.end())
    {
        error = "Snapshot does not exist";
        return 0;
    }

    return it->second;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::revert_disk_snapshot(int did, int snap_id)
{
    map<int, Snapshots *>::iterator it;

    VectorAttribute * disk = get_disk(did);

    if ( disk == 0 )
    {
        return -1;
    }

    it = snapshots.find(did);

    if (it == snapshots.end())
    {
        return -1;
    }

    return it->second->active_snapshot(snap_id);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::delete_disk_snapshot(int did, int snap_id,
        Template **ds_quotas, Template **vm_quotas)
{
    map<int, Snapshots *>::iterator it;
    long long snap_size;

    VectorAttribute * delta_disk;
    VectorAttribute * disk = get_disk(did);

    *ds_quotas = 0;
    *vm_quotas = 0;

    if ( disk == 0 )
    {
        return;
    }

    it = snapshots.find(did);

    if (it == snapshots.end())
    {
        return;
    }

    long long ssize = it->second->get_snapshot_size(snap_id);

    it->second->delete_snapshot(snap_id);

    snap_size = it->second->get_total_size();

    disk->replace("DISK_SNAPSHOT_TOTAL_SIZE", snap_size);

    if (it->second->size() == 0)
    {
        Snapshots * tmp = it->second;

        snapshots.erase(it);

        delete tmp;
    }

	if (is_persistent(disk) || disk_tm_target(disk) != "SYSTEM")
	{
        *ds_quotas = new Template();

        (*ds_quotas)->add("DATASTORE", disk->vector_value("DATASTORE_ID"));
        (*ds_quotas)->add("SIZE", ssize);
        (*ds_quotas)->add("IMAGES",0 );
	}

    if (disk_tm_target(disk) == "SYSTEM")
    {
        *vm_quotas = new Template();

        delta_disk = new VectorAttribute("DISK");
        delta_disk->replace("TYPE", "FS");
        delta_disk->replace("SIZE", ssize);

        (*vm_quotas)->add("VMS", 0);
        (*vm_quotas)->set(delta_disk);
    }
}

//  +--------+-------------------------------------+
//  |LN/CLONE|     PERSISTENT    |   NO PERSISTENT |
//  |        |---------+---------+-----------------+
//  | TARGET | created |  quota  | created | quota |
//  +--------+---------+---------+-----------------+
//  | SYSTEM | system  | VM + DS | system  | VM    |
//  | SELF   | image   | DS      | image   | DS    |
//  | NONE   | image   | DS      | image   | DS    |
//  +----------------------------------------------+

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::delete_non_persistent_disk_snapshots(Template **vm_quotas,
        map<int, Template *>& ds_quotas)
{
    vector<VectorAttribute *> disks;

    map<int, Snapshots *>::iterator it;

    int  disk_id;

    long long system_disk = 0;

    int num_disks = obj_template->get("DISK", disks);

    for(int i=0; i<num_disks; i++)
    {
        if (disks[i]->vector_value("DISK_ID", disk_id) != 0)
        {
            continue;
        }

        it = snapshots.find(disk_id);

        if (it == snapshots.end())
        {
            continue;
        }

		if ( disk_tm_target(disks[i]) != "SYSTEM" )
		{
			continue;
		}

        if (is_persistent(disks[i]))
        {
            int image_id;

            if ( disks[i]->vector_value("IMAGE_ID", image_id) != 0 )
            {
                continue;
            }

            Template * d_ds = new Template();

            d_ds->add("DATASTORE", disks[i]->vector_value("DATASTORE_ID"));
            d_ds->add("SIZE", it->second->get_total_size());
            d_ds->add("IMAGES", 0);

            ds_quotas.insert(pair<int, Template *>(image_id, d_ds));
        }

		system_disk += it->second->get_total_size();

        it->second->clear();

        Snapshots * tmp = it->second;

        snapshots.erase(it);

        delete tmp;

        disks[i]->remove("DISK_SNAPSHOT_ACTIVE");
        disks[i]->remove("DISK_SNAPSHOT_ID");
        disks[i]->remove("DISK_SNAPSHOT_TOTAL_SIZE");
    }

    if ( system_disk > 0 )
    {
        VectorAttribute * delta_disk;

        *vm_quotas = new Template();

        delta_disk = new VectorAttribute("DISK");
        delta_disk->replace("TYPE", "FS");
        delta_disk->replace("SIZE", system_disk);

        (*vm_quotas)->add("VMS", 0);
        (*vm_quotas)->set(delta_disk);
    }
}

