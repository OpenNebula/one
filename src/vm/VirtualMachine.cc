/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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
#include <unistd.h>

#include <iostream>
#include <sstream>
#include <queue>

#include "VirtualMachine.h"
#include "VirtualNetworkPool.h"
#include "ImagePool.h"
#include "NebulaLog.h"

#include "Nebula.h"


#include "vm_var_syntax.h"

/* ************************************************************************** */
/* Virtual Machine :: Constructor/Destructor                                  */
/* ************************************************************************** */

VirtualMachine::VirtualMachine(int           id,
                               int           _uid,
                               int           _gid,
                               const string& _uname,
                               const string& _gname,
                               VirtualMachineTemplate * _vm_template):
        PoolObjectSQL(id,VM,"",_uid,_gid,_uname,_gname,table),
        last_poll(0),
        state(INIT),
        lcm_state(LCM_INIT),
        resched(0),
        stime(time(0)),
        etime(0),
        deploy_id(""),
        memory(0),
        cpu(0),
        net_tx(0),
        net_rx(0),
        history(0),
        previous_history(0),
        _log(0)
{
    if (_vm_template != 0)
    {
        obj_template = _vm_template;
    }
    else
    {
        obj_template = new VirtualMachineTemplate;
    }
}

VirtualMachine::~VirtualMachine()
{
    for (unsigned int i=0 ; i < history_records.size() ; i++)
    {
            delete history_records[i];
    }

    if ( _log != 0 )
    {
        delete _log;
    }

    if ( obj_template != 0 )
    {
        delete obj_template;
    }
}

/* ************************************************************************** */
/* Virtual Machine :: Database Access Functions                               */
/* ************************************************************************** */

const char * VirtualMachine::table = "vm_pool";

const char * VirtualMachine::db_names =
    "oid, name, body, uid, gid, last_poll, state, lcm_state, "
    "owner_u, group_u, other_u";

const char * VirtualMachine::db_bootstrap = "CREATE TABLE IF NOT EXISTS "
    "vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, "
    "gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, "
    "owner_u INTEGER, group_u INTEGER, other_u INTEGER)";


const char * VirtualMachine::monit_table = "vm_monitoring";

const char * VirtualMachine::monit_db_names = "vmid, last_poll, body";

const char * VirtualMachine::monit_db_bootstrap = "CREATE TABLE IF NOT EXISTS "
    "vm_monitoring (vmid INTEGER, last_poll INTEGER, body TEXT, "
    "PRIMARY KEY(vmid, last_poll))";

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
    oss << nd.get_var_location() << oid;

    mkdir(oss.str().c_str(), 0700);
    chmod(oss.str().c_str(), 0700);
    
    //--------------------------------------------------------------------------
    //Create Log support for this VM
    //--------------------------------------------------------------------------
    try
    {
        Log::MessageType clevel;

        clevel = nd.get_debug_level();
        _log   = new FileLog(nd.get_vm_log_filename(oid), clevel);
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

    string        value;
    ostringstream oss;

    // ------------------------------------------------------------------------
    // Set a name if the VM has not got one and VM_ID
    // ------------------------------------------------------------------------

    oss << oid;
    value = oss.str();

    replace_template_attribute("VMID", value);

    get_template_attribute("NAME",name);

    if ( name.empty() == true )
    {
        oss.str("");
        oss << "one-" << oid;
        name = oss.str();

        replace_template_attribute("NAME", name);
    }
    else if ( name.length() > 128 )
    {
        goto error_name_length;
    }

    this->name = name;

    // ------------------------------------------------------------------------
    // Check for CPU and MEMORY attributes
    // ------------------------------------------------------------------------

    get_template_attribute("MEMORY", value);

    if ( value.empty())
    {
        goto error_no_memory;
    }

    get_template_attribute("CPU", value);

    if ( value.empty())
    {
        goto error_no_cpu;
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

    parse_graphics();

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

error_context:
    goto error_rollback;

error_requirements:
    goto error_rollback;

error_rollback:
    release_disk_images();

error_leases_rollback:
    release_network_leases();
    goto error_common;

error_no_cpu:
    error_str = "CPU attribute missing.";
    goto error_common;

error_no_memory:
    error_str = "MEMORY attribute missing.";
    goto error_common;

error_name_length:
    error_str = "NAME is too long; max length is 128 chars."; 
    goto error_common;

error_common:
    NebulaLog::log("ONE",Log::ERROR, error_str);

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_context(string& error_str)
{
    int rc, num;

    vector<Attribute *> array_context;
    VectorAttribute *   context;

    string *            str;
    string              parsed;

    num = obj_template->remove("CONTEXT", array_context);

    if ( num == 0 )
    {
        return 0;
    }
    else if ( num > 1 )
    {
        error_str = "Only one CONTEXT attribute can be defined.";
        return -1;
    }

    context = dynamic_cast<VectorAttribute *>(array_context[0]);

    if ( context == 0 )
    {
        error_str = "Wrong format for CONTEXT attribute.";
        return -1;
    }

    str = context->marshall(" @^_^@ ");

    if (str == 0)
    {
        NebulaLog::log("ONE",Log::ERROR, "Cannot marshall CONTEXT");
        return -1;
    }

    rc = parse_template_attribute(*str,parsed);

    if ( rc == 0 )
    {
        VectorAttribute * context_parsed;

        context_parsed = new VectorAttribute("CONTEXT");
        context_parsed->unmarshall(parsed," @^_^@ ");

        obj_template->set(context_parsed);
    }

    /* --- Delete old context attributes --- */

    for (int i = 0; i < num ; i++)
    {
        if (array_context[i] != 0)
        {
            delete array_context[i];
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::parse_graphics()
{
    int num;

    vector<Attribute *> array_graphics;
    VectorAttribute *   graphics;

    num = obj_template->get("GRAPHICS", array_graphics);

    if ( num == 0 )
    {
        return;
    }

    graphics = dynamic_cast<VectorAttribute * >(array_graphics[0]);

    if ( graphics == 0 )
    {
        return;
    }

    string port = graphics->vector_value("PORT");

    if ( port.empty() )
    {
        Nebula&       nd = Nebula::instance();

        ostringstream oss;
        istringstream iss;

        int           base_port;
        string        base_port_s;

        nd.get_configuration_attribute("VNC_BASE_PORT",base_port_s);
        iss.str(base_port_s);
        iss >> base_port;

        oss << ( base_port + oid );
        graphics->replace("PORT", oss.str());
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_requirements(string& error_str)
{
    int rc, num;

    vector<Attribute *> array_reqs;
    SingleAttribute *   reqs;

    string              parsed;

    num = obj_template->remove("REQUIREMENTS", array_reqs);

    if ( num == 0 )
    {
        return 0;
    }
    else if ( num > 1 )
    {
        error_str = "Only one REQUIREMENTS attribute can be defined.";
        return -1;
    }

    reqs = dynamic_cast<SingleAttribute *>(array_reqs[0]);

    if ( reqs == 0 )
    {
        error_str = "Wrong format for REQUIREMENTS attribute.";
        return -1;
    }

    rc = parse_template_attribute(reqs->value(),parsed);

    if ( rc == 0 )
    {
        SingleAttribute * reqs_parsed;

        reqs_parsed = new SingleAttribute("REQUIREMENTS",parsed);
        obj_template->set(reqs_parsed);
    }

    /* --- Delete old requirements attributes --- */

    for (int i = 0; i < num ; i++)
    {
        if (array_reqs[i] != 0)
        {
            delete array_reqs[i];
        }
    }

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VirtualMachine::automatic_requirements(string& error_str)
{
    int                   num_vatts;
    vector<Attribute  * > v_attributes;
    VectorAttribute *     vatt;

    ostringstream   oss;
    string          requirements;
    string          cluster_id = "";
    string          vatt_cluster_id;

    // Get cluster id from all DISK vector attributes

    num_vatts = obj_template->get("DISK",v_attributes);

    for(int i=0; i<num_vatts; i++)
    {
        vatt = dynamic_cast<VectorAttribute * >(v_attributes[i]);

        if ( vatt == 0 )
        {
            continue;
        }

        vatt_cluster_id = vatt->vector_value("CLUSTER_ID");

        if ( !vatt_cluster_id.empty() )
        {
            if ( !cluster_id.empty() && cluster_id != vatt_cluster_id )
            {
                goto error;
            }

            cluster_id = vatt_cluster_id;
        }
    }

    // Get cluster id from all NIC vector attributes

    v_attributes.clear();
    num_vatts = obj_template->get("NIC",v_attributes);

    for(int i=0; i<num_vatts; i++)
    {
        vatt = dynamic_cast<VectorAttribute * >(v_attributes[i]);

        if ( vatt == 0 )
        {
            continue;
        }

        vatt_cluster_id = vatt->vector_value("CLUSTER_ID");

        if ( !vatt_cluster_id.empty() )
        {
            if ( !cluster_id.empty() && cluster_id != vatt_cluster_id )
            {
                goto error;
            }

            cluster_id = vatt_cluster_id;
        }
    }

    if ( !cluster_id.empty() )
    {
        oss.str("");
        oss << "CLUSTER_ID = " << cluster_id;

        obj_template->get("REQUIREMENTS", requirements);

        if ( !requirements.empty() )
        {
            oss << " & ( " << requirements << " )";
        }

        replace_template_attribute("REQUIREMENTS", oss.str());
    }

    return 0;

error:

    oss << "Incompatible cluster IDs.";

    // Get cluster id from all DISK vector attributes

    v_attributes.clear();
    num_vatts = obj_template->get("DISK",v_attributes);

    for(int i=0; i<num_vatts; i++)
    {
        vatt = dynamic_cast<VectorAttribute * >(v_attributes[i]);

        if ( vatt == 0 )
        {
            continue;
        }

        vatt_cluster_id = vatt->vector_value("CLUSTER_ID");

        if ( !vatt_cluster_id.empty() )
        {
            oss << endl << "DISK [" << i << "]: IMAGE ["
                << vatt->vector_value("IMAGE_ID") << "] from DATASTORE ["
                << vatt->vector_value("DATASTORE_ID") << "] requires CLUSTER ["
                << vatt_cluster_id << "]";
        }
    }

    // Get cluster id from all NIC vector attributes

    v_attributes.clear();
    num_vatts = obj_template->get("NIC",v_attributes);

    for(int i=0; i<num_vatts; i++)
    {
        vatt = dynamic_cast<VectorAttribute * >(v_attributes[i]);

        if ( vatt == 0 )
        {
            continue;
        }

        vatt_cluster_id = vatt->vector_value("CLUSTER_ID");

        if ( !vatt_cluster_id.empty() )
        {
            oss << endl << "NIC [" << i << "]: NETWORK ["
                << vatt->vector_value("NETWORK_ID") << "] requires CLUSTER ["
                << vatt_cluster_id << "]";
        }
    }

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
    ostringstream   oss;
    int             rc;

    string xml_body;
    string error_str;
    char * sql_xml;

    sql_xml = db->escape_str(to_xml(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if ( validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
    }

    oss << "INSERT INTO " << monit_table << " ("<< monit_db_names <<") VALUES ("
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
    const string& hostname,
    const string& vmm_mad,
    const string& vnm_mad)
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
                          vmm_mad,
                          vnm_mad,
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
                       history->vmm_mad_name,
                       history->vnm_mad_name,
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
                       previous_history->vmm_mad_name,
                       previous_history->vnm_mad_name,
                       vm_xml);

    previous_history = history;
    history          = htmp;

    history_records.push_back(history);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::get_requirements (int& cpu, int& memory, int& disk)
{
    string          scpu;
    istringstream   iss;
    float           fcpu;

    get_template_attribute("MEMORY",memory);
    get_template_attribute("CPU",scpu);

    if ((memory == 0) || (scpu==""))
    {
        cpu    = 0;
        memory = 0;
        disk   = 0;

        return;
    }

    iss.str(scpu);
    iss >> fcpu;

    cpu    = (int) (fcpu * 100);//now in 100%
    memory = memory * 1024;     //now in bytes
    disk   = 0;

    return;
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
    int                  num_disks, rc;
    vector<Attribute  *> disks;
    ImagePool *          ipool;
    VectorAttribute *    disk;
    vector<int>          acquired_images;

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

    // -------------------------------------------------------------------------
    // The context is the first of the cdroms
    // -------------------------------------------------------------------------
    num_disks = obj_template->get("CONTEXT", disks);

    if ( num_disks > 0 )
    {
        disk = dynamic_cast<VectorAttribute * >(disks[0]);

        if ( disk != 0 )
        {
            target = disk->vector_value("TARGET");

            if ( !target.empty() )
            {
                used_targets.insert(target);
            }
            else
            {
                cdrom_disks.push(make_pair(ipool->default_dev_prefix(), disk));
            }
        }
    }

    // -------------------------------------------------------------------------
    // Set DISK attributes & Targets
    // -------------------------------------------------------------------------
    disks.clear();
    num_disks = obj_template->get("DISK", disks);

    if ( num_disks > 20 )
    {
        goto error_max_disks;
    }

    for(int i=0; i<num_disks; i++)
    {
        disk = dynamic_cast<VectorAttribute * >(disks[i]);

        if ( disk == 0 )
        {
            continue;
        }

        rc = ipool->disk_attribute(disk, 
                                   i,
                                   img_type,
                                   dev_prefix,
                                   uid, 
                                   image_id, 
                                   error_str);
        if (rc == 0 )
        {
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
            goto error_common;
        }
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

    vector<int>::iterator it;

    for ( it=acquired_images.begin() ; it < acquired_images.end(); it++ )
    {
        imagem->release_image(*it, false);
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::release_disk_images()
{
    int     iid;
    int     save_as_id;
    int     rc;
    int     num_disks;

    vector<Attribute const  * > disks;
    ImageManager *              imagem;

    string  disk_base_path = "";

    Nebula& nd = Nebula::instance();
    imagem     = nd.get_imagem();

    num_disks  = get_template_attribute("DISK",disks);

    for(int i=0; i<num_disks; i++)
    {
        VectorAttribute const *  disk =
            dynamic_cast<VectorAttribute const * >(disks[i]);

        if ( disk == 0 )
        {
            continue;
        }

        rc = disk->vector_value("IMAGE_ID", iid);

        if ( rc == 0 )
        {
            imagem->release_image(iid, (state == FAILED));
        }

        rc = disk->vector_value("SAVE_AS", save_as_id);

        if ( rc == 0 )
        {
            imagem->release_image(save_as_id, (state == FAILED));
        }
    }
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

    num_nics   = obj_template->get("NIC",nics);

    for(int i=0; i<num_nics; i++)
    {
        nic = dynamic_cast<VectorAttribute * >(nics[i]);

        if ( nic == 0 )
        {
            continue;
        }

        rc = vnpool->nic_attribute(nic, uid, oid, estr);

        if (rc == -1)
        {
            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::release_network_leases()
{
    Nebula& nd = Nebula::instance();

    VirtualNetworkPool * vnpool = nd.get_vnpool();

    string                        vnid;
    string                        ip;
    int                           num_nics;

    vector<Attribute const  * >   nics;
    VirtualNetwork          *     vn;

    num_nics   = get_template_attribute("NIC",nics);

    for(int i=0; i<num_nics; i++)
    {
        VectorAttribute const *  nic =
            dynamic_cast<VectorAttribute const * >(nics[i]);

        if ( nic == 0 )
        {
            continue;
        }

        vnid = nic->vector_value("NETWORK_ID");

        if ( vnid.empty() )
        {
            continue;
        }

        ip   = nic->vector_value("IP");

        if ( ip.empty() )
        {
            continue;
        }

        vn = vnpool->get(atoi(vnid.c_str()),true);

        if ( vn == 0 )
        {
            continue;
        }

        if (vn->is_owner(ip,oid))
        {
            vn->release_lease(ip);
            vnpool->update(vn);
        }

        vn->unlock();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::generate_context(string &files)
{
    ofstream file;

    vector<const Attribute*> attrs;
    const VectorAttribute *  context;

    map<string, string>::const_iterator it;

    files = "";

    if ( history == 0 )
        return -1;

    if ( get_template_attribute("CONTEXT",attrs) != 1 )
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

    context = dynamic_cast<const VectorAttribute *>(attrs[0]);

    if (context == 0)
    {
        file.close();
        return -1;
    }

    files = context->vector_value("FILES");

    const map<string, string> values = context->value();

    file << "# Context variables generated by OpenNebula\n";

    for (it=values.begin(); it != values.end(); it++ )
    {
        file << it->first <<"=\""<< it->second << "\"" << endl;
    }

    file.close();

    return 1;
}

/* -------------------------------------------------------------------------- */

int VirtualMachine::get_image_from_disk(int disk_id, string& error_str)
{
    int num_disks;
    int tid;
    int iid = -1;
    int rc;

    vector<Attribute  * > disks;
    VectorAttribute *     disk;

    ostringstream oss;

    num_disks = obj_template->get("DISK",disks);

    if ( state == DONE || state == FAILED )
    {
        goto error_state;
    }

    for(int i=0; i<num_disks; i++)
    {
        disk = dynamic_cast<VectorAttribute * >(disks[i]);

        if ( disk == 0 )
        {
            continue;
        }

        rc = disk->vector_value("DISK_ID", tid);

        if ( rc != 0 )
        {
            continue;
        }

        if ( disk_id == tid )
        {
            if(!((disk->vector_value("SAVE_AS")).empty()))
            {
                goto error_saved;
            }

            if(!((disk->vector_value("PERSISTENT")).empty()))
            {
                goto error_persistent;
            }

            rc = disk->vector_value("IMAGE_ID", iid);

            if ( rc != 0 )
            {
                goto error_image_id;
            }

            disk->replace("SAVE", "YES");

            return iid;
        }
    }

    goto error_not_found;

error_state:
    oss << "VM cannot be in DONE or FAILED state.";
    goto error_common;

error_persistent:
    oss << "Source image for DISK " << disk_id << " is persistent.";
    goto error_common;

error_saved:
    oss << "The DISK " << disk_id << " is already going to be saved.";
    goto error_common;

error_image_id:
    oss << "The DISK " << disk_id << " does not have a valid IMAGE_ID.";
    goto error_common;

error_not_found:
    oss << "The DISK " << disk_id << " does not exist for VM " << oid << ".";

error_common:
    error_str = oss.str();

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::save_disk(const string& disk_id, 
                              const string& source,
                              int           img_id)
{
    vector<Attribute  * > disks;
    VectorAttribute *     disk;

    int    num_disks;
    string tdisk_id;

    ostringstream oss;

    if ( state == DONE || state == FAILED )
    {
        return -1;
    }

    num_disks  = obj_template->get("DISK",disks);

    for(int i=0; i<num_disks; i++)
    {
        disk = dynamic_cast<VectorAttribute * >(disks[i]);

        if ( disk == 0 )
        {
            continue;
        }

        tdisk_id = disk->vector_value("DISK_ID");

        if ( tdisk_id == disk_id )
        {
            disk->replace("SAVE_AS_SOURCE", source);

            oss << (img_id);
            disk->replace("SAVE_AS", oss.str());

            break;
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
    int                   num;
    vector<Attribute  * > vectors;
    VectorAttribute *     vector;

    Nebula& nd = Nebula::instance();

    ImagePool *           ipool  = nd.get_ipool();
    VirtualNetworkPool *  vnpool = nd.get_vnpool();

    num = tmpl->get("DISK",vectors);

    for(int i=0; i<num; i++)
    {

        vector = dynamic_cast<VectorAttribute * >(vectors[i]);

        if ( vector == 0 )
        {
            continue;
        }

        ipool->authorize_disk(vector,uid,&ar);
    }

    vectors.clear();

    num = tmpl->get("NIC",vectors);

    for(int i=0; i<num; i++)
    {
        vector = dynamic_cast<VectorAttribute * >(vectors[i]);

        if ( vector == 0 )
        {
            continue;
        }

        vnpool->authorize_nic(vector,uid,&ar);
    }
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

    int vm_var_lex_destroy();

    YY_BUFFER_STATE vm_var__scan_string(const char * str);

    void vm_var__delete_buffer(YY_BUFFER_STATE);
}

/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_template_attribute(const string& attribute,
                                             string&       parsed)
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

    rc = vm_var_parse(this,&oss_parsed,&error_msg);

    vm_var__delete_buffer(str_buffer);

    vm_var_lex_destroy();

    pthread_mutex_unlock(&lex_mutex);

    if ( rc != 0 && error_msg != 0 )
    {
        ostringstream oss;

        oss << "Error parsing: " << attribute << ". " << error_msg;
        log("VM",Log::ERROR,oss);

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
/* -------------------------------------------------------------------------- */

string& VirtualMachine::to_xml_extended(string& xml, int n_history) const
{
    string template_xml;
    string history_xml;
    string perm_xml;
    ostringstream	oss;

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
        << "<RESCHED>"   << resched   << "</RESCHED>"
        << "<STIME>"     << stime     << "</STIME>"
        << "<ETIME>"     << etime     << "</ETIME>"
        << "<DEPLOY_ID>" << deploy_id << "</DEPLOY_ID>"
        << "<MEMORY>"    << memory    << "</MEMORY>"
        << "<CPU>"       << cpu       << "</CPU>"
        << "<NET_TX>"    << net_tx    << "</NET_TX>"
        << "<NET_RX>"    << net_rx    << "</NET_RX>"
        << obj_template->to_xml(template_xml);

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
    rc += xpath(istate,    "/VM/STATE",     0);
    rc += xpath(ilcmstate, "/VM/LCM_STATE", 0);
    rc += xpath(resched,   "/VM/RESCHED",   0);

    rc += xpath(stime,     "/VM/STIME",    0);
    rc += xpath(etime,     "/VM/ETIME",    0);
    rc += xpath(deploy_id, "/VM/DEPLOY_ID","");

    rc += xpath(memory,    "/VM/MEMORY",   0);
    rc += xpath(cpu,       "/VM/CPU",      0);
    rc += xpath(net_tx,    "/VM/NET_TX",   0);
    rc += xpath(net_rx,    "/VM/NET_RX",   0);

    // Permissions
    rc += perms_from_xml();

    state     = static_cast<VmState>(istate);
    lcm_state = static_cast<LcmState>(ilcmstate);

    // Get associated classes
    ObjectXML::get_nodes("/VM/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    // Virtual Machine template
    rc += obj_template->from_xml_node(content[0]);

    // Last history entry
    ObjectXML::free_nodes(content);
    content.clear();

    ObjectXML::get_nodes("/VM/HISTORY_RECORDS/HISTORY", content);

    if (!content.empty())
    {
        history = new History(oid);
        rc += history->from_xml_node(content[0]);

        history_records.resize(history->seq + 1);
        history_records[history->seq] = history;

        ObjectXML::free_nodes(content);
    }

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string VirtualMachine::get_remote_system_dir() const
{
    ostringstream oss;

    string  ds_location;
    Nebula& nd = Nebula::instance();

    nd.get_configuration_attribute("DATASTORE_LOCATION", ds_location);
    oss << ds_location << "/" << DatastorePool::SYSTEM_DS_ID << "/" << oid;

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string VirtualMachine::get_system_dir() const
{
    ostringstream oss;
    Nebula&       nd = Nebula::instance();

    oss << nd.get_ds_location() << DatastorePool::SYSTEM_DS_ID << "/"<< oid;

    return oss.str();
};
