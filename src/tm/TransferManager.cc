/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "TransferManager.h"
#include "NebulaLog.h"

#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * TransferManager::transfer_driver_name = "transfer_exe";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * tm_action_loop(void *arg)
{
    TransferManager *  tm;

    if ( arg == 0 )
    {
        return 0;
    }

    tm = static_cast<TransferManager *>(arg);

    NebulaLog::log("TrM",Log::INFO,"Transfer Manager started.");

    tm->am.loop(0,0);

    NebulaLog::log("TrM",Log::INFO,"Transfer Manager stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */

int TransferManager::start()
{
    int               rc;
    pthread_attr_t    pattr;

    rc = MadManager::start();

    if ( rc != 0 )
    {
        return -1;
    }

    NebulaLog::log("TrM",Log::INFO,"Starting Transfer Manager...");

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

    rc = pthread_create(&tm_thread,&pattr,tm_action_loop,(void *) this);

    return rc;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger(Actions action, int _vid)
{
    int *   vid;
    string  aname;

    vid = new int(_vid);

    switch (action)
    {
    case PROLOG:
        aname = "PROLOG";
        break;

    case PROLOG_MIGR:
        aname = "PROLOG_MIGR";
        break;

    case PROLOG_RESUME:
        aname = "PROLOG_RESUME";
        break;

    case PROLOG_ATTACH:
        aname = "PROLOG_ATTACH";
        break;

    case EPILOG:
        aname = "EPILOG";
        break;

    case EPILOG_STOP:
        aname = "EPILOG_STOP";
        break;

    case EPILOG_DELETE:
        aname = "EPILOG_DELETE";
        break;

    case EPILOG_DELETE_STOP:
        aname = "EPILOG_DELETE_STOP";
        break;

    case EPILOG_DELETE_PREVIOUS:
        aname = "EPILOG_DELETE_PREVIOUS";
        break;

    case EPILOG_DELETE_BOTH:
        aname = "EPILOG_DELETE_BOTH";
        break;

    case EPILOG_DETACH:
        aname = "EPILOG_DETACH";
        break;

    case CHECKPOINT:
        aname = "CHECKPOINT";
        break;

    case SAVEAS_HOT:
        aname = "SAVEAS_HOT";
        break;

    case DRIVER_CANCEL:
        aname = "DRIVER_CANCEL";
        break;

    case SNAPSHOT_CREATE:
        aname = "SNAPSHOT_CREATE";
        break;

    case SNAPSHOT_REVERT:
        aname = "SNAPSHOT_REVERT";
        break;

    case SNAPSHOT_DELETE:
        aname = "SNAPSHOT_DELETE";
        break;

    case FINALIZE:
        aname = ACTION_FINALIZE;
        break;

    default:
        delete vid;
        return;
    }

    am.trigger(aname,vid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::do_action(const string &action, void * arg)
{

    VirtualMachine * vm;

    int  vid;
    bool host_is_cloud = false;
    bool vm_no_history = false;

    Nebula& nd = Nebula::instance();

    if (arg == 0)
    {
        return;
    }

    vid  = *(static_cast<int *>(arg));

    delete static_cast<int *>(arg);

    if (action == ACTION_FINALIZE)
    {
        NebulaLog::log("TrM",Log::INFO,"Stopping Transfer Manager...");

        MadManager::stop();

        return;
    }

    vm = vmpool->get(vid,true);

    if (vm == 0)
    {
        return;
    }

    if (vm->hasHistory())
    {
        host_is_cloud = vm->get_host_is_cloud();
    }
    else
    {
        vm_no_history = true;
    }

    vm->unlock();

    if (action == "PROLOG")
    {
        if (host_is_cloud)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::PROLOG_SUCCESS,vid);
        }
        else if (vm_no_history)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::PROLOG_FAILURE,vid);
        }
        else
        {
            prolog_action(vid);
        }
    }
    else if (action == "PROLOG_MIGR")
    {
        if (host_is_cloud)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::PROLOG_SUCCESS,vid);
        }
        else if (vm_no_history)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::PROLOG_FAILURE,vid);
        }
        else
        {
            prolog_migr_action(vid);
        }
    }
    else if (action == "PROLOG_RESUME")
    {
        if (host_is_cloud)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::PROLOG_SUCCESS,vid);
        }
        else if (vm_no_history)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::PROLOG_FAILURE,vid);
        }
        else
        {
            prolog_resume_action(vid);
        }
    }
    else if (action == "PROLOG_ATTACH")
    {
        if (host_is_cloud)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::ATTACH_SUCCESS,vid);
        }
        else if (vm_no_history)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::ATTACH_FAILURE,vid);
        }
        else
        {
            prolog_attach_action(vid);
        }
    }
    else if (action == "EPILOG")
    {
        if (host_is_cloud)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_SUCCESS,vid);
        }
        else if (vm_no_history)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_FAILURE,vid);
        }
        else
        {
            epilog_action(vid);
        }
    }
    else if (action == "EPILOG_STOP")
    {
        if (host_is_cloud)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_SUCCESS,vid);
        }
        else if (vm_no_history)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_FAILURE,vid);
        }
        else
        {
            epilog_stop_action(vid);
        }
    }
    else if (action == "EPILOG_DELETE")
    {
        if (host_is_cloud)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_SUCCESS,vid);
        }
        else if (vm_no_history)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_FAILURE,vid);
        }
        else
        {
            epilog_delete_action(vid);
        }
    }
    else if (action == "EPILOG_DELETE_STOP")
    {
        if (host_is_cloud)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_SUCCESS,vid);
        }
        else if (vm_no_history)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_FAILURE,vid);
        }
        else
        {
            epilog_delete_stop_action(vid);
        }
    }
    else if (action == "EPILOG_DELETE_PREVIOUS")
    {
        if (host_is_cloud)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_SUCCESS,vid);
        }
        else if (vm_no_history)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_FAILURE,vid);
        }
        else
        {
            epilog_delete_previous_action(vid);
        }
    }
    else if (action == "EPILOG_DELETE_BOTH")
    {
        if (host_is_cloud)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_SUCCESS,vid);
        }
        else if (vm_no_history)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_FAILURE,vid);
        }
        else
        {
            epilog_delete_both_action(vid);
        }
    }
    else if (action == "EPILOG_DETACH")
    {
        if (host_is_cloud)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::DETACH_SUCCESS,vid);
        }
        else if (vm_no_history)
        {
            (nd.get_lcm())->trigger(LifeCycleManager::DETACH_FAILURE,vid);
        }
        else
        {
            epilog_detach_action(vid);
        }
    }
    else if (action == "CHECKPOINT")
    {
        checkpoint_action(vid);
    }
    else if (action == "SAVEAS_HOT")
    {
        saveas_hot_action(vid);
    }
    else if (action == "DRIVER_CANCEL")
    {
        driver_cancel_action(vid);
    }
    else if (action == "SNAPSHOT_CREATE")
    {
        snapshot_create_action(vid);
    }
    else if (action == "SNAPSHOT_REVERT")
    {
        snapshot_revert_action(vid);
    }
    else if (action == "SNAPSHOT_DELETE")
    {
        snapshot_delete_action(vid);
    }
    else
    {
        ostringstream oss;
        oss << "Unknown action name: " << action;

        NebulaLog::log("TrM", Log::ERROR, oss);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int TransferManager::prolog_transfer_command(
        VirtualMachine *        vm,
        const VectorAttribute * disk,
        string&                 vm_tm_mad,
        string&                 opennebula_hostname,
        ostream&                xfr,
        ostringstream&          os)
{
    string source;
    string type;
    string clon;
    string size;
    string format;
    string tm_mad;
    string ds_id;

    int disk_id;

    disk->vector_value("DISK_ID", disk_id);

    type = disk->vector_value("TYPE");

    transform(type.begin(),type.end(),type.begin(),(int(*)(int))toupper);

    if ( type == "SWAP" )
    {
        // -----------------------------------------------------------------
        // Generate a swap disk image
        // -----------------------------------------------------------------
        size = disk->vector_value("SIZE");

        if ( size.empty() )
        {
            os << "No size in swap image";
            vm->log("TM", Log::WARNING, "No size in swap image, skipping");
            return 0;
        }

        //MKSWAP tm_mad size host:remote_system_dir/disk.i vmid dsid(system)
        xfr << "MKSWAP "
            << vm_tm_mad << " "
            << size   << " "
            << vm->get_hostname() << ":"
            << vm->get_remote_system_dir() << "/disk." << disk_id << " "
            << vm->get_oid() << " "
            << vm->get_ds_id()
            << endl;
    }
    else if ( type == "FS" )
    {
        // -----------------------------------------------------------------
        // Create a clean file system disk image
        // -----------------------------------------------------------------
        size   = disk->vector_value("SIZE");
        format = disk->vector_value("FORMAT");

        if (format.empty())
        {
            format = "raw";
        }

        if ( size.empty() )
        {
            os << "No size in FS";
            vm->log("TM", Log::WARNING, "No size in FS, skipping");
            return 0;
        }

        //MKIMAGE tm_mad size format host:remote_system_dir/disk.i vmid dsid(system)
        xfr << "MKIMAGE "
            << vm_tm_mad << " "
            << size   << " "
            << format << " "
            << vm->get_hostname() << ":"
            << vm->get_remote_system_dir() << "/disk." << disk_id << " "
            << vm->get_oid() << " "
            << vm->get_ds_id()
            << endl;
    }
    else
    {
        // -----------------------------------------------------------------
        // Get transfer attributes & check errors
        // -----------------------------------------------------------------
        tm_mad = disk->vector_value("TM_MAD");
        ds_id  = disk->vector_value("DATASTORE_ID");
        source = disk->vector_value("SOURCE");
        clon   = disk->vector_value("CLONE");

        if ( source.empty() ||
             tm_mad.empty() ||
             ds_id.empty()  ||
             clon.empty() )
        {
            goto error_attributes;
        }

        transform(clon.begin(),clon.end(),clon.begin(),(int(*)(int))toupper);

        // -----------------------------------------------------------------
        // CLONE or LINK disk images
        // -----------------------------------------------------------------

        // <CLONE|LN> tm_mad fe:SOURCE host:remote_system_ds/disk.i vmid dsid
        if (clon == "YES")
        {
            xfr << "CLONE ";
        }
        else
        {
            xfr << "LN ";
        }

        xfr << tm_mad << " ";

        if ( source.find(":") == string::npos ) //Regular file
        {
            xfr << opennebula_hostname << ":" << source << " ";
        }
        else //TM Plugin specific protocol
        {
            xfr << source << " ";
        }

        xfr << vm->get_hostname() << ":"
            << vm->get_remote_system_dir() << "/disk." << disk_id << " "
            << vm->get_oid() << " "
            << ds_id
            << endl;
    }

    return 0;

error_attributes:
    os << "missing DISK mandatory attributes "
       << "(SOURCE, TM_MAD, CLONE, DATASTORE_ID) for VM " << vm->get_oid()
       << ", DISK " << disk->vector_value("DISK_ID");

    return -1;
}

/* -------------------------------------------------------------------------- */

static string prolog_os_transfer_commands(
        VirtualMachine *        vm,
        const VectorAttribute * os_attr,
        const string&           base,
        string&                 opennebula_hostname,
        ostream&                xfr)
{
    string base_ds = base + "_DS";

    string name_ds = os_attr->vector_value(base_ds.c_str());

    if ( name_ds.empty() )
    {
        return "";
    }

    string base_source = base + "_DS_SOURCE";
    string base_ds_id  = base + "_DS_DSID";
    string base_tm     = base + "_DS_TM";

    string source = os_attr->vector_value(base_source.c_str());
    string ds_id  = os_attr->vector_value(base_ds_id.c_str());
    string tm_mad = os_attr->vector_value(base_tm.c_str());

    if ( source.empty() || ds_id.empty() || tm_mad.empty() )
    {
        return "";
    }

    ostringstream base_dst;
    string        name = base;

    transform(name.begin(), name.end(), name.begin(), (int(*)(int))tolower);

    base_dst << vm->get_remote_system_dir() << "/" << name;

    xfr << "CLONE " << tm_mad << " "
        << opennebula_hostname << ":" << source << " "
        << vm->get_hostname() << ":"
        << base_dst.str() << " "
        << vm->get_oid() << " "
        << ds_id
        << endl;

    return base_dst.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::prolog_action(int vid)
{
    ofstream      xfr;
    ostringstream os("prolog, ");
    string        xfr_name;

    const VectorAttribute * disk;

    string  files;
    string  vm_tm_mad;
    string  opennebula_hostname;
    int     rc;
    string  error_str;

    VirtualMachine * vm;
    Nebula&          nd = Nebula::instance();

    const TransferManagerDriver * tm_md;

    vector<const Attribute *> attrs;
    int                       num;
    int                       disk_id;

    int  context_result;

    string token_password;

    // -------------------------------------------------------------------------
    // Setup & Transfer script
    // -------------------------------------------------------------------------

    vm = vmpool->get(vid,true);

    if (vm == 0)
    {
        return;
    }

    int uid = vm->get_uid();
    vm->unlock();

    User * user = Nebula::instance().get_upool()->get(uid, true);

    if (user != 0)
    {
        user->get_template_attribute("TOKEN_PASSWORD", token_password);
        user->unlock();
    }

    vm = vmpool->get(vid,true);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    vm_tm_mad = vm->get_tm_mad();
    tm_md     = get();

    if ( tm_md == 0 || vm_tm_mad.empty() )
    {
        goto error_drivers;
    }

    xfr_name = vm->get_transfer_file() + ".prolog";
    xfr.open(xfr_name.c_str(), ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }

    opennebula_hostname = nd.get_nebula_hostname();

    // -------------------------------------------------------------------------
    // Image Transfer Commands
    // -------------------------------------------------------------------------
    num = vm->get_template_attribute("DISK",attrs);

    for (int i=0; i < num; i++)
    {
        disk = dynamic_cast<const VectorAttribute *>(attrs[i]);

        if ( disk == 0 )
        {
            continue;
        }

        rc = prolog_transfer_command(vm,
                                     disk,
                                     vm_tm_mad,
                                     opennebula_hostname,
                                     xfr,
                                     os);
        if ( rc != 0 )
        {
            goto error_attributes;
        }
    }

    // -------------------------------------------------------------------------
    // Transfers for kernel and initrd files
    // -------------------------------------------------------------------------
    attrs.clear();

    num = vm->get_template_attribute("OS",attrs);

    if ( num > 0 )
    {
        string kernel;
        string initrd;

        bool update = false;

        const VectorAttribute * os_attr;

        os_attr = dynamic_cast<const VectorAttribute *>(attrs[0]);

        if (os_attr != 0 )
        {
            kernel = prolog_os_transfer_commands(
                        vm,
                        os_attr,
                        "KERNEL",
                        opennebula_hostname,
                        xfr);

            initrd = prolog_os_transfer_commands(
                        vm,
                        os_attr,
                        "INITRD",
                        opennebula_hostname,
                        xfr);
        }

        if ( !kernel.empty() )
        {
            vm->set_kernel(kernel);

            update = true;
        }

        if ( !initrd.empty() )
        {
            vm->set_initrd(initrd);

            update = true;
        }

        if ( update )
        {
            vmpool->update(vm);
        }
    }

    // -------------------------------------------------------------------------
    // Generate context file
    // -------------------------------------------------------------------------

    context_result = vm->generate_context(files, disk_id, token_password);

    if ( context_result == -1 )
    {
        goto error_context;
    }

    if ( context_result )
    {
        //CONTEXT tm_mad files hostname:remote_system_dir/disk.i vmid dsid(=0)
        xfr << "CONTEXT "
            << vm_tm_mad << " "
            << vm->get_context_file() << " ";

        if (!files.empty())
        {
            xfr << files << " ";
        }

        xfr << vm->get_hostname() << ":"
            << vm->get_remote_system_dir() << "/disk." << disk_id << " "
            << vm->get_oid() << " "
            << vm->get_ds_id()
            << endl;
    }

    xfr.close();

    tm_md->transfer(vid,xfr_name);

    vm->unlock();
    return;

error_history:
    os << "VM " << vid << " has no history";
    goto error_common;

error_drivers:
    os.str("");
    os << "prolog, error getting drivers.";
    goto error_common;

error_file:
    os << "could not open file: " << xfr_name;
    goto error_common;

error_attributes:
    xfr.close();
    goto error_common;

error_context:
    os << "could not write context file for VM " << vid;

    xfr.close();
    goto error_common;

error_common:
    (nd.get_lcm())->trigger(LifeCycleManager::PROLOG_FAILURE,vid);
    vm->log("TM", Log::ERROR, os);

    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::prolog_migr_action(int vid)
{
    ofstream        xfr;
    ostringstream   os;
    string          xfr_name;

    const VectorAttribute * disk;
    string tm_mad;
    string vm_tm_mad;

    int ds_id;
    int disk_id;

    vector<const Attribute *> attrs;
    int                       num;

    VirtualMachine *    vm;
    Nebula&             nd = Nebula::instance();

    const TransferManagerDriver * tm_md;

    // -------------------------------------------------------------------------
    // Setup & Transfer script
    // -------------------------------------------------------------------------
    vm = vmpool->get(vid,true);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory() || !vm->hasPreviousHistory())
    {
        goto error_history;
    }

    vm_tm_mad = vm->get_tm_mad();
    tm_md     = get();

    if ( tm_md == 0 || vm_tm_mad.empty())
    {
        goto error_drivers;
    }

    xfr_name = vm->get_transfer_file() + ".migrate";
    xfr.open(xfr_name.c_str(), ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }

    // ------------------------------------------------------------------------
    // Move system directory and disks
    // ------------------------------------------------------------------------

    num = vm->get_template_attribute("DISK",attrs);

    for (int i=0 ; i < num ; i++)
    {
        disk = dynamic_cast<const VectorAttribute *>(attrs[i]);

        if ( disk == 0 )
        {
            continue;
        }

        disk->vector_value_str("DISK_ID", disk_id);

        if ( VirtualMachine::isVolatile(disk) == true )
        {
            tm_mad = vm_tm_mad;
            ds_id  = vm->get_ds_id();
        }
        else
        {
            tm_mad    = disk->vector_value("TM_MAD");
            int vv_rc = disk->vector_value("DATASTORE_ID", ds_id);

            if (tm_mad.empty() || vv_rc == -1)
            {
                continue;
            }
        }

        //MV tm_mad prev_host:remote_system_dir/disk.i host:remote_system_dir/disk.i vmid dsid(image)
        xfr << "MV "
            << tm_mad << " "
            << vm->get_previous_hostname() << ":"
            << vm->get_previous_remote_system_dir() << "/disk." << disk_id << " "
            << vm->get_hostname() << ":"
            << vm->get_remote_system_dir() << "/disk." << disk_id << " "
            << vm->get_oid() << " "
            << ds_id << endl;
    }

    //MV tm_mad prev_host:remote_system_dir host:remote_system_dir VMID dsid(system)
    xfr << "MV "
        << vm_tm_mad << " "
        << vm->get_previous_hostname() << ":"
        << vm->get_previous_remote_system_dir() << " "
        << vm->get_hostname() << ":"
        << vm->get_remote_system_dir() << " "
        << vm->get_oid() << " "
        << vm->get_ds_id() << endl;

    xfr.close();

    tm_md->transfer(vid,xfr_name);

    vm->unlock();
    return;

error_history:
    os.str("");
    os << "prolog_migr, VM " << vid << " has no history";
    goto error_common;

error_drivers:
    os.str("");
    os << "prolog_migr, error getting drivers.";
    goto error_common;

error_file:
    os.str("");
    os << "prolog_migr, could not open file: " << xfr_name;
    goto error_common;

error_common:
    (nd.get_lcm())->trigger(LifeCycleManager::PROLOG_FAILURE,vid);
    vm->log("TM", Log::ERROR, os);

    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::prolog_resume_action(int vid)
{
    ofstream        xfr;
    ostringstream   os;
    string          xfr_name;

    const VectorAttribute * disk;
    string tm_mad;
    string vm_tm_mad;

    int ds_id;
    int disk_id;

    vector<const Attribute *> attrs;
    int                       num;

    VirtualMachine *    vm;
    Nebula&             nd = Nebula::instance();

    const TransferManagerDriver * tm_md;

    // -------------------------------------------------------------------------
    // Setup & Transfer script
    // -------------------------------------------------------------------------
    vm = vmpool->get(vid,true);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    vm_tm_mad = vm->get_tm_mad();
    tm_md     = get();

    if ( tm_md == 0 || vm_tm_mad.empty())
    {
        goto error_drivers;
    }

    xfr_name = vm->get_transfer_file() + ".resume";
    xfr.open(xfr_name.c_str(), ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }

    // ------------------------------------------------------------------------
    // Move system directory and disks
    // ------------------------------------------------------------------------
    num = vm->get_template_attribute("DISK",attrs);

    for (int i=0 ; i < num ; i++)
    {
        disk = dynamic_cast<const VectorAttribute *>(attrs[i]);

        if ( disk == 0 )
        {
            continue;
        }

        disk->vector_value_str("DISK_ID", disk_id);

        if ( VirtualMachine::isVolatile(disk) == true )
        {
            tm_mad = vm_tm_mad;
            ds_id  = vm->get_ds_id();
        }
        else
        {
            tm_mad    = disk->vector_value("TM_MAD");
            int vv_rc = disk->vector_value("DATASTORE_ID", ds_id);

            if ( tm_mad.empty() || vv_rc == -1)
            {
                continue;
            }
        }

        //MV tm_mad fe:system_dir/disk.i host:remote_system_dir/disk.i vmid dsid(image)
        xfr << "MV "
            << tm_mad << " "
            << nd.get_nebula_hostname() << ":"
            << vm->get_system_dir() << "/disk." << disk_id << " "
            << vm->get_hostname() << ":"
            << vm->get_remote_system_dir() << "/disk." << disk_id << " "
            << vm->get_oid() << " "
            << ds_id << endl;
    }

    //MV tm_mad fe:system_dir host:remote_system_dir vmid dsid(system)
    xfr << "MV "
        << vm_tm_mad << " "
        << nd.get_nebula_hostname() << ":"<< vm->get_system_dir() << " "
        << vm->get_hostname() << ":" << vm->get_remote_system_dir()<< " "
        << vm->get_oid() << " "
        << vm->get_ds_id() << endl;

    xfr.close();

    tm_md->transfer(vid,xfr_name);

    vm->unlock();
    return;

error_history:
    os.str("");
    os << "prolog_resume, VM " << vid << " has no history";
    goto error_common;

error_drivers:
    os.str("");
    os << "prolog_resume, error getting drivers.";
    goto error_common;

error_file:
    os.str("");
    os << "prolog_resume, could not open file: " << xfr_name;
    goto error_common;

error_common:
    (nd.get_lcm())->trigger(LifeCycleManager::PROLOG_FAILURE,vid);
    vm->log("TM", Log::ERROR, os);

    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::prolog_attach_action(int vid)
{
    ofstream      xfr;
    ostringstream os("prolog, ");
    string        xfr_name;

    const VectorAttribute * disk;

    string  files;
    string  vm_tm_mad;
    string  opennebula_hostname;
    int     rc;
    string  error_str;

    VirtualMachine * vm;
    Nebula&          nd = Nebula::instance();

    const TransferManagerDriver * tm_md;

    // -------------------------------------------------------------------------
    // Setup & Transfer script
    // -------------------------------------------------------------------------

    vm = vmpool->get(vid,true);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    vm_tm_mad = vm->get_tm_mad();
    tm_md     = get();

    if ( tm_md == 0 || vm_tm_mad.empty() )
    {
        goto error_drivers;
    }

    xfr_name = vm->get_transfer_file() + ".prolog_attach";
    xfr.open(xfr_name.c_str(), ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }

    opennebula_hostname = nd.get_nebula_hostname();

    // -------------------------------------------------------------------------
    // Image Transfer Commands
    // -------------------------------------------------------------------------
    disk = vm->get_attach_disk();

    if ( disk == 0 )
    {
        goto error_disk;
    }

    rc = prolog_transfer_command(vm,
                                 disk,
                                 vm_tm_mad,
                                 opennebula_hostname,
                                 xfr,
                                 os);

    if ( rc != 0 )
    {
        goto error_attributes;
    }

    xfr.close();

    tm_md->transfer(vid,xfr_name);

    vm->unlock();
    return;

error_history:
    os << "VM " << vid << " has no history";
    goto error_common;

error_drivers:
    os.str("");
    os << "prolog_attach, error getting drivers.";
    goto error_common;

error_file:
    os << "could not open file: " << xfr_name;
    goto error_common;

error_disk:
    os.str("");
    os << "prolog_attach, could not find disk to attach";
    goto error_common;

error_attributes:
    xfr.close();
    goto error_common;

error_common:
    (nd.get_lcm())->trigger(LifeCycleManager::PROLOG_FAILURE,vid);
    vm->log("TM", Log::ERROR, os);

    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::epilog_transfer_command(
        VirtualMachine *        vm,
        const VectorAttribute * disk,
        ostream&                xfr)
{
    int    disk_id;


    string save  = disk->vector_value("SAVE");

    disk->vector_value("DISK_ID", disk_id);

    transform(save.begin(),save.end(),save.begin(),(int(*)(int))toupper);

    if ( save == "YES" )
    {
        string source = disk->vector_value("SOURCE");
        string tm_mad = disk->vector_value("TM_MAD");
        string ds_id  = disk->vector_value("DATASTORE_ID");

        if ( ds_id.empty() || tm_mad.empty() )
        {
            vm->log("TM", Log::ERROR, "No DS_ID or TM_MAD to save disk image");
            return;
        }

        if (source.empty())
        {
            vm->log("TM", Log::ERROR, "No SOURCE to save disk image");
            return;
        }

        //MVDS tm_mad hostname:remote_system_dir/disk.0 <fe:SOURCE|SOURCE> vmid dsid
        xfr << "MVDS "
            << tm_mad << " "
            << vm->get_hostname() << ":"
            << vm->get_remote_system_dir() << "/disk." << disk_id << " "
            << source << " "
            << vm->get_oid() << " "
            << ds_id
            << endl;
    }
    else //No saving disk
    {
        string tm_mad;

        int ds_id_i;
        int vv_rc = 0;

        if ( VirtualMachine::isVolatile(disk) == true )
        {
            tm_mad = vm->get_tm_mad();
            ds_id_i= vm->get_ds_id();
        }
        else
        {
            tm_mad = disk->vector_value("TM_MAD");
            vv_rc  = disk->vector_value("DATASTORE_ID", ds_id_i);
        }

        if ( !tm_mad.empty() && vv_rc == 0)
        {
            //DELETE tm_mad hostname:remote_system_dir/disk.i vmid ds_id
            xfr << "DELETE "
                << tm_mad << " "
                << vm->get_hostname() << ":"
                << vm->get_remote_system_dir() << "/disk." << disk_id << " "
                << vm->get_oid() << " "
                << ds_id_i
                << endl;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::epilog_action(int vid)
{
    ofstream        xfr;
    ostringstream   os;
    string xfr_name;
    string vm_tm_mad;
    string error_str;

    const VectorAttribute * disk;

    VirtualMachine *    vm;
    Nebula&             nd = Nebula::instance();

    const TransferManagerDriver * tm_md;

    vector<const Attribute *>   attrs;
    int                         num;

    // ------------------------------------------------------------------------
    // Setup & Transfer script
    // ------------------------------------------------------------------------
    vm = vmpool->get(vid,true);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    vm_tm_mad = vm->get_tm_mad();
    tm_md     = get();

    if ( tm_md == 0 || vm_tm_mad.empty())
    {
        goto error_drivers;
    }

    xfr_name = vm->get_transfer_file() + ".epilog";
    xfr.open(xfr_name.c_str(), ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }

    // -------------------------------------------------------------------------
    // copy back VM image (DISK with SAVE="yes")
    // -------------------------------------------------------------------------
    num = vm->get_template_attribute("DISK",attrs);

    for (int i=0; i < num; i++)
    {
        disk = dynamic_cast<const VectorAttribute *>(attrs[i]);

        if ( disk == 0 )
        {
            continue;
        }

        epilog_transfer_command(vm, disk, xfr);
    }

    //DELETE vm_tm_mad hostname:remote_system_dir vmid ds_id
    xfr << "DELETE "
        << vm_tm_mad << " "
        << vm->get_hostname() << ":" << vm->get_remote_system_dir() << " "
        << vm->get_oid() << " "
        << vm->get_ds_id() << endl;

    xfr.close();

    tm_md->transfer(vid,xfr_name);

    vm->unlock();
    return;

error_history:
    os.str("");
    os << "epilog, VM " << vid << " has no history";
    goto error_common;

error_drivers:
    os.str("");
    os << "epilog, error getting drivers.";
    goto error_common;

error_file:
    os.str("");
    os << "epilog, could not open file: " << xfr_name;
    goto error_common;

error_common:
    (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_FAILURE,vid);
    vm->log("TM", Log::ERROR, os);

    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::epilog_stop_action(int vid)
{
    ofstream      xfr;
    ostringstream os;

    string xfr_name;
    string tm_mad;
    string vm_tm_mad;

    int ds_id;
    int disk_id;

    VirtualMachine * vm;
    Nebula&          nd = Nebula::instance();

    const TransferManagerDriver * tm_md;

    vector<const Attribute *> attrs;
    const VectorAttribute *   disk;
    int                       num;

    // ------------------------------------------------------------------------
    // Setup & Transfer script
    // ------------------------------------------------------------------------
    vm = vmpool->get(vid,true);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    vm_tm_mad = vm->get_tm_mad();
    tm_md     = get();

    if (tm_md == 0 || vm_tm_mad.empty())
    {
        goto error_drivers;
    }

    xfr_name = vm->get_transfer_file() + ".stop";
    xfr.open(xfr_name.c_str(), ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }

    // ------------------------------------------------------------------------
    // Move system directory and disks
    // ------------------------------------------------------------------------
    num = vm->get_template_attribute("DISK",attrs);

    for (int i=0 ; i < num ; i++)
    {
        disk = dynamic_cast<const VectorAttribute *>(attrs[i]);

        if ( disk == 0 )
        {
            continue;
        }

        disk->vector_value_str("DISK_ID", disk_id);

        if ( VirtualMachine::isVolatile(disk) == true )
        {
            tm_mad = vm_tm_mad;
            ds_id  = vm->get_ds_id();
        }
        else
        {
            tm_mad    = disk->vector_value("TM_MAD");
            int vv_rc = disk->vector_value("DATASTORE_ID", ds_id);

            if (tm_mad.empty() || vv_rc == -1)
            {
                continue;
            }
        }

        //MV tm_mad host:remote_system_dir/disk.i fe:system_dir/disk.i vmid dsid(image)
        xfr << "MV "
            << tm_mad << " "
            << vm->get_hostname() << ":"
            << vm->get_remote_system_dir() << "/disk." << disk_id << " "
            << nd.get_nebula_hostname() << ":"
            << vm->get_system_dir() << "/disk." << disk_id << " "
            << vm->get_oid() << " "
            << ds_id << endl;
    }

    //MV vm_tm_mad hostname:remote_system_dir fe:system_dir vmid dsid(system)
    xfr << "MV "
        << vm_tm_mad << " "
        << vm->get_hostname() << ":" << vm->get_remote_system_dir() << " "
        << nd.get_nebula_hostname() << ":" << vm->get_system_dir() << " "
        << vm->get_oid() << " "
        << vm->get_ds_id() << endl;

    xfr.close();

    tm_md->transfer(vid,xfr_name);

    vm->unlock();

    return;

error_history:
    os.str("");
    os << "epilog_stop, VM " << vid << " has no history";
    goto error_common;

error_drivers:
    os.str("");
    os << "epilog_stop, error getting drivers.";
    goto error_common;

error_file:
    os.str("");
    os << "epilog_stop, could not open file: " << xfr_name;
    goto error_common;

error_common:
    (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_FAILURE,vid);
    vm->log("TM", Log::ERROR, os);

    vm->unlock();
    return;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int TransferManager::epilog_delete_commands(VirtualMachine *vm,
                                            ostream&        xfr,
                                            bool            local,
                                            bool            previous)
{
    ostringstream os;

    string vm_tm_mad;
    string tm_mad;
    string host;
    string system_dir;

    int ds_id;
    int vm_ds_id;
    int disk_id;

    Nebula& nd = Nebula::instance();

    const VectorAttribute *   disk;
    vector<const Attribute *> attrs;
    int                       num;

    // ------------------------------------------------------------------------
    // Setup transfer
    // ------------------------------------------------------------------------
    if (!vm->hasHistory())
    {
        goto error_history;
    }

    if (local)
    {
        host       = nd.get_nebula_hostname();
        system_dir = vm->get_system_dir();

        vm_tm_mad = vm->get_tm_mad();
        vm_ds_id  = vm->get_ds_id();
    }
    else if (previous)
    {
        if (!vm->hasPreviousHistory())
        {
            goto error_history;
        }

        host       = vm->get_previous_hostname();
        system_dir = vm->get_previous_remote_system_dir();

        vm_tm_mad = vm->get_previous_tm_mad();
        vm_ds_id  = vm->get_previous_ds_id();
    }
    else
    {
        host       = vm->get_hostname();
        system_dir = vm->get_remote_system_dir();

        vm_tm_mad = vm->get_tm_mad();
        vm_ds_id  = vm->get_ds_id();
    }

    if (vm_tm_mad.empty())
    {
        goto error_drivers;
    }

    // -------------------------------------------------------------------------
    // Delete disk images and the remote system Directory
    // -------------------------------------------------------------------------
    num = vm->get_template_attribute("DISK",attrs);

    for (int i=0 ; i < num ; i++)
    {
        disk = dynamic_cast<const VectorAttribute *>(attrs[i]);

        if ( disk == 0 )
        {
            continue;
        }

        disk->vector_value_str("DISK_ID", disk_id);

        if ( VirtualMachine::isVolatile(disk) == true )
        {
            tm_mad = vm_tm_mad;
            ds_id  = vm_ds_id;
        }
        else
        {
            tm_mad    = disk->vector_value("TM_MAD");
            int vv_rc = disk->vector_value("DATASTORE_ID", ds_id);

            if (tm_mad.empty() || vv_rc == -1)
            {
                continue;
            }
        }

        //DELETE tm_mad host:remote_system_dir/disk.i vmid dsid(image)
        // *local* DELETE tm_mad fe:system_dir/disk.i vmid dsid(image)
        // *prev*  DELETE tm_mad prev_host:remote_system_dir/disk.i vmid ds_id(image)
        xfr << "DELETE "
            << tm_mad << " "
            << host << ":"
            << system_dir << "/disk." << disk_id << " "
            << vm->get_oid() << " "
            << ds_id << endl;
    }

    //DELETE vm_tm_mad hostname:remote_system_dir vmid dsid(system)
    // *local* DELETE vm_tm_mad fe:system_dir vmid dsid(system)
    // *prev*  DELTE vm_tm_mad prev_host:remote_system_dir vmid ds_id(system)
    xfr << "DELETE "
        << vm_tm_mad << " "
        << host <<":"<< system_dir << " "
        << vm->get_oid() << " "
        << vm_ds_id << endl;

    return 0;

error_history:
    os << "epilog_delete, VM " << vm->get_oid() << " missing history record";
    goto error_common;

error_drivers:
    os << "epilog_delete, error getting drivers.";
    goto error_common;

error_common:
    vm->log("TM", Log::ERROR, os);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::epilog_delete_action(bool local, int vid)
{
    ostringstream os;

    ofstream xfr;
    string   xfr_name;

    VirtualMachine * vm;
    Nebula&          nd = Nebula::instance();

    const TransferManagerDriver * tm_md;

    int rc;

    // ------------------------------------------------------------------------
    // Setup & Transfer script
    // ------------------------------------------------------------------------
    vm = vmpool->get(vid,true);

    if (vm == 0)
    {
        return;
    }

    tm_md = get();

    if ( tm_md == 0 )
    {
        goto error_driver;
    }

    xfr_name = vm->get_transfer_file() + ".delete";
    xfr.open(xfr_name.c_str(), ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }

    rc = epilog_delete_commands(vm, xfr, local, false);

    if ( rc != 0 )
    {
        goto error_common;
    }

    xfr.close();

    tm_md->transfer(vid,xfr_name);

    vm->unlock();
    return;

error_driver:
    os << "epilog_delete, error getting TM driver.";
    goto error_common;

error_file:
    os << "epilog_delete, could not open file: " << xfr_name;
    os << ". You may need to manually clean the host (current)";
    goto error_common;

error_common:
    vm->log("TM", Log::ERROR, os);
    (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_FAILURE, vid);

    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::epilog_delete_previous_action(int vid)
{
    ostringstream os;

    ofstream xfr;
    string   xfr_name;

    VirtualMachine * vm;
    Nebula&          nd = Nebula::instance();

    const TransferManagerDriver * tm_md;

    int rc;

    // ------------------------------------------------------------------------
    // Setup & Transfer script
    // ------------------------------------------------------------------------
    vm = vmpool->get(vid,true);

    if (vm == 0)
    {
        return;
    }

    tm_md = get();

    if (tm_md == 0)
    {
        goto error_driver;
    }

    xfr_name = vm->get_transfer_file() + ".delete_prev";
    xfr.open(xfr_name.c_str(),ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }

    rc = epilog_delete_commands(vm, xfr, false, true);

    if ( rc != 0 )
    {
        goto error_common;
    }

    xfr.close();

    tm_md->transfer(vid, xfr_name);

    vm->unlock();
    return;

error_driver:
    os << "epilog_delete_previous, error getting TM driver.";
    goto error_common;

error_file:
    os << "epilog_delete_previous, could not open file: " << xfr_name;
    os << ". You may need to manually clean the host (previous)";
    goto error_common;

error_common:
    vm->log("TM", Log::ERROR, os);
    (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_FAILURE, vid);

    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::epilog_delete_both_action(int vid)
{
    ostringstream os;

    ofstream xfr;
    string   xfr_name;

    VirtualMachine * vm;
    Nebula&          nd = Nebula::instance();

    const TransferManagerDriver * tm_md;

    int rc;

    // ------------------------------------------------------------------------
    // Setup & Transfer script
    // ------------------------------------------------------------------------
    vm = vmpool->get(vid,true);

    if (vm == 0)
    {
        return;
    }

    tm_md = get();

    if (tm_md == 0)
    {
        goto error_driver;
    }

    xfr_name = vm->get_transfer_file() + ".delete_both";
    xfr.open(xfr_name.c_str(),ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }

    rc = epilog_delete_commands(vm, xfr, false, false); //current
    rc = epilog_delete_commands(vm, xfr, false, true);  //previous

    if ( rc != 0 )
    {
        goto error_common;
    }

    xfr.close();

    tm_md->transfer(vid, xfr_name);

    vm->unlock();
    return;

error_driver:
    os << "epilog_delete_both, error getting TM driver.";
    goto error_common;

error_file:
    os << "epilog_delete_both, could not open file: " << xfr_name;
    os << ". You may need to manually clean hosts (previous & current)";
    goto error_common;

error_common:
    vm->log("TM", Log::ERROR, os);
    (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_FAILURE, vid);

    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::epilog_detach_action(int vid)
{
    ofstream        xfr;
    ostringstream   os;
    string xfr_name;
    string vm_tm_mad;
    string error_str;

    const VectorAttribute * disk;

    VirtualMachine *    vm;
    Nebula&             nd = Nebula::instance();

    const TransferManagerDriver * tm_md;

    // ------------------------------------------------------------------------
    // Setup & Transfer script
    // ------------------------------------------------------------------------
    vm = vmpool->get(vid,true);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    vm_tm_mad = vm->get_tm_mad();
    tm_md     = get();

    if ( tm_md == 0 || vm_tm_mad.empty())
    {
        goto error_drivers;
    }

    xfr_name = vm->get_transfer_file() + ".epilog_detach";
    xfr.open(xfr_name.c_str(), ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }

    // -------------------------------------------------------------------------
    // copy back VM image (DISK with SAVE="yes")
    // -------------------------------------------------------------------------

    disk = vm->get_attach_disk();

    if ( disk == 0 )
    {
        goto error_disk;
    }

    epilog_transfer_command(vm, disk, xfr);

    xfr.close();

    tm_md->transfer(vid,xfr_name);

    vm->unlock();
    return;

error_history:
    os.str("");
    os << "epilog_detach, VM " << vid << " has no history";
    goto error_common;

error_drivers:
    os.str("");
    os << "epilog_detach, error getting drivers.";
    goto error_common;

error_file:
    os.str("");
    os << "epilog_detach, could not open file: " << xfr_name;
    goto error_common;

error_disk:
    os.str("");
    os << "epilog_detach, could not find disk to detach";
    goto error_common;

error_common:
    (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_FAILURE,vid);
    vm->log("TM", Log::ERROR, os);

    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::driver_cancel_action(int vid)
{
    ofstream        xfr;
    ostringstream   os;
    string          xfr_name;

    VirtualMachine *    vm;

    const TransferManagerDriver * tm_md;

    // ------------------------------------------------------------------------
    // Get the Driver for this host
    // ------------------------------------------------------------------------
    tm_md = get();

    if ( tm_md == 0 )
    {
        return;
    }

    vm = vmpool->get(vid,true);

    if (vm == 0)
    {
        return;
    }

    // ------------------------------------------------------------------------
    // Cancel the current operation
    // ------------------------------------------------------------------------

    tm_md->driver_cancel(vid);

    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::checkpoint_action(int vid)
{

}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::saveas_hot_action(int vid)
{
    int    disk_id;
    int    image_id;
    string source;
    string tm_mad;
    string ds_id;

    ostringstream os;

    ofstream xfr;
    string   xfr_name;

    VirtualMachine * vm;
    const TransferManagerDriver * tm_md;

    Nebula& nd = Nebula::instance();

    // ------------------------------------------------------------------------
    // Setup & Transfer script
    // ------------------------------------------------------------------------
    vm = vmpool->get(vid,true);

    if (vm == 0)
    {
         vm->log("TM", Log::ERROR, "Could not obtain the VM");
         goto error_common;
    }

    if (!vm->hasHistory())
    {
        vm->log("TM", Log::ERROR, "The VM has no history");
        goto error_common;
    }

    if (vm->get_saveas_disk(disk_id, source, image_id, tm_mad, ds_id) != 0)
    {
        vm->log("TM", Log::ERROR,"Could not get disk information to export it");
        goto error_common;
    }

    tm_md = get();

    if (tm_md == 0)
    {
        goto error_driver;
    }

    xfr_name = vm->get_transfer_file() + ".saveas_hot";
    xfr.open(xfr_name.c_str(),ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }

    //MVDS tm_mad hostname:remote_system_dir/disk.0 <fe:SOURCE|SOURCE> vmid dsid
    xfr << "CPDS "
        << tm_mad << " "
        << vm->get_hostname() << ":"
        << vm->get_remote_system_dir() << "/disk." << disk_id << " "
        << source << " "
        << vm->get_oid() << " "
        << ds_id
        << endl;

    xfr.close();

    tm_md->transfer(vid, xfr_name);

    vm->unlock();

    return;

error_driver:
    os << "saveas_hot_transfer, error getting TM driver.";
    goto error_common;

error_file:
    os << "saveas_hot_transfer, could not open file: " << xfr_name;
    os << ". You may need to manually clean hosts (previous & current)";
    goto error_common;

error_common:
    vm->log("TM", Log::ERROR, os);

    (nd.get_lcm())->trigger(LifeCycleManager::SAVEAS_FAILURE, vid);

    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::migrate_transfer_command(
        VirtualMachine *        vm,
        ostream&                xfr)
{
    // <PREMIGRATE/POSTMIGRATE> tm_mad SOURCE DST remote_system_dir vmid dsid

    xfr << "MIGRATE " //TM action PRE or POST to be completed by VMM driver
        << vm->get_tm_mad() << " "
        << vm->get_previous_hostname() << " "
        << vm->get_hostname() << " "
        << vm->get_remote_system_dir() << " "
        << vm->get_oid() << " "
        << vm->get_ds_id()
        << endl;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::do_snapshot_action(int vid, const char * snap_action)
{
    string tm_mad;
    string ds_id;
    string disk_id;
    string parent_id;
    string snap_id;

    ostringstream os;

    ofstream xfr;
    string   xfr_name;

    VirtualMachine * vm;

    const TransferManagerDriver * tm_md;

    Nebula& nd = Nebula::instance();

    // ------------------------------------------------------------------------
    // Setup & Transfer script
    // ------------------------------------------------------------------------
    vm = vmpool->get(vid,true);

    if (vm == 0)
    {
         vm->log("TM", Log::ERROR, "Could not obtain the VM");
         goto error_common;
    }

    if (!vm->hasHistory())
    {
        vm->log("TM", Log::ERROR, "The VM has no history");
        goto error_common;
    }

    if (vm->get_snapshot_disk(ds_id, tm_mad, disk_id, snap_id) == -1)
    {
        vm->log("TM", Log::ERROR, "Could not get disk information to"
                "take snapshot");
        goto error_common;
    }

    tm_md = get();

    if (tm_md == 0)
    {
        goto error_driver;
    }

    xfr_name = vm->get_transfer_file() + ".disk_snapshot";
    xfr.open(xfr_name.c_str(),ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }

    //SNAP_CREATE tm_mad host:remote_system_dir/disk.0 snapid vmid dsid
    xfr << snap_action << " "
        << tm_mad << " "
        << vm->get_hostname() << ":"
        << vm->get_remote_system_dir() << "/disk." << disk_id << " "
        << snap_id << " "
        << vm->get_oid() << " "
        << ds_id
        << endl;

    xfr.close();

    tm_md->transfer(vid, xfr_name);

    vm->unlock();

    return;

error_driver:
    os << "saveas_hot_transfer, error getting TM driver.";
    goto error_common;

error_file:
    os << "disk_snapshot_create, could not open file: " << xfr_name;
    goto error_common;

error_common:
    vm->log("TM", Log::ERROR, os);

   (nd.get_lcm())->trigger(LifeCycleManager::DISK_SNAPSHOT_FAILURE, vid);

    vm->unlock();
    return;
}

void TransferManager::snapshot_create_action(int vid)
{
    return do_snapshot_action(vid, "SNAP_CREATE");
};

void TransferManager::snapshot_revert_action(int vid)
{
    return do_snapshot_action(vid, "SNAP_REVERT");
};

void TransferManager::snapshot_delete_action(int vid)
{
    return do_snapshot_action(vid, "SNAP_DELETE");
};

/* ************************************************************************** */
/* MAD Loading                                                                */
/* ************************************************************************** */

int TransferManager::load_mads(int uid)
{
    ostringstream oss;

    int    rc;
    string name;

    const VectorAttribute * vattr = 0;
    TransferManagerDriver * tm_driver = 0;

    oss << "Loading Transfer Manager driver.";

    NebulaLog::log("TM",Log::INFO,oss);

    if ( mad_conf.size() > 0 )
    {
        vattr = static_cast<const VectorAttribute *>(mad_conf[0]);
    }

    if ( vattr == 0 )
    {
        NebulaLog::log("TM",Log::ERROR,"Failed to load Transfer Manager driver.");
        return -1;
    }

    VectorAttribute tm_conf("TM_MAD",vattr->value());

    tm_conf.replace("NAME",transfer_driver_name);

    tm_driver = new TransferManagerDriver(uid,
                                          tm_conf.value(),
                                          (uid != 0),
                                          vmpool);
    rc = add(tm_driver);

    if ( rc == 0 )
    {
        oss.str("");
        oss << "\tTransfer manager driver loaded";

        NebulaLog::log("TM",Log::INFO,oss);
    }

    return rc;
}
