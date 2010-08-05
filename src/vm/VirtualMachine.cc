/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "VirtualMachine.h"
#include "VirtualNetworkPool.h"
#include "NebulaLog.h"

#include "Nebula.h"


#include "vm_var_syntax.h"

/* ************************************************************************** */
/* Virtual Machine :: Constructor/Destructor                                  */
/* ************************************************************************** */

VirtualMachine::VirtualMachine(int id, VirtualMachineTemplate * _vm_template):
        PoolObjectSQL(id),
        uid(-1),
        last_poll(0),
        name(""),
        state(INIT),
        lcm_state(LCM_INIT),
        stime(time(0)),
        etime(0),
        deploy_id(""),
        memory(0),
        cpu(0),
        net_tx(0),
        net_rx(0),
        last_seq(-1),
        history(0),
        previous_history(0),
        _log(0)
{
    if (_vm_template != 0)
    {
        vm_template = _vm_template;
    }
    else
    {
        vm_template = new VirtualMachineTemplate;
    }
}

VirtualMachine::~VirtualMachine()
{
    if ( history != 0 )
    {
        delete history;
    }

    if ( previous_history != 0 )
    {
        delete previous_history;
    }

    if ( _log != 0 )
    {
        delete _log;
    }

    if ( vm_template != 0 )
    {
        delete vm_template;
    }
}

/* ************************************************************************** */
/* Virtual Machine :: Database Access Functions                               */
/* ************************************************************************** */

const char * VirtualMachine::table = "vm_pool";

const char * VirtualMachine::db_names =
    "(oid,uid,name,last_poll, state,lcm_state,stime,etime,deploy_id"
    ",memory,cpu,net_tx,net_rx,last_seq, template)";

const char * VirtualMachine::db_bootstrap = "CREATE TABLE IF NOT EXISTS "
        "vm_pool ("
        "oid INTEGER PRIMARY KEY,uid INTEGER,name TEXT,"
        "last_poll INTEGER, state INTEGER,lcm_state INTEGER,"
        "stime INTEGER,etime INTEGER,deploy_id TEXT,memory INTEGER,cpu INTEGER,"
        "net_tx INTEGER,net_rx INTEGER, last_seq INTEGER, template TEXT)";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::select_cb(void *nil, int num, char **values, char **names)
{
    if ((values[OID] == 0) ||
        (values[UID] == 0) ||
        (values[NAME] == 0) ||
        (values[LAST_POLL] == 0) ||
        (values[STATE] == 0) ||
        (values[LCM_STATE] == 0) ||
        (values[STIME] == 0) ||
        (values[ETIME] == 0) ||
        (values[MEMORY] == 0) ||
        (values[CPU] == 0) ||
        (values[NET_TX] == 0) ||
        (values[NET_RX] == 0) ||
        (values[LAST_SEQ] == 0) ||
        (values[TEMPLATE] == 0) ||
        (num != LIMIT ))
    {
        return -1;
    }

    oid  = atoi(values[OID]);
    uid  = atoi(values[UID]);
    name = values[NAME];

    last_poll = static_cast<time_t>(atoi(values[LAST_POLL]));

    state     = static_cast<VmState>(atoi(values[STATE]));
    lcm_state = static_cast<LcmState>(atoi(values[LCM_STATE]));

    stime = static_cast<time_t>(atoi(values[STIME]));
    etime = static_cast<time_t>(atoi(values[ETIME]));

    if ( values[DEPLOY_ID] != 0 )
    {
        deploy_id = values[DEPLOY_ID];
    }

    memory      = atoi(values[MEMORY]);
    cpu         = atoi(values[CPU]);
    net_tx      = atoi(values[NET_TX]);
    net_rx      = atoi(values[NET_RX]);
    last_seq    = atoi(values[LAST_SEQ]);

    // Virtual Machine template
    vm_template->from_xml(values[TEMPLATE]);

    return 0;
}

/* -------------------------------------------------------------------------- */

int VirtualMachine::select(SqlDB * db)
{
    ostringstream   oss;
    ostringstream   ose;

    int             rc;
    int             boid;

    string          filename;
    Nebula&         nd = Nebula::instance();

    set_callback(
        static_cast<Callbackable::Callback>(&VirtualMachine::select_cb));

    oss << "SELECT * FROM " << table << " WHERE oid = " << oid;

    boid = oid;
    oid  = -1;

    rc = db->exec(oss,this);

    unset_callback();

    if ((rc != 0) || (oid != boid ))
    {
        goto error_id;
    }

    //Get the History Records

    if ( last_seq != -1 )
    {
        history = new History(oid, last_seq);

        rc = history->select(db);

        if (rc != 0)
        {
            goto error_history;
        }
    }

    if ( last_seq > 0 )
    {
        previous_history = new History(oid, last_seq - 1);

        rc = previous_history->select(db);

        if ( rc != 0)
        {
            goto error_previous_history;
        }
    }

    //Create support directory for this VM

    oss.str("");
    oss << nd.get_var_location() << oid;

    mkdir(oss.str().c_str(), 0777);
    chmod(oss.str().c_str(), 0777);

    //Create Log support for this VM

    try
    {
        _log = new FileLog(nd.get_vm_log_filename(oid),Log::DEBUG);
    }
    catch(exception &e)
    {
        ose << "Error creating log: " << e.what();
        NebulaLog::log("ONE",Log::ERROR, ose);

        _log = 0;
    }

    return 0;

error_id:
    ose << "Error getting VM id: " << oid;
    log("VMM", Log::ERROR, ose);
    return -1;

error_history:
    ose << "Can not get history for VM id: " << oid;
    log("ONE", Log::ERROR, ose);
    return -1;

error_previous_history:
    ose << "Can not get previous history record (seq:" << history->seq
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

    SingleAttribute *   attr;
    string              value;
    ostringstream       oss;


    // -----------------------------------------------------------------------
    // Set a name if the VM has not got one and VM_ID
    // ------------------------------------------------------------------------
    oss << oid;
    value = oss.str();

    attr = new SingleAttribute("VMID",value);

    vm_template->set(attr);

    get_template_attribute("NAME",name);

    if ( name.empty() == true )
    {
        oss.str("");
        oss << "one-" << oid;
        name = oss.str();

        attr = new SingleAttribute("NAME",name);
        vm_template->set(attr);
    }

    this->name = name;

    // ------------------------------------------------------------------------
    // Get network leases
    // ------------------------------------------------------------------------

    rc = get_network_leases();

    if ( rc != 0 )
    {
        goto error_leases;
    }

    // ------------------------------------------------------------------------
    // Get disk images
    // ------------------------------------------------------------------------

    rc = get_disk_images(error_str);

    if ( rc != 0 )
    {
        goto error_images;
    }

    // -------------------------------------------------------------------------
    // Parse the context & requirements
    // -------------------------------------------------------------------------

    rc = parse_context();

    if ( rc != 0 )
    {
        goto error_context;
    }

    rc = parse_requirements();

    if ( rc != 0 )
    {
        goto error_requirements;
    }

    parse_graphics();

    // ------------------------------------------------------------------------
    // Insert the VM
    // ------------------------------------------------------------------------

    rc = insert_replace(db, false);

    if ( rc != 0 )
    {
        goto error_update;
    }

    return 0;

error_update:
    error_str = "Can not insert VM in the database";
    goto error_common;

error_leases:
    error_str = "Could not get network lease for VM";
    NebulaLog::log("ONE",Log::ERROR, error_str);
    release_network_leases();
    return -1;

error_images:
    goto error_common;

error_context:
    error_str = "Could not parse CONTEXT for VM";
    goto error_common;

error_requirements:
    error_str = "Could not parse REQUIREMENTS for VM";
    goto error_common;

error_common:
    NebulaLog::log("ONE",Log::ERROR, error_str);
    release_network_leases();
    release_disk_images();
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_context()
{
    int rc, num;

    vector<Attribute *> array_context;
    VectorAttribute *   context;

    string *            str;
    string              parsed;

    num = vm_template->remove("CONTEXT", array_context);

    if ( num == 0 )
    {
        return 0;
    }

    context = dynamic_cast<VectorAttribute *>(array_context[0]);

    if ( context == 0 )
    {
        NebulaLog::log("ONE",Log::ERROR, "Wrong format for CONTEXT attribute");
        return -1;
    }

    str = context->marshall(" @^_^@ ");

    if (str == 0)
    {
        NebulaLog::log("ONE",Log::ERROR, "Can not marshall CONTEXT");
        return -1;
    }

    rc = parse_template_attribute(*str,parsed);

    if ( rc == 0 )
    {
        VectorAttribute * context_parsed;

        context_parsed = new VectorAttribute("CONTEXT");
        context_parsed->unmarshall(parsed," @^_^@ ");


        string target = context_parsed->vector_value("TARGET");

        if ( target.empty() )
        {
            Nebula&       nd = Nebula::instance();
            string        dev_prefix;

            nd.get_configuration_attribute("DEFAULT_DEVICE_PREFIX",dev_prefix);
            dev_prefix += "b";

            context_parsed->replace("TARGET", dev_prefix);
        }

        vm_template->set(context_parsed);
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

    num = vm_template->get("GRAPHICS", array_graphics);

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

int VirtualMachine::parse_requirements()
{
    int rc, num;

    vector<Attribute *> array_reqs;
    SingleAttribute *   reqs;

    string              parsed;

    num = vm_template->remove("REQUIREMENTS", array_reqs);

    if ( num == 0 )
    {
        return 0;
    }

    reqs = dynamic_cast<SingleAttribute *>(array_reqs[0]);

    if ( reqs == 0 )
    {
        NebulaLog::log("ONE",Log::ERROR,"Wrong format for REQUIREMENTS");
        return -1;
    }

    rc = parse_template_attribute(reqs->value(),parsed);

    if ( rc == 0 )
    {
        SingleAttribute * reqs_parsed;

        reqs_parsed = new SingleAttribute("REQUIREMENTS",parsed);
        vm_template->set(reqs_parsed);
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

int VirtualMachine::update(SqlDB * db)
{
    return insert_replace(db, true);
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VirtualMachine::insert_replace(SqlDB *db, bool replace)
{
    ostringstream   oss;
    int             rc;

    string xml_template;
    char * sql_deploy_id;
    char * sql_name;
    char * sql_template;

    sql_deploy_id = db->escape_str(deploy_id.c_str());

    if ( sql_deploy_id == 0 )
    {
        goto error_deploy;
    }

    sql_name =  db->escape_str(name.c_str());

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    vm_template->to_xml(xml_template);
    sql_template = db->escape_str(xml_template.c_str());

    if ( sql_template == 0 )
    {
        goto error_template;
    }


    if(replace)
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    oss << " INTO " << table << " "<< db_names <<" VALUES ("
        <<          oid             << ","
        <<          uid             << ","
        << "'" <<   sql_name        << "',"
        <<          last_poll       << ","
        <<          state           << ","
        <<          lcm_state       << ","
        <<          stime           << ","
        <<          etime           << ","
        << "'" <<   sql_deploy_id   << "',"
        <<          memory          << ","
        <<          cpu             << ","
        <<          net_tx          << ","
        <<          net_rx          << ","
        <<          last_seq        << ","
        << "'" <<   sql_template    << "')";

    db->free_str(sql_deploy_id);
    db->free_str(sql_name);
    db->free_str(sql_template);

    rc = db->exec(oss);

    return rc;

error_template:
    db->free_str(sql_name);
error_name:
    db->free_str(sql_deploy_id);
error_deploy:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::dump(ostringstream& oss,int num,char **values,char **names)
{
    if ((!values[OID])||
        (!values[UID])||
        (!values[NAME]) ||
        (!values[LAST_POLL])||
        (!values[STATE])||
        (!values[LCM_STATE])||
        (!values[STIME])||
        (!values[ETIME])||
        (!values[DEPLOY_ID])||
        (!values[MEMORY])||
        (!values[CPU])||
        (!values[NET_TX])||
        (!values[NET_RX])||
        (!values[LAST_SEQ])||
        (!values[TEMPLATE])||
        (num != (LIMIT + History::LIMIT + 1)))
    {
        return -1;
    }

    oss <<
        "<VM>" <<
            "<ID>"       << values[OID]      << "</ID>"       <<
            "<UID>"      << values[UID]      << "</UID>"      <<
            "<USERNAME>" << values[LIMIT]     << "</USERNAME>"<<
            "<NAME>"     << values[NAME]     << "</NAME>"     <<
            "<LAST_POLL>"<< values[LAST_POLL]<< "</LAST_POLL>"<<
            "<STATE>"    << values[STATE]    << "</STATE>"    <<
            "<LCM_STATE>"<< values[LCM_STATE]<< "</LCM_STATE>"<<
            "<STIME>"    << values[STIME]    << "</STIME>"    <<
            "<ETIME>"    << values[ETIME]    << "</ETIME>"    <<
            "<DEPLOY_ID>"<< values[DEPLOY_ID]<< "</DEPLOY_ID>"<<
            "<MEMORY>"   << values[MEMORY]   << "</MEMORY>"   <<
            "<CPU>"      << values[CPU]      << "</CPU>"      <<
            "<NET_TX>"   << values[NET_TX]   << "</NET_TX>"   <<
            "<NET_RX>"   << values[NET_RX]   << "</NET_RX>"   <<
            "<LAST_SEQ>" << values[LAST_SEQ] << "</LAST_SEQ>" <<
                            values[TEMPLATE];

    History::dump(oss, num-LIMIT-1, values+LIMIT+1, names+LIMIT+1);

    oss << "</VM>";

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::add_history(
    int     hid,
    string& hostname,
    string& vm_dir,
    string& vmm_mad,
    string& tm_mad)
{
    ostringstream os;
    int           seq;

    if (history == 0)
    {
        seq = 0;
    }
    else
    {
        seq = history->seq + 1;

        if (previous_history != 0)
        {
            delete previous_history;
        }

        previous_history = history;
    }

    last_seq = seq;

    history = new History(oid,seq,hid,hostname,vm_dir,vmm_mad,tm_mad);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::cp_history()
{
    History * htmp;

    if (history == 0)
    {
        return;
    }

    htmp = new History(oid,
            history->seq + 1,
            history->hid,
            history->hostname,
            history->vm_dir,
            history->vmm_mad_name,
            history->tm_mad_name);

    if ( previous_history != 0 )
    {
        delete previous_history;
    }

    previous_history = history;

    history = htmp;

    last_seq = history->seq;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::cp_previous_history()
{
    History * htmp;

    if ( previous_history == 0 || history == 0)
    {
        return;
    }

    htmp = new History(oid,
            history->seq + 1,
            previous_history->hid,
            previous_history->hostname,
            previous_history->vm_dir,
            previous_history->vmm_mad_name,
            previous_history->tm_mad_name);

    delete previous_history;

    previous_history = history;

    history = htmp;

    last_seq = history->seq;
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

int VirtualMachine::get_disk_images(string& error_str)
{
    int                   num_disks, rc;
    vector<Attribute  * > disks;
    ImagePool *           ipool;
    VectorAttribute *     disk;

    int     n_os = 0; // Number of OS images
    int     n_cd = 0; // Number of CDROMS
    int     n_db = 0; // Number of DATABLOCKS
    string  type;

    ostringstream    oss;
    Image::ImageType img_type;

    Nebula& nd = Nebula::instance();
    ipool      = nd.get_ipool();

    num_disks  = vm_template->get("DISK",disks);

    for(int i=0, index=0; i<num_disks; i++)
    {
        disk = dynamic_cast<VectorAttribute * >(disks[i]);

        if ( disk == 0 )
        {
            continue;
        }

        rc = ipool->disk_attribute(disk, i, &index, &img_type);

        if (rc == 0 )
        {
            switch(img_type)
            {
                case Image::OS:
                    n_os++;
                    break;
                case Image::CDROM:
                    n_cd++;
                    break;
                case Image::DATABLOCK:
                    n_db++;
                    break;
                default:
                    break;
            }

            if( n_os > 1 )  // Max. number of OS images is 1
            {
                goto error_max_os;
            }

            if( n_cd > 1 )  // Max. number of CDROM images is 1
            {
                goto error_max_cd;
            }

            if( n_db > 10 )  // Max. number of DATABLOCK images is 10
            {
                goto error_max_db;
            }
        }
        else if ( rc == -1 )
        {
            goto error_image;
        }
    }

    return 0;

error_max_os:
    error_str = "VM can not use more than one OS image.";
    goto error_common;

error_max_cd:
    error_str = "VM can not use more than one CDROM image.";
    goto error_common;

error_max_db:
    error_str = "VM can not use more than 10 DATABLOCK images.";
    goto error_common;

error_image:
    error_str = "Could not get disk image for VM";

error_common:
    NebulaLog::log("ONE",Log::ERROR, error_str);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::release_disk_images()
{
    string  iid;
    string  saveas;
    int     num_disks;

    vector<Attribute const  * > disks;
    Image *                     img;
    ImagePool *                 ipool;

    Nebula& nd = Nebula::instance();
    ipool      = nd.get_ipool();

    num_disks   = get_template_attribute("DISK",disks);

    for(int i=0; i<num_disks; i++)
    {
        VectorAttribute const *  disk =
            dynamic_cast<VectorAttribute const * >(disks[i]);

        if ( disk == 0 )
        {
            continue;
        }

        iid = disk->vector_value("IMAGE_ID");

        if ( iid.empty() )
        {
            continue;
        }

        img = ipool->get(atoi(iid.c_str()),true);

        if ( img == 0 )
        {
            continue;
        }

        img->release_image();

        saveas = disk->vector_value("SAVE_AS");

        if ( !saveas.empty() && saveas == iid )
        {
            img->enable(false);
        }

        ipool->update(img);

        img->unlock();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::get_network_leases()
{
    int                   num_nics, rc;
    vector<Attribute  * > nics;
    VirtualNetworkPool *  vnpool;
    VectorAttribute *     nic;

    Nebula& nd = Nebula::instance();
    vnpool     = nd.get_vnpool();

    num_nics   = vm_template->get("NIC",nics);

    for(int i=0; i<num_nics; i++)
    {
        nic = dynamic_cast<VectorAttribute * >(nics[i]);

        if ( nic == 0 )
        {
            continue;
        }

        rc = vnpool->nic_attribute(nic, oid);

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

        vn->release_lease(ip);
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
/* -------------------------------------------------------------------------- */

int VirtualMachine::save_disk(int disk_id, int img_id)
{
    int                   num_disks;
    vector<Attribute  * > disks;
    VectorAttribute *     disk;

    string                disk_id_str;
    int                   tmp_disk_id;

    ostringstream oss;
    istringstream iss;


    num_disks  = vm_template->get("DISK",disks);

    for(int i=0; i<num_disks; i++, iss.clear())
    {
        disk = dynamic_cast<VectorAttribute * >(disks[i]);

        if ( disk == 0 )
        {
            continue;
        }

        disk_id_str = disk->vector_value("DISK_ID");

        iss.str(disk_id_str);
        iss >> tmp_disk_id;

        if( tmp_disk_id == disk_id )
        {
            disk->replace("SAVE", "YES");

            oss << (img_id);
            disk->replace("SAVE_AS", oss.str());

            return 0;
        }
    }

    return -1;
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

ostream& operator<<(ostream& os, const VirtualMachine& vm)
{
    string vm_str;

    os << vm.to_xml(vm_str);

    return os;
};

/* -------------------------------------------------------------------------- */

string& VirtualMachine::to_xml(string& xml) const
{

    string template_xml;
    string history_xml;

    ostringstream	oss;

    oss << "<VM>"
        << "<ID>"        << oid       << "</ID>"
        << "<UID>"       << uid       << "</UID>"
        << "<NAME>"      << name      << "</NAME>"
        << "<LAST_POLL>" << last_poll << "</LAST_POLL>"
        << "<STATE>"     << state     << "</STATE>"
        << "<LCM_STATE>" << lcm_state << "</LCM_STATE>"
        << "<STIME>"     << stime     << "</STIME>"
        << "<ETIME>"     << etime     << "</ETIME>"
        << "<DEPLOY_ID>" << deploy_id << "</DEPLOY_ID>"
        << "<MEMORY>"    << memory    << "</MEMORY>"
        << "<CPU>"       << cpu       << "</CPU>"
        << "<NET_TX>"    << net_tx    << "</NET_TX>"
        << "<NET_RX>"    << net_rx    << "</NET_RX>"
        << "<LAST_SEQ>"  << last_seq  << "</LAST_SEQ>"
        << vm_template->to_xml(template_xml);

    if ( hasHistory() )
    {
        oss << history->to_xml(history_xml);
    }

    oss << "</VM>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */

string& VirtualMachine::to_str(string& str) const
{
    string template_str;
    string history_str;

    ostringstream	oss;

    oss<< "ID                : " << oid << endl
       << "UID               : " << uid << endl
       << "NAME              : " << name << endl
       << "STATE             : " << state << endl
       << "LCM STATE         : " << lcm_state << endl
       << "DEPLOY ID         : " << deploy_id << endl
       << "MEMORY            : " << memory << endl
       << "CPU               : " << cpu << endl
       << "LAST POLL         : " << last_poll << endl
       << "START TIME        : " << stime << endl
       << "STOP TIME         : " << etime << endl
       << "NET TX            : " << net_tx << endl
       << "NET RX            : " << net_rx << endl
       << "LAST SEQ          : " << last_seq << endl
       << "Template" << endl << vm_template->to_str(template_str) << endl;

    if ( hasHistory() )
    {
        oss << "Last History Record" << endl << history->to_str(history_str);
    }

    str = oss.str();

    return str;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
