/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
        disks(false),
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
                _log = new SysLog(clevel, oid, obj_type);
                break;

            case NebulaLog::STD:
                _log = new StdLog(clevel, oid, obj_type);
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

static int set_boot_order(Template * tmpl, string& error_str)
{
    vector<VectorAttribute *> disk;
    vector<VectorAttribute *> nic;

    ostringstream oss;

    int ndisk = tmpl->get("DISK", disk);
    int nnic  = tmpl->get("NIC", nic);

    for (int i=0; i<ndisk; ++i)
    {
        disk[i]->remove("ORDER");
    }

    for (int i=0; i<nnic; ++i)
    {
        nic[i]->remove("ORDER");
    }

    VectorAttribute * os = tmpl->get("OS");

    if ( os == 0 )
    {
        return 0;
    }

    string order = os->vector_value("BOOT");

    if ( order.empty() )
    {
        return 0;
    }

    vector<string> bdevs = one_util::split(order, ',');

    int index = 1;

    for (vector<string>::iterator i = bdevs.begin(); i != bdevs.end(); ++i)
    {
        vector<VectorAttribute *> * dev;
        int    max;
        int    disk_id;
        size_t pos;

        const char * id_name;

        one_util::toupper(*i);

        int rc = one_util::regex_match("^(DISK|NIC)[[:digit:]]+$", (*i).c_str());

        if (rc != 0)
        {
            goto error_parsing;
        }

        if ((*i).compare(0,4,"DISK") == 0)
        {
            pos = 4;

            max = ndisk;
            dev = &disk;

            id_name = "DISK_ID";
        }
        else if ((*i).compare(0,3,"NIC") == 0)
        {
            pos = 3;

            max = nnic;
            dev = &nic;

            id_name = "NIC_ID";
        }
        else
        {
            goto error_parsing;
        }

        istringstream iss((*i).substr(pos, string::npos));

        iss >> disk_id;

        if (iss.fail())
        {
            goto error_parsing;
        }

        bool found = false;

        for (int j=0; j<max; ++j)
        {
            int j_disk_id;

            if ( (*dev)[j]->vector_value(id_name, j_disk_id) == 0 &&
                   j_disk_id == disk_id )
            {
                (*dev)[j]->replace("ORDER", index++);
                found = true;
            }
        }

        if (!found)
        {
            oss << "Wrong OS/BOOT value. Device with "
                << id_name << " " << disk_id << " not found";

            goto error_common;
        }
    }

    return 0;

error_parsing:
    oss << "Wrong OS/BOOT value: \"" << order
        << "\" should be a comma-separated list of disk# or nic#";

error_common:
    error_str = oss.str();
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
    set<int> cluster_ids;

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
    // Check for EMULATOR attribute
    // ------------------------------------------------------------------------

    user_obj_template->get("EMULATOR", value);

    if (!value.empty())
    {
        user_obj_template->erase("EMULATOR");
        obj_template->add("EMULATOR", value);
    }

    // ------------------------------------------------------------------------
    // Check for CPU, VCPU and MEMORY attributes
    // ------------------------------------------------------------------------

    if ( user_obj_template->get("MEMORY", ivalue) == false || (ivalue * 1024) <= 0 )
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
    // PCI Devices (Needs to be parsed before network)
    // ------------------------------------------------------------------------

    rc = parse_pci(error_str);

    if ( rc != 0 )
    {
        goto error_pci;
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

    bool on_hold;

    if (user_obj_template->get("SUBMIT_ON_HOLD", on_hold) == true)
    {
        user_obj_template->erase("SUBMIT_ON_HOLD");

        obj_template->replace("SUBMIT_ON_HOLD", on_hold);
    }

    if ( has_cloning_disks())
    {
        state = VirtualMachine::CLONING;
    }

    // -------------------------------------------------------------------------
    // Set boot order
    // -------------------------------------------------------------------------

    rc = set_boot_order(obj_template, error_str);

    if ( rc != 0 )
    {
        goto error_boot_order;
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

    rc = automatic_requirements(cluster_ids, error_str);

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

error_boot_order:
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
error_pci:
error_defaults:
error_vrouter:
error_public:
error_name:
error_common:
    NebulaLog::log("ONE",Log::ERROR, error_str);

    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

/**
 * @return -1 for incompatible cluster IDs, -2 for missing cluster IDs
 */
static int check_and_set_cluster_id(
        const char *           id_name,
        const VectorAttribute* vatt,
        set<int>               &cluster_ids)
{
    set<int> vatt_cluster_ids;
    string   val;

    // If the attr does not exist, the vatt is using a manual path/resource.
    // This is different to a resource with 0 clusters
    if (vatt->vector_value(id_name, val) != 0)
    {
        return 0;
    }

    one_util::split_unique(val, ',', vatt_cluster_ids);

    if ( vatt_cluster_ids.empty() )
    {
        return -2;
    }

    if ( cluster_ids.empty() )
    {
        cluster_ids = vatt_cluster_ids;

        return 0;
    }

    set<int> intersection = one_util::set_intersection(cluster_ids, vatt_cluster_ids);

    if (intersection.empty())
    {
        return -1;
    }

    cluster_ids = intersection;

    return 0;
}

/* ------------------------------------------------------------------------ */

void update_os_file(VectorAttribute *  os,
                    const string&      base_name)
{
    ClusterPool *   clpool = Nebula::instance().get_clpool();
    int             ds_id;
    set<int>        cluster_ids;

    string base_name_ds_id   = base_name + "_DS_DSID";
    string base_name_cluster = base_name + "_DS_CLUSTER_ID";

    if (os->vector_value(base_name_ds_id, ds_id) != 0)
    {
        return;
    }

    clpool->query_datastore_clusters(ds_id, cluster_ids);

    os->replace(base_name_cluster, one_util::join(cluster_ids, ','));
}

/* ------------------------------------------------------------------------ */

static void update_disk_cluster_id(VectorAttribute* disk)
{
    ClusterPool *   clpool = Nebula::instance().get_clpool();
    int             ds_id;
    set<int>        cluster_ids;

    if (disk->vector_value("DATASTORE_ID", ds_id) != 0)
    {
        return;
    }

    clpool->query_datastore_clusters(ds_id, cluster_ids);

    disk->replace("CLUSTER_ID", one_util::join(cluster_ids, ','));
}

/* ------------------------------------------------------------------------ */

static void update_nic_cluster_id(VectorAttribute* nic)
{
    ClusterPool *   clpool = Nebula::instance().get_clpool();
    int             vn_id;
    set<int>        cluster_ids;

    if (nic->vector_value("NETWORK_ID", vn_id) != 0)
    {
        return;
    }

    clpool->query_vnet_clusters(vn_id, cluster_ids);

    nic->replace("CLUSTER_ID", one_util::join(cluster_ids, ','));
}

/* ------------------------------------------------------------------------ */

/**
 * Returns the list of Cluster IDs where the VM can be deployed, based
 * on the Datastores and VirtualNetworks requested
 *
 * @param tmpl of the VirtualMachine
 * @param cluster_ids set of Cluster IDs
 * @param error_str Returns the error reason, if any
 * @return 0 on success
 */
static int get_cluster_requirements(Template *tmpl, set<int>& cluster_ids,
        string& error_str)
{
    ostringstream   oss;
    int             num_vatts;
    vector<VectorAttribute*> vatts;

    int incomp_id;
    int rc;

    // Get cluster id from the KERNEL and INITRD (FILE Datastores)
    VectorAttribute * osatt = tmpl->get("OS");

    if ( osatt != 0 )
    {
        update_os_file(osatt, "KERNEL");

        rc = check_and_set_cluster_id("KERNEL_DS_CLUSTER_ID", osatt, cluster_ids);

        if ( rc != 0 )
        {
            goto error_kernel;
        }

        update_os_file(osatt, "INITRD");

        rc = check_and_set_cluster_id("INITRD_DS_CLUSTER_ID", osatt, cluster_ids);

        if ( rc != 0 )
        {
            goto error_initrd;
        }
    }

    // Get cluster id from all DISK vector attributes (IMAGE Datastore)
    num_vatts = tmpl->get("DISK",vatts);

    for(int i=0; i<num_vatts; i++)
    {
        update_disk_cluster_id(vatts[i]);

        rc = check_and_set_cluster_id("CLUSTER_ID", vatts[i], cluster_ids);

        if ( rc != 0 )
        {
            incomp_id = i;
            goto error_disk;
        }
    }

    vatts.clear();

    // Get cluster id from all NIC vector attributes
    num_vatts = tmpl->get("NIC", vatts);

    for(int i=0; i<num_vatts; i++)
    {
        update_nic_cluster_id(vatts[i]);

        rc = check_and_set_cluster_id("CLUSTER_ID", vatts[i], cluster_ids);

        if ( rc != 0 )
        {
            incomp_id = i;
            goto error_nic;
        }
    }

    vatts.clear();

    // Get cluster id from all PCI attibutes, TYPE = NIC
    num_vatts = tmpl->get("PCI", vatts);

    for(int i=0; i<num_vatts; i++)
    {
        if ( vatts[i]->vector_value("TYPE") != "NIC" )
        {
            continue;
        }

        update_nic_cluster_id(vatts[i]);

        rc = check_and_set_cluster_id("CLUSTER_ID", vatts[i], cluster_ids);

        if ( rc != 0 )
        {
            incomp_id = i;
            goto error_pci;
        }
    }

    return 0;

error_disk:
    if (rc == -1)
    {
        oss << "Incompatible clusters in DISK. Datastore for DISK "<< incomp_id
            << " is not in the same cluster as the one used by other VM elements "
            << "(cluster " << one_util::join(cluster_ids, ',') << ")";
    }
    else
    {
        oss << "Missing clusters. Datastore for DISK "<< incomp_id
            << " is not in any cluster";
    }

    goto error_common;

error_kernel:
    if (rc == -1)
    {
        oss<<"Incompatible cluster in KERNEL datastore, it should be in cluster "
           << one_util::join(cluster_ids, ',') << ".";
    }
    else
    {
        oss << "Missing clusters. KERNEL datastore is not in any cluster.";
    }

    goto error_common;

error_initrd:
    if (rc == -1)
    {
        oss<<"Incompatible cluster in INITRD datastore, it should be in cluster "
           << one_util::join(cluster_ids, ',') << ".";
    }
    else
    {
        oss << "Missing clusters. INITRD datastore is not in any cluster.";
    }

    goto error_common;

error_nic:
    if (rc == -1)
    {
        oss << "Incompatible clusters in NIC. Network for NIC "<< incomp_id
            << " is not in the same cluster as the one used by other VM elements "
            << "(cluster " << one_util::join(cluster_ids, ',') << ")";
    }
    else
    {
        oss << "Missing clusters. Network for NIC "<< incomp_id
            << " is not in any cluster";
    }

    goto error_common;

error_pci:
    if (rc == -1)
    {
        oss << "Incompatible clusters in PCI (TYPE=NIC). Network for PCI "
            << incomp_id
            << " is not in the same cluster as the one used by other VM elements "
            << "(cluster " << one_util::join(cluster_ids, ',') << ")";
    }
    else
    {
        oss << "Missing clusters. Network for PCI "<< incomp_id
            << " is not in any cluster";
    }

    goto error_common;

error_common:
    error_str = oss.str();

    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VirtualMachine::automatic_requirements(set<int>& cluster_ids,
    string& error_str)
{
    ostringstream   oss;
    set<string>     clouds;

    obj_template->erase("AUTOMATIC_REQUIREMENTS");
    obj_template->erase("AUTOMATIC_DS_REQUIREMENTS");

    int rc = get_cluster_requirements(obj_template, cluster_ids, error_str);

    if (rc != 0)
    {
        return -1;
    }

    if ( !cluster_ids.empty() )
    {
        set<int>::iterator i = cluster_ids.begin();

        oss << "(CLUSTER_ID = " << *i;

        for (++i; i != cluster_ids.end(); i++)
        {
            oss << " | CLUSTER_ID = " << *i;
        }

        oss << ") & !(PUBLIC_CLOUD = YES)";
    }
    else
    {
        oss << "!(PUBLIC_CLOUD = YES)";
    }

    int num_public = get_public_clouds(clouds);

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

    // Set automatic System DS requirements

    if ( !cluster_ids.empty() )
    {
        oss.str("");

        set<int>::iterator i = cluster_ids.begin();

        oss << "\"CLUSTERS/ID\" @> " << *i;

        for (++i; i != cluster_ids.end(); i++)
        {
            oss << " | \"CLUSTERS/ID\" @> " << *i;
        }

        obj_template->add("AUTOMATIC_DS_REQUIREMENTS", oss.str());
    }

    return 0;
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

    float       cpu = 0;
    long long   memory = 0;

    obj_template->get("CPU", cpu);
    obj_template->get("MEMORY", memory);

    oss << "<VM>"
        << "<ID>" << oid << "</ID>"
        << "<LAST_POLL>" << last_poll << "</LAST_POLL>"
        << monitoring.to_xml(xml_body)
        << "<TEMPLATE>"
        <<   "<CPU>"    << cpu << "</CPU>"
        <<   "<MEMORY>" << memory << "</MEMORY>"
        << "</TEMPLATE>"
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
    const string& tm_mad,
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

    history = new History(oid, seq, hid, hostname, cid, vmm_mad, tm_mad, ds_id,
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
                       history->tm_mad_name,
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
                       previous_history->tm_mad_name,
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

bool VirtualMachine::is_imported() const
{
    bool imported = false;

    get_template_attribute("IMPORTED", imported);

    return imported;
}

string VirtualMachine::get_import_state()
{
    string import_state;

    user_obj_template->get("IMPORT_STATE", import_state);
    user_obj_template->erase("IMPORT_STATE");

    return import_state;
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

int VirtualMachine::set_up_attach_nic(VirtualMachineTemplate * tmpl, string& err)
{
    Nebula&             nd     = Nebula::instance();
    VirtualNetworkPool* vnpool = nd.get_vnpool();
    SecurityGroupPool*  sgpool = nd.get_secgrouppool();

    // -------------------------------------------------------------------------
    // Get the new NIC attribute from the template
    // -------------------------------------------------------------------------
    VectorAttribute * new_nic = tmpl->get("NIC");

    if ( new_nic == 0 )
    {
        err = "Wrong format or missing NIC attribute";
        return -1;
    }

    new_nic = new_nic->clone();

    merge_nic_defaults(new_nic);

    // -------------------------------------------------------------------------
    // Get the highest NIC_ID
    // -------------------------------------------------------------------------
    vector<VectorAttribute *> nics;

    int max_nic_id = -1;
    int num_nics   = obj_template->get("NIC", nics);

    for(int i=0; i<num_nics; i++)
    {
        int nic_id;

        nics[i]->vector_value("NIC_ID", nic_id);

        if ( nic_id > max_nic_id )
        {
            max_nic_id = nic_id;
        }
    }

    // -------------------------------------------------------------------------
    // Acquire a new network lease
    // -------------------------------------------------------------------------
    int rc = vnpool->nic_attribute(PoolObjectSQL::VM, new_nic, max_nic_id+1,
            uid, oid, err);

    if ( rc == -1 ) //-2 is not using a pre-defined network
    {
        delete new_nic;
        return -1;
    }

    // -------------------------------------------------------------------------
    // Check that we don't have a cluster incompatibility.
    // -------------------------------------------------------------------------
    string nic_cluster_ids;

    if (new_nic->vector_value("CLUSTER_ID", nic_cluster_ids) == 0)
    {
        set<int> cluster_ids;
        one_util::split_unique(nic_cluster_ids, ',', cluster_ids);

        if (cluster_ids.count(get_cid()) == 0)
        {
            ostringstream oss;

            release_network_leases(new_nic, oid);

            delete new_nic;

            oss << "Virtual network is not part of cluster [" << get_cid() << "]";

            err = oss.str();

            NebulaLog::log("DiM", Log::ERROR, err);

            return -1;
        }
    }

    // -------------------------------------------------------------------------
    // Get security groups for the new nic
    // -------------------------------------------------------------------------
    set<int> nic_sgs, vm_sgs;

    vector<VectorAttribute*> sg_rules;
    vector<VectorAttribute*>::iterator it;

    get_security_groups(vm_sgs);

    get_security_groups(new_nic, nic_sgs);

    for (set<int>::iterator it = vm_sgs.begin(); it != vm_sgs.end(); it++)
    {
        nic_sgs.erase(*it);
    }

    sgpool->get_security_group_rules(oid, nic_sgs, sg_rules);

    // -------------------------------------------------------------------------
    // Add new nic to template and set info in history before attaching
    // -------------------------------------------------------------------------
    set_vm_info();

    new_nic->replace("ATTACH", "YES");

    obj_template->set(new_nic);

    for(it = sg_rules.begin(); it != sg_rules.end(); it++ )
    {
        obj_template->set(*it);
    }

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
    string err;

    VectorAttribute * nic = get_attach_nic();

    if (nic == 0)
    {
        return;
    }

    nic->remove("ATTACH");
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

int VirtualMachine::get_network_leases(string& estr)
{
    int                   num_nics, rc;
    vector<Attribute  * > nics;
    VectorAttribute *     nic;

    Nebula& nd = Nebula::instance();
    VirtualNetworkPool * vnpool = nd.get_vnpool();
    SecurityGroupPool*   sgpool = nd.get_secgrouppool();

    vector<VectorAttribute*> sg_rules;

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

    vector<VectorAttribute *> pcis;

    int num_pcis = get_template_attribute("PCI", pcis);

    for (int i = 0; i < num_pcis; ++i)
    {
        if ( pcis[i]->vector_value("TYPE") == "NIC" )
        {
            rc = vnpool->nic_attribute(PoolObjectSQL::VM, pcis[i], i, uid, oid, estr);

            if ( rc == -1 )
            {
                return -1;
            }
        }
    }

    get_security_groups(vm_sgs);

    sgpool->get_security_group_rules(get_oid(), vm_sgs, sg_rules);

    obj_template->set(sg_rules);

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

    vector<VectorAttribute const *> vatts;

    int num = get_template_attribute("NIC", vatts);

    for(int i = 0; i < num; i++)
    {
        release_network_leases(vatts[i], oid);
    }

    num = get_template_attribute("PCI", vatts);

    for(int i = 0; i < num; i++)
    {
        if ( vatts[i]->vector_value("TYPE") == "NIC" )
        {
            release_network_leases(vatts[i], oid);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::release_network_leases(const VectorAttribute * nic, int vmid)
{
    VirtualNetworkPool* vnpool = Nebula::instance().get_vnpool();
    SecurityGroupPool*  sgpool = Nebula::instance().get_secgrouppool();

    VirtualNetwork*     vn;

    int     vnid;
    int     ar_id;
    string  mac;
    string  error_msg;

    set<int> sgs;

    if ( nic == 0 )
    {
        return -1;
    }

    get_security_groups(nic, sgs);

    sgpool->release_security_groups(vmid, sgs);

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

void VirtualMachine::get_security_groups(VirtualMachineTemplate *tmpl, set<int>& sgs)
{

    vector<VectorAttribute const *> vatts;

    int num = tmpl->get("NIC", vatts);

    for(int i = 0; i < num; i++)
    {
        get_security_groups(vatts[i], sgs);
    }

    num = tmpl->get("PCI", vatts);

    for(int i = 0; i < num; i++)
    {
        if ( vatts[i]->vector_value("TYPE") == "NIC" )
        {
            get_security_groups(vatts[i], sgs);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::remove_security_group(int sgid)
{
    int num_sgs;
    int ssgid;

    vector<VectorAttribute  *> sgs;

    num_sgs = obj_template->get("SECURITY_GROUP_RULE", sgs);

    for(int i=0; i<num_sgs; i++)
    {
        sgs[i]->vector_value("SECURITY_GROUP_ID", ssgid);

        if ( ssgid == sgid )
        {
            obj_template->remove(sgs[i]);
            delete sgs[i];
        }
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

void VirtualMachine::set_auth_request(int uid,
                                      AuthRequest& ar,
                                      VirtualMachineTemplate *tmpl)
{
    vector<VectorAttribute  *> vectors;

    Nebula& nd = Nebula::instance();

    VirtualNetworkPool * vnpool = nd.get_vnpool();
    SecurityGroupPool *  sgpool = nd.get_secgrouppool();

    VirtualMachineDisks::disk_iterator disk;
    VirtualMachineDisks disks(tmpl, false);

    for( disk = disks.begin(); disk != disks.end(); ++disk)
    {
        (*disk)->authorize(uid, &ar);
    }

    vectors.clear();

    int num = tmpl->get("NIC", vectors);

    for(int i=0; i<num; i++)
    {
        vnpool->authorize_nic(PoolObjectSQL::VM, vectors[i], uid, &ar);
    }

    set<int> sgroups;

    get_security_groups(tmpl, sgroups);

    for(set<int>::iterator it = sgroups.begin(); it != sgroups.end(); it++)
    {
        SecurityGroup * sgroup = sgpool->get(*it, true);

        if(sgroup != 0)
        {
            PoolObjectAuth perm;

            sgroup->get_permissions(perm);

            sgroup->unlock();

            ar.add_auth(AuthRequest::USE, perm);
        }
    }
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

    VirtualMachineDisks::disk_iterator disk;

    for ( disk = const_cast<VirtualMachineDisks *>(&disks)->begin() ;
            disk != const_cast<VirtualMachineDisks *>(&disks)->end() ; ++disk)
    {
        const Snapshots * snapshots = (*disk)->get_snapshots();

        if ( snapshots != 0 )
        {
            oss << snapshots->to_xml(snap_xml);
        }
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

    rc += xpath<time_t>(last_poll, "/VM/LAST_POLL", 0);
    rc += xpath(resched, "/VM/RESCHED", 0);

    rc += xpath<time_t>(stime, "/VM/STIME", 0);
    rc += xpath<time_t>(etime, "/VM/ETIME", 0);
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

    // -------------------------------------------------------------------------
    // Virtual Machine template and attributes
    // -------------------------------------------------------------------------
    ObjectXML::get_nodes("/VM/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }
    rc += obj_template->from_xml_node(content[0]);

    vector<VectorAttribute  *> vdisks;

    obj_template->get("DISK", vdisks);

    disks.init(vdisks, true);

    ObjectXML::free_nodes(content);
    content.clear();

    // -------------------------------------------------------------------------
    // Virtual Machine Monitoring
    // -------------------------------------------------------------------------
    ObjectXML::get_nodes("/VM/MONITORING", content);

    if (content.empty())
    {
        return -1;
    }

    rc += monitoring.from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    // -------------------------------------------------------------------------
    // Virtual Machine user template
    // -------------------------------------------------------------------------
    ObjectXML::get_nodes("/VM/USER_TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += user_obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    // -------------------------------------------------------------------------
    // Last history entry
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // Virtual Machine Snapshots
    // -------------------------------------------------------------------------
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

        disks.set_snapshots(snap->get_disk_id(), snap);
    }

    if (!content.empty())
    {
        ObjectXML::free_nodes(content);
        content.clear();
    }

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

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

            new_tmpl->merge(user_obj_template);
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
        user_obj_template->merge(new_tmpl);
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

/**
 * Replaces the values of a vector value, preserving the existing ones
 */
static void replace_vector_values(Template *old_tmpl, Template *new_tmpl,
        const char * name, const string * vnames, int num)
{
    string value;

    VectorAttribute * new_attr = new_tmpl->get(name);
    VectorAttribute * old_attr = old_tmpl->get(name);

    if ( new_attr == 0 )
    {
        old_tmpl->erase(name);
    }
    else if ( old_attr == 0 )
    {
        old_tmpl->set(new_attr->clone());
    }
    else
    {
        for (int i=0; i < num; i++)
        {
            if ( new_attr->vector_value(vnames[i], value) == -1 )
            {
                old_attr->remove(vnames[i]);
            }
            else
            {
                old_attr->replace(vnames[i], value);
            }
        }
    }
};

/* -------------------------------------------------------------------------- */

int VirtualMachine::updateconf(VirtualMachineTemplate& tmpl, string &err)
{
    switch (state)
    {
        case PENDING:
        case HOLD:
        case POWEROFF:
        case UNDEPLOYED:
        case CLONING:
        case CLONING_FAILURE:
            break;

        case ACTIVE:
            switch (lcm_state)
            {
                case LCM_INIT:
                case PROLOG:
                case EPILOG:
                case SHUTDOWN:
                case CLEANUP_RESUBMIT:
                case SHUTDOWN_POWEROFF:
                case CLEANUP_DELETE:
                case HOTPLUG_SAVEAS_POWEROFF:
                case SHUTDOWN_UNDEPLOY:
                case EPILOG_UNDEPLOY:
                case PROLOG_UNDEPLOY:
                case HOTPLUG_PROLOG_POWEROFF:
                case HOTPLUG_EPILOG_POWEROFF:
                case BOOT_FAILURE:
                case PROLOG_FAILURE:
                case EPILOG_FAILURE:
                case EPILOG_UNDEPLOY_FAILURE:
                case PROLOG_MIGRATE_POWEROFF:
                case PROLOG_MIGRATE_POWEROFF_FAILURE:
                case BOOT_UNDEPLOY_FAILURE:
                case PROLOG_UNDEPLOY_FAILURE:
                case DISK_SNAPSHOT_POWEROFF:
                case DISK_SNAPSHOT_REVERT_POWEROFF:
                case DISK_SNAPSHOT_DELETE_POWEROFF:
                    break;

                default:
                    err = "configuration cannot be updated in state " + state_str();
                    return -1;
            };

        case INIT:
        case DONE:
        case SUSPENDED:
        case STOPPED:

            err = "configuration cannot be updated in state " + state_str();
            return -1;
    }

    // -------------------------------------------------------------------------
    // Update OS
    // -------------------------------------------------------------------------
    string os_names[] = {"ARCH", "MACHINE", "KERNEL", "INITRD", "BOOTLOADER",
        "BOOT"};

    replace_vector_values(obj_template, &tmpl, "OS", os_names, 6);

    if ( set_boot_order(obj_template, err) != 0 )
    {
        return -1;
    }

    // -------------------------------------------------------------------------
    // Update FEATURES:
    // -------------------------------------------------------------------------
    string features_names[] = {"PAE", "ACPI", "APIC", "LOCALTIME", "HYPERV",
        "GUEST_AGENT"};

    replace_vector_values(obj_template, &tmpl, "FEATURES", features_names, 6);

    // -------------------------------------------------------------------------
    // Update INPUT:
    // -------------------------------------------------------------------------
    string input_names[] = {"TYPE", "BUS"};

    replace_vector_values(obj_template, &tmpl, "INPUT", input_names, 2);

    // -------------------------------------------------------------------------
    // Update GRAPHICS:
    // -------------------------------------------------------------------------
    string graphics_names[] = {"TYPE", "LISTEN", "PASSWD", "KEYMAP"};

    replace_vector_values(obj_template, &tmpl, "GRAPHICS", graphics_names, 4);

    // -------------------------------------------------------------------------
    // Update RAW:
    // -------------------------------------------------------------------------
    string raw_names[] = {"TYPE", "DATA", "DATA_VMX"};

    replace_vector_values(obj_template, &tmpl, "RAW", raw_names, 3);

    // -------------------------------------------------------------------------
    // Update CONTEXT: any value
    // -------------------------------------------------------------------------
    VectorAttribute * context_bck = obj_template->get("CONTEXT");
    VectorAttribute * context_new = tmpl.get("CONTEXT");

    if ( context_bck == 0 && context_new != 0 )
    {
        err = "Virtual machine does not have context, cannot add a new one.";

        return -1;
    }
    else if ( context_bck != 0 && context_new != 0 )
    {
        context_new = context_new->clone();

        context_new->replace("TARGET",  context_bck->vector_value("TARGET"));
        context_new->replace("DISK_ID", context_bck->vector_value("DISK_ID"));

        obj_template->remove(context_bck);
        obj_template->set(context_new);

        if ( generate_token_context(context_new, err) != 0 ||
               generate_network_context(context_new, err) != 0  )
        {
            obj_template->erase("CONTEXT");
            obj_template->set(context_bck);

            return -1;
        }

        delete context_bck;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* VirtualMachine Disks Interface                                             */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::get_disk_images(string& error_str)
{
    vector<Attribute *> adisks;
    vector<Attribute *> acontext_disks;

    vector<Attribute*>::iterator it;

    int num_context = user_obj_template->remove("CONTEXT", acontext_disks);
    int num_disks   = user_obj_template->remove("DISK", adisks);

    for (it = acontext_disks.begin(); it != acontext_disks.end(); )
    {
        if ( (*it)->type() != Attribute::VECTOR )
        {
            delete *it;
            num_context--;
            it = acontext_disks.erase(it);
        }
        else
        {
            obj_template->set(*it);
            ++it;
        }
    }

    for (it = adisks.begin(); it != adisks.end(); )
    {
        if ( (*it)->type() != Attribute::VECTOR )
        {
            delete *it;
            num_disks--;
            it = adisks.erase(it);
        }
        else
        {
            obj_template->set(*it);
            ++it;
        }
    }

    if ( num_disks > 20 )
    {
        error_str = "Exceeded the maximum number of disks (20)";
        return -1;
    }

    VectorAttribute * context = 0;

    if ( num_context > 0 )
    {
        context = static_cast<VectorAttribute * >(acontext_disks[0]);
    }

    return disks.get_images(oid, uid, adisks, context, error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::release_disk_images()
{
    bool image_error = (state == ACTIVE && lcm_state != EPILOG) &&
                        state != PENDING && state != HOLD &&
                        state != CLONING && state != CLONING_FAILURE;

    disks.release_images(oid, image_error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::set_up_attach_disk(VirtualMachineTemplate * tmpl, string& err)
{
    VectorAttribute * new_vdisk = tmpl->get("DISK");

    if ( new_vdisk == 0 )
    {
        err = "Internal error parsing DISK attribute";
        return -1;
    }

    new_vdisk = new_vdisk->clone();

    VectorAttribute * context = get_template_attribute("CONTEXT");

    VirtualMachineDisk * new_disk;

    new_disk = disks.set_up_attach(oid, uid, get_cid(), new_vdisk, context, err);

    if ( new_disk == 0 )
    {
        delete new_vdisk;
        return -1;
    }

    // -------------------------------------------------------------------------
    // Add new disk to template and set info in history before attaching
    // -------------------------------------------------------------------------
    set_vm_info();

    obj_template->set(new_disk->vector_attribute());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* Disk save as interface                                                     */
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

