/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
#include "NebulaUtil.h"
#include "VirtualMachineDisk.h"
#include "VirtualMachinePool.h"
#include "LifeCycleManager.h"
#include "ImagePool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * TransferManager::transfer_driver_name = "transfer_exe";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int TransferManager::start()
{
    using namespace std::placeholders; // for _1

    register_action(TransferManagerMessages::UNDEFINED,
                    &TransferManager::_undefined);

    register_action(TransferManagerMessages::TRANSFER,
                    bind(&TransferManager::_transfer, this, _1));

    register_action(TransferManagerMessages::LOG,
                    &TransferManager::_log);

    string error;
    if ( DriverManager::start(error) != 0 )
    {
        NebulaLog::error("TrM", error);
        return -1;
    }

    NebulaLog::log("TrM", Log::INFO, "Starting Transfer Manager...");

    Listener::start();

    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int TransferManager::prolog_transfer_command(
        VirtualMachine *        vm,
        const VirtualMachineDisk* disk,
        const string&           vm_tm_mad,
        const string&           opennebula_hostname,
        ostream&                xfr,
        ostringstream&          os)
{
    string type;
    string tm_mad_system;

    int disk_id = disk->get_disk_id();

    type = disk->vector_value("TYPE");

    one_util::toupper(type);

    if ( type == "SWAP" )
    {
        // -----------------------------------------------------------------
        // Generate a swap disk image
        // -----------------------------------------------------------------
        const string& size = disk->vector_value("SIZE");

        if ( size.empty() )
        {
            os << "No size in swap image";
            vm->log("TrM", Log::WARNING, "No size in swap image, skipping");
            return 0;
        }

        //MKSWAP tm_mad size host:remote_system_dir/disk.i vmid dsid(system)
        xfr << "MKSWAP "
            << vm_tm_mad << " "
            << size   << " "
            << vm->get_hostname() << ":"
            << vm->get_system_dir() << "/disk." << disk_id << " "
            << vm->get_oid() << " "
            << vm->get_ds_id()
            << endl;
    }
    else if ( type == "FS" )
    {
        // -----------------------------------------------------------------
        // Create a clean file system disk image
        // -----------------------------------------------------------------
        const string& size   = disk->vector_value("SIZE");
        const string& format = disk->vector_value("FORMAT");

        if ( size.empty() || format.empty() )
        {
            os << "No size or format in FS";
            vm->log("TrM", Log::WARNING, "No size or format in FS, skipping");
            return 0;
        }

        //MKIMAGE tm_mad size format host:remote_system_dir/disk.i vmid dsid(system)
        xfr << "MKIMAGE "
            << vm_tm_mad << " "
            << size   << " "
            << format << " "
            << vm->get_hostname() << ":"
            << vm->get_system_dir() << "/disk." << disk_id << " "
            << vm->get_oid() << " "
            << vm->get_ds_id()
            << endl;
    }
    else
    {
        // -----------------------------------------------------------------
        // Get transfer attributes & check errors
        // -----------------------------------------------------------------
        const string& tm_mad = disk->vector_value("TM_MAD");
        const string& ds_id  = disk->vector_value("DATASTORE_ID");
        const string& source = disk->vector_value("SOURCE");
        const string& clon   = disk->vector_value("CLONE");

        if ( source.empty() ||
             tm_mad.empty() ||
             ds_id.empty()  ||
             clon.empty() )
        {
            goto error_attributes;
        }

        std::string tsys = disk->get_tm_mad_system();
        if (!tsys.empty())
        {
            tm_mad_system = "." + tsys;
        }

        // -----------------------------------------------------------------
        // CLONE or LINK disk images
        // -----------------------------------------------------------------

        // <CLONE|LN>(.tm_mad_system) tm_mad fe:SOURCE host:remote_system_ds/disk.i vmid dsid"
        if (one_util::icasecmp(clon, "YES"))
        {
            xfr << "CLONE";
        }
        else
        {
            xfr << "LN";
        }

        xfr << tm_mad_system << " " << tm_mad << " ";

        if ( source.find(":") == string::npos ) //Regular file
        {
            xfr << opennebula_hostname << ":" << source << " ";
        }
        else //TM Plugin specific protocol
        {
            xfr << source << " ";
        }

        xfr << vm->get_hostname() << ":"
            << vm->get_system_dir() << "/disk." << disk_id << " "
            << vm->get_oid() << " "
            << ds_id
            << endl;
    }

    return 0;

error_attributes:
    os << "missing DISK mandatory attributes "
       << "(SOURCE, TM_MAD, CLONE, DATASTORE_ID) for VM " << vm->get_oid()
       << ", DISK " << disk_id;

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

    const string& name_ds = os_attr->vector_value(base_ds);

    if ( name_ds.empty() )
    {
        return "";
    }

    string base_source = base + "_DS_SOURCE";
    string base_ds_id  = base + "_DS_DSID";
    string base_tm     = base + "_DS_TM";

    const string& source = os_attr->vector_value(base_source);
    const string& ds_id  = os_attr->vector_value(base_ds_id);
    const string& tm_mad = os_attr->vector_value(base_tm);

    if ( source.empty() || ds_id.empty() || tm_mad.empty() )
    {
        return "";
    }

    ostringstream base_dst;
    string        name = base;

    one_util::tolower(name);

    base_dst << vm->get_system_dir() << "/" << name;

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

int TransferManager::prolog_context_command(
        VirtualMachine *        vm,
        const string&           token_password,
        const string&           vm_tm_mad,
        int&                    disk_id,
        ostream&                xfr)
{
    string  files;

    int rc = vm->generate_context(files, disk_id, token_password);

    if ( rc != 1 ) // 0 = no context, -1 = error
    {
        return rc;
    }

    //CONTEXT tm_mad files hostname:remote_system_dir/disk.i vmid dsid(=0)
    xfr << "CONTEXT "
        << vm_tm_mad << " "
        << vm->get_context_file() << " ";

    if (!files.empty())
    {
        xfr << files << " ";
    }

    xfr << vm->get_hostname() << ":"
        << vm->get_system_dir() << "/disk." << disk_id << " "
        << vm->get_oid() << " "
        << vm->get_ds_id()
        << endl;

    return 1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/**
 *  Check VM attributes and trigger a LCM event
 *    - success for hybrid VMs
 *    - failure if no history is present (consistency check)
 *
 *    @return 0 if the TM event needs to be triggered
 */
static int test_and_trigger(VirtualMachine * vm,
                            void (LifeCycleManager::*success)(int),
                            void (LifeCycleManager::*failure)(int))
{
    if (!vm->hasHistory())
    {
        auto lcm = Nebula::instance().get_lcm();

        (lcm->*failure)(vm->get_oid());

        return -1;
    }

    if (vm->get_host_is_cloud())
    {
        auto lcm = Nebula::instance().get_lcm();

        (lcm->*success)(vm->get_oid());

        return -1;
    }

    return 0;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_prolog(VirtualMachine * vm)
{
    int vid = vm->get_oid();

    int rc  = test_and_trigger(vm,
                               &LifeCycleManager::trigger_prolog_success,
                               &LifeCycleManager::trigger_prolog_failure);

    if ( rc == -1 )
    {
        return;
    }

    trigger([this, vid]
    {
        ofstream      xfr;
        ostringstream os("prolog, ");
        string        xfr_name;

        string  files;
        string  vm_tm_mad;
        string  opennebula_hostname;
        int     rc;
        string  error_str;

        Nebula&          nd = Nebula::instance();

        const Driver<transfer_msg_t> * tm_md;

        const VectorAttribute * os_attr;

        string token_password;

        // -------------------------------------------------------------------------
        // Setup & Transfer script
        // -------------------------------------------------------------------------
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        int uid      = vm->get_created_by_uid();
        int owner_id = vm->get_uid();

        token_password = Nebula::instance().get_upool()->get_token_password(uid, owner_id);

        VirtualMachineDisks& disks = vm->get_disks();

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        vm_tm_mad = vm->get_tm_mad();
        tm_md     = get();

        if ( tm_md == nullptr || vm_tm_mad.empty() )
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

        for (auto disk : disks)
        {
            rc = prolog_transfer_command(vm.get(), disk, vm_tm_mad, opennebula_hostname,
                                         xfr, os);

            if ( rc != 0 )
            {
                goto error_attributes;
            }
        }

        // -------------------------------------------------------------------------
        // Transfers for kernel and initrd files
        // -------------------------------------------------------------------------
        os_attr = vm->get_template_attribute("OS");

        if ( os_attr != nullptr )
        {
            string kernel;
            string initrd;

            bool update = false;

            kernel = prolog_os_transfer_commands(
                             vm.get(),
                             os_attr,
                             "KERNEL",
                             opennebula_hostname,
                             xfr);

            initrd = prolog_os_transfer_commands(
                             vm.get(),
                             os_attr,
                             "INITRD",
                             opennebula_hostname,
                             xfr);

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
                vmpool->update(vm.get());
            }
        }

        xfr.close();

        vm.reset();

        {
            transfer_msg_t msg(TransferManagerMessages::TRANSFER, "", vid, xfr_name);
            tm_md->write(msg);
        }

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

error_common:
        nd.get_lcm()->trigger_prolog_failure(vid);
        vm->log("TrM", Log::ERROR, os);

        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_prolog_migr(VirtualMachine * vm)
{
    int vid = vm->get_oid();

    int rc  = test_and_trigger(vm,
                               &LifeCycleManager::trigger_prolog_success,
                               &LifeCycleManager::trigger_prolog_failure);

    if ( rc == -1 )
    {
        return;
    }

    trigger([this, vid]
    {
        ofstream        xfr;
        ostringstream   os;
        string          xfr_name;

        string tm_mad;
        string tm_mad_system;
        string vm_tm_mad;

        int ds_id;
        int disk_id;

        const Driver<transfer_msg_t> * tm_md;

        // -------------------------------------------------------------------------
        // Setup & Transfer script
        // -------------------------------------------------------------------------
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        VirtualMachineDisks& disks = vm->get_disks();

        if (!vm->hasHistory() || !vm->hasPreviousHistory())
        {
            goto error_history;
        }

        vm_tm_mad = vm->get_tm_mad();
        tm_md     = get();

        if ( tm_md == nullptr || vm_tm_mad.empty())
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

        for (auto disk : disks)
        {
            disk_id = disk->get_disk_id();

            if ( disk->is_volatile() == true )
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

            string tsys = disk->vector_value("TM_MAD_SYSTEM");
            if (!tsys.empty())
            {
                tm_mad_system = "." + tsys;
            }

            //MV(.tm_mad_system) tm_mad prev_host:remote_system_dir/disk.i host:remote_system_dir/disk.i vmid dsid(image)
            xfr << "MV"
                << tm_mad_system
                << " " << tm_mad << " "
                << vm->get_previous_hostname() << ":"
                << vm->get_previous_system_dir() << "/disk." << disk_id << " "
                << vm->get_hostname() << ":"
                << vm->get_system_dir() << "/disk." << disk_id << " "
                << vm->get_oid() << " "
                << ds_id << endl;
        }

        //MV tm_mad prev_host:remote_system_dir host:remote_system_dir VMID dsid(system)
        xfr << "MV "
            << vm_tm_mad << " "
            << vm->get_previous_hostname() << ":"
            << vm->get_previous_system_dir() << " "
            << vm->get_hostname() << ":"
            << vm->get_system_dir() << " "
            << vm->get_oid() << " "
            << vm->get_ds_id() << endl;

        xfr.close();

        vm.reset();

        {
            transfer_msg_t msg(TransferManagerMessages::TRANSFER, "", vid, xfr_name);
            tm_md->write(msg);
        }

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
        Nebula::instance().get_lcm()->trigger_prolog_failure(vid);
        vm->log("TrM", Log::ERROR, os);

        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_prolog_resume(VirtualMachine * vm)
{
    int vid = vm->get_oid();

    int rc  = test_and_trigger(vm,
                               &LifeCycleManager::trigger_prolog_success,
                               &LifeCycleManager::trigger_prolog_failure);

    if ( rc == -1 )
    {
        return;
    }
    trigger([this, vid]
    {
        ofstream        xfr;
        ostringstream   os;
        string          xfr_name;

        string tm_mad;
        string tm_mad_system;
        string vm_tm_mad;
        string token_password;

        int ds_id;
        int disk_id;

        Nebula&          nd = Nebula::instance();

        const Driver<transfer_msg_t> * tm_md;

        // -------------------------------------------------------------------------
        // Setup & Transfer script
        // -------------------------------------------------------------------------
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        int uid      = vm->get_created_by_uid();
        int owner_id = vm->get_uid();

        token_password = Nebula::instance().get_upool()->get_token_password(uid, owner_id);

        VirtualMachineDisks& disks = vm->get_disks();

        if (!vm->hasHistory() || !vm->hasPreviousHistory())
        {
            goto error_history;
        }

        vm_tm_mad = vm->get_tm_mad();
        tm_md     = get();

        if ( tm_md == nullptr || vm_tm_mad.empty())
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
        for (auto disk : disks)
        {
            disk_id = disk->get_disk_id();

            if ( disk->is_volatile() == true )
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

            string tsys = disk->vector_value("TM_MAD_SYSTEM");
            if (!tsys.empty())
            {
                tm_mad_system = "." + tsys;
            }

            //MV(.tm_mad_system) tm_mad fe:system_dir/disk.i host:remote_system_dir/disk.i vmid dsid(image)
            xfr << "MV"
                << tm_mad_system
                << " " << tm_mad << " "
                << nd.get_nebula_hostname() << ":"
                << vm->get_previous_system_dir() << "/disk." << disk_id << " "
                << vm->get_hostname() << ":"
                << vm->get_system_dir() << "/disk." << disk_id << " "
                << vm->get_oid() << " "
                << ds_id << endl;
        }

        //MV tm_mad fe:system_dir host:remote_system_dir vmid dsid(system)
        xfr << "MV "
            << vm_tm_mad << " "
            << nd.get_nebula_hostname() << ":"<< vm->get_previous_system_dir() << " "
            << vm->get_hostname() << ":" << vm->get_system_dir()<< " "
            << vm->get_oid() << " "
            << vm->get_ds_id() << endl;

        xfr.close();

        vm.reset();

        {
            transfer_msg_t msg(TransferManagerMessages::TRANSFER, "", vid, xfr_name);
            tm_md->write(msg);
        }

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
        nd.get_lcm()->trigger_prolog_failure(vid);

        vm->log("TrM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_prolog_attach(VirtualMachine * vm)
{
    int vid = vm->get_oid();

    int rc  = test_and_trigger(vm,
                               &LifeCycleManager::trigger_prolog_success,
                               &LifeCycleManager::trigger_prolog_failure);

    if ( rc == -1 )
    {
        return;
    }

    trigger([this, vid]
    {
        ofstream      xfr;
        ostringstream os("prolog, ");
        string        xfr_name;

        const VirtualMachineDisk * disk;

        string  files;
        string  vm_tm_mad;
        string  opennebula_hostname;
        int     rc;
        string  error_str;

        Nebula&          nd = Nebula::instance();

        const Driver<transfer_msg_t> * tm_md;

        // -------------------------------------------------------------------------
        // Setup & Transfer script
        // -------------------------------------------------------------------------

        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        vm_tm_mad = vm->get_tm_mad();
        tm_md     = get();

        if ( tm_md == nullptr || vm_tm_mad.empty() )
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

        if ( disk == nullptr )
        {
            goto error_disk;
        }

        rc = prolog_transfer_command(vm.get(),
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

        vm.reset();

        {
            transfer_msg_t msg(TransferManagerMessages::TRANSFER, "", vid, xfr_name);
            tm_md->write(msg);
        }

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
        nd.get_lcm()->trigger_prolog_failure(vid);
        vm->log("TrM", Log::ERROR, os);

        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::epilog_transfer_command(
        VirtualMachine *        vm,
        const string&           host,
        const VirtualMachineDisk * disk,
        ostream&                xfr)
{
    string save = disk->vector_value("SAVE");
    int    disk_id = disk->get_disk_id();
    string tm_mad_system;

    if ( one_util::toupper(save) == "YES" )
    {
        const string& source = disk->vector_value("SOURCE");
        const string& tm_mad = disk->vector_value("TM_MAD");
        const string& ds_id  = disk->vector_value("DATASTORE_ID");

        if ( ds_id.empty() || tm_mad.empty() )
        {
            vm->log("TrM", Log::ERROR, "No DS_ID or TM_MAD to save disk image");
            return;
        }

        if (source.empty())
        {
            vm->log("TrM", Log::ERROR, "No SOURCE to save disk image");
            return;
        }

        const string& tsys = disk->vector_value("TM_MAD_SYSTEM");
        if (!tsys.empty())
        {
            tm_mad_system = "." + tsys;
        }

        //MVDS(.tm_mad_system) tm_mad hostname:remote_system_dir/disk.0 <fe:SOURCE|SOURCE> vmid dsid
        xfr << "MVDS" << tm_mad_system
            << " " << tm_mad << " "
            << host << ":" << vm->get_system_dir() << "/disk." << disk_id << " "
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

        if ( disk->is_volatile() == true )
        {
            tm_mad = vm->get_tm_mad();
            ds_id_i = vm->get_ds_id();
        }
        else
        {
            tm_mad = disk->vector_value("TM_MAD");
            vv_rc  = disk->vector_value("DATASTORE_ID", ds_id_i);
        }

        const string& tsys = disk->vector_value("TM_MAD_SYSTEM");
        if (!tsys.empty())
        {
            tm_mad_system = "." + tsys;
        }

        if ( !tm_mad.empty() && vv_rc == 0)
        {
            //DELETE(.tm_mad_system) tm_mad hostname:remote_system_dir/disk.i vmid ds_id
            xfr << "DELETE"
                << tm_mad_system << " "
                << tm_mad << " "
                << host << ":" << vm->get_system_dir() << "/disk." << disk_id << " "
                << vm->get_oid() << " "
                << ds_id_i
                << endl;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_epilog(bool local, VirtualMachine * vm)
{
    int vid = vm->get_oid();

    int rc  = test_and_trigger(vm,
                               &LifeCycleManager::trigger_epilog_success,
                               &LifeCycleManager::trigger_epilog_failure);

    if ( rc == -1 )
    {
        return;
    }

    trigger([this, local, vid]
    {
        ofstream      xfr;
        ostringstream os;

        string xfr_name;
        string vm_tm_mad;
        string error_str;
        string host;

        Nebula&             nd = Nebula::instance();

        const Driver<transfer_msg_t> * tm_md;

        // ------------------------------------------------------------------------
        // Setup & Transfer script
        // ------------------------------------------------------------------------
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        VirtualMachineDisks& disks = vm->get_disks();

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        vm_tm_mad = vm->get_tm_mad();
        tm_md     = get();

        if ( tm_md == nullptr || vm_tm_mad.empty())
        {
            goto error_drivers;
        }

        xfr_name = vm->get_transfer_file() + ".epilog";
        xfr.open(xfr_name.c_str(), ios::out | ios::trunc);

        if (xfr.fail() == true)
        {
            goto error_file;
        }

        if (local)
        {
            host = nd.get_nebula_hostname();
        }
        else
        {
            host = vm->get_hostname();
        }

        // -------------------------------------------------------------------------
        // copy back VM image (DISK with SAVE="yes")
        // -------------------------------------------------------------------------
        for (auto disk : disks)
        {
            epilog_transfer_command(vm.get(), host, disk, xfr);
        }

        //DELETE vm_tm_mad hostname:remote_system_dir vmid ds_id
        xfr << "DELETE "
            << vm_tm_mad << " "
            << host << ":" << vm->get_system_dir() << " "
            << vm->get_oid() << " "
            << vm->get_ds_id() << endl;

        xfr.close();

        vm.reset();

        {
            transfer_msg_t msg(TransferManagerMessages::TRANSFER, "", vid, xfr_name);
            tm_md->write(msg);
        }

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
        nd.get_lcm()->trigger_epilog_failure(vid);
        vm->log("TrM", Log::ERROR, os);

        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_epilog_stop(VirtualMachine * vm)
{
    int vid = vm->get_oid();

    int rc  = test_and_trigger(vm,
                               &LifeCycleManager::trigger_epilog_success,
                               &LifeCycleManager::trigger_epilog_failure);

    if ( rc == -1 )
    {
        return;
    }

    trigger([this, vid]
    {
        ofstream      xfr;
        ostringstream os;

        string xfr_name;
        string tm_mad;
        string tm_mad_system;
        string vm_tm_mad;

        int ds_id;
        int disk_id;

        Nebula&          nd = Nebula::instance();

        const Driver<transfer_msg_t> * tm_md;

        // ------------------------------------------------------------------------
        // Setup & Transfer script
        // ------------------------------------------------------------------------
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        VirtualMachineDisks& disks = vm->get_disks();

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        vm_tm_mad = vm->get_tm_mad();
        tm_md     = get();

        if (tm_md == nullptr || vm_tm_mad.empty())
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
        for (auto disk : disks)
        {
            disk_id = disk->get_disk_id();

            if ( disk->is_volatile() == true )
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

            const string& tsys = disk->vector_value("TM_MAD_SYSTEM");
            if (!tsys.empty())
            {
                tm_mad_system = "." + tsys;
            }

            //MV tm_mad host:remote_system_dir/disk.i fe:system_dir/disk.i vmid dsid(image)
            xfr << "MV"
                << tm_mad_system
                << " " << tm_mad << " "
                << vm->get_hostname() << ":"
                << vm->get_system_dir() << "/disk." << disk_id << " "
                << nd.get_nebula_hostname() << ":"
                << vm->get_system_dir() << "/disk." << disk_id << " "
                << vm->get_oid() << " "
                << ds_id << endl;
        }

        //MV vm_tm_mad hostname:remote_system_dir fe:system_dir vmid dsid(system)
        xfr << "MV "
            << vm_tm_mad << " "
            << vm->get_hostname() << ":" << vm->get_system_dir() << " "
            << nd.get_nebula_hostname() << ":" << vm->get_system_dir() << " "
            << vm->get_oid() << " "
            << vm->get_ds_id() << endl;

        xfr.close();

        vm.reset();

        {
            transfer_msg_t msg(TransferManagerMessages::TRANSFER, "", vid, xfr_name);
            tm_md->write(msg);
        }

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
        nd.get_lcm()->trigger_epilog_failure(vid);
        vm->log("TrM", Log::ERROR, os);

        return;
    });
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
    string tm_mad_system;
    string host;
    string system_dir;

    int ds_id;
    int vm_ds_id;
    int disk_id;

    Nebula& nd = Nebula::instance();

    VirtualMachineDisks& disks = vm->get_disks();

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
        system_dir = vm->get_previous_system_dir();

        vm_tm_mad = vm->get_previous_tm_mad();
        vm_ds_id  = vm->get_previous_ds_id();
    }
    else
    {
        host       = vm->get_hostname();
        system_dir = vm->get_system_dir();

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
    for (const auto* disk : disks)
    {
        disk_id = disk->get_disk_id();

        if ( disk->is_volatile() == true )
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

        const string& tsys = disk->vector_value("TM_MAD_SYSTEM");
        if (!tsys.empty())
        {
            tm_mad_system = "." + tsys;
        }

        //DELETE tm_mad(.tm_mad_system) host:remote_system_dir/disk.i vmid dsid(image)
        // *local* DELETE tm_mad fe:system_dir/disk.i vmid dsid(image)
        // *prev*  DELETE tm_mad prev_host:remote_system_dir/disk.i vmid ds_id(image)
        xfr << "DELETE" << tm_mad_system
            << " " << tm_mad << " "
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
    vm->log("TrM", Log::ERROR, os);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_epilog_delete(bool local, VirtualMachine * vm)
{
    int vid = vm->get_oid();

    int rc  = test_and_trigger(vm,
                               &LifeCycleManager::trigger_epilog_success,
                               &LifeCycleManager::trigger_epilog_failure);

    if ( rc == -1 )
    {
        return;
    }

    trigger([this, local, vid]
    {
        ostringstream os;

        ofstream xfr;
        string   xfr_name;

        Nebula&          nd = Nebula::instance();

        const Driver<transfer_msg_t> * tm_md;

        int rc;

        // ------------------------------------------------------------------------
        // Setup & Transfer script
        // ------------------------------------------------------------------------
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        tm_md = get();

        if ( tm_md == nullptr )
        {
            goto error_driver;
        }

        xfr_name = vm->get_transfer_file() + ".delete";
        xfr.open(xfr_name.c_str(), ios::out | ios::trunc);

        if (xfr.fail() == true)
        {
            goto error_file;
        }

        rc = epilog_delete_commands(vm.get(), xfr, local, false);

        if ( rc != 0 )
        {
            goto error_common;
        }

        xfr.close();

        vm.reset();

        {
            transfer_msg_t msg(TransferManagerMessages::TRANSFER, "", vid, xfr_name);
            tm_md->write(msg);
        }

        return;

error_driver:
        os << "epilog_delete, error getting TM driver.";
        goto error_common;

error_file:
        os << "epilog_delete, could not open file: " << xfr_name;
        os << ". You may need to manually clean the host (current)";
        goto error_common;

error_common:
        vm->log("TrM", Log::ERROR, os);
        (nd.get_lcm())->trigger_epilog_failure(vid);

        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_epilog_delete_previous(VirtualMachine * vm)
{
    int vid = vm->get_oid();

    int rc  = test_and_trigger(vm,
                               &LifeCycleManager::trigger_epilog_success,
                               &LifeCycleManager::trigger_epilog_failure);

    if ( rc == -1 )
    {
        return;
    }

    trigger([this, vid]
    {
        ostringstream os;

        ofstream xfr;
        string   xfr_name;

        Nebula&          nd = Nebula::instance();

        const Driver<transfer_msg_t> * tm_md;

        int rc;

        // ------------------------------------------------------------------------
        // Setup & Transfer script
        // ------------------------------------------------------------------------
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        tm_md = get();

        if (tm_md == nullptr)
        {
            goto error_driver;
        }

        xfr_name = vm->get_transfer_file() + ".delete_prev";
        xfr.open(xfr_name.c_str(), ios::out | ios::trunc);

        if (xfr.fail() == true)
        {
            goto error_file;
        }

        rc = epilog_delete_commands(vm.get(), xfr, false, true);

        if ( rc != 0 )
        {
            goto error_common;
        }

        xfr.close();

        vm.reset();

        {
            transfer_msg_t msg(TransferManagerMessages::TRANSFER, "", vid, xfr_name);
            tm_md->write(msg);
        }

        return;

error_driver:
        os << "epilog_delete_previous, error getting TM driver.";
        goto error_common;

error_file:
        os << "epilog_delete_previous, could not open file: " << xfr_name;
        os << ". You may need to manually clean the host (previous)";
        goto error_common;

error_common:
        vm->log("TrM", Log::ERROR, os);
        (nd.get_lcm())->trigger_epilog_failure(vid);

        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_epilog_delete_both(VirtualMachine * vm)
{
    int vid = vm->get_oid();

    int rc  = test_and_trigger(vm,
                               &LifeCycleManager::trigger_epilog_success,
                               &LifeCycleManager::trigger_epilog_failure);

    if ( rc == -1 )
    {
        return;
    }

    trigger([this, vid]
    {
        ostringstream os;

        ofstream xfr;
        string   xfr_name;

        Nebula&          nd = Nebula::instance();

        const Driver<transfer_msg_t> * tm_md;

        int rc;

        // ------------------------------------------------------------------------
        // Setup & Transfer script
        // ------------------------------------------------------------------------
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        tm_md = get();

        if (tm_md == nullptr)
        {
            goto error_driver;
        }

        xfr_name = vm->get_transfer_file() + ".delete_both";
        xfr.open(xfr_name.c_str(), ios::out | ios::trunc);

        if (xfr.fail() == true)
        {
            goto error_file;
        }

        rc = epilog_delete_commands(vm.get(), xfr, false, false); //current
        rc = epilog_delete_commands(vm.get(), xfr, false, true);  //previous

        if ( rc != 0 )
        {
            goto error_common;
        }

        xfr.close();

        vm.reset();

        {
            transfer_msg_t msg(TransferManagerMessages::TRANSFER, "", vid, xfr_name);
            tm_md->write(msg);
        }

        return;

error_driver:
        os << "epilog_delete_both, error getting TM driver.";
        goto error_common;

error_file:
        os << "epilog_delete_both, could not open file: " << xfr_name;
        os << ". You may need to manually clean hosts (previous & current)";
        goto error_common;

error_common:
        vm->log("TrM", Log::ERROR, os);
        (nd.get_lcm())->trigger_epilog_failure(vid);

        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_epilog_detach(VirtualMachine * vm)
{
    int vid = vm->get_oid();

    int rc  = test_and_trigger(vm,
                               &LifeCycleManager::trigger_epilog_success,
                               &LifeCycleManager::trigger_epilog_failure);

    if ( rc == -1 )
    {
        return;
    }

    trigger([this, vid]
    {
        ofstream        xfr;
        ostringstream   os;
        string xfr_name;
        string vm_tm_mad;
        string error_str;

        const VirtualMachineDisk * disk;

        Nebula&             nd = Nebula::instance();

        const Driver<transfer_msg_t> * tm_md;

        // ------------------------------------------------------------------------
        // Setup & Transfer script
        // ------------------------------------------------------------------------
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        vm_tm_mad = vm->get_tm_mad();
        tm_md     = get();

        if ( tm_md == nullptr || vm_tm_mad.empty())
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

        if ( disk == nullptr )
        {
            goto error_disk;
        }

        epilog_transfer_command(vm.get(), vm->get_hostname(), disk, xfr);

        xfr.close();

        vm.reset();

        {
            transfer_msg_t msg(TransferManagerMessages::TRANSFER, "", vid, xfr_name);
            tm_md->write(msg);
        }

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
        (nd.get_lcm())->trigger_epilog_failure(vid);
        vm->log("TrM", Log::ERROR, os);

        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_driver_cancel(int vid)
{
    trigger([this, vid]
    {
        // ------------------------------------------------------------------------
        // Get the Driver for this host
        // ------------------------------------------------------------------------
        auto tm_md = get();

        if (tm_md == nullptr)
        {
            return;
        }

        // ------------------------------------------------------------------------
        // Cancel the current operation
        // ------------------------------------------------------------------------

        transfer_msg_t msg(TransferManagerMessages::DRIVER_CANCEL, "", vid, "");
        tm_md->write(msg);
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_saveas_hot(int vid)
{
    trigger([this, vid]
    {
        int    disk_id;
        int    image_id;
        string src;
        string snap_id;
        string tm_mad;
        string ds_id;
        string tm_mad_system;
        string hostname;

        ostringstream os;

        ofstream xfr;
        string   xfr_name;

        const Driver<transfer_msg_t> * tm_md;
        const VirtualMachineDisk * disk;

        Nebula& nd = Nebula::instance();

        // ------------------------------------------------------------------------
        // Setup & Transfer script
        // ------------------------------------------------------------------------
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        if (vm->get_saveas_disk(disk_id, src, image_id, snap_id, tm_mad, ds_id)!= 0)
        {
            goto error_disk;
        }

        tm_md = get();

        if (tm_md == nullptr)
        {
            goto error_driver;
        }

        xfr_name = vm->get_transfer_file() + ".disk_saveas";
        xfr.open(xfr_name.c_str(), ios::out | ios::trunc);

        if (xfr.fail() == true)
        {
            goto error_file;
        }

        disk = vm->get_disk(disk_id);

        if (disk != nullptr)
        {
            const string& tsys = disk->vector_value("TM_MAD_SYSTEM");
            if (!tsys.empty())
            {
                tm_mad_system = "." + tsys;
            }
        }

        if (vm->get_lcm_state() == VirtualMachine::HOTPLUG_SAVEAS_STOPPED ||
            vm->get_lcm_state() == VirtualMachine::HOTPLUG_SAVEAS_UNDEPLOYED)
        {
            hostname = nd.get_nebula_hostname();
        }
        else
        {
            hostname = vm->get_hostname();
        }

        //CPDS tm_mad hostname:remote_system_dir/disk.0 source snapid vmid dsid
        xfr << "CPDS" << tm_mad_system
            << " " << tm_mad << " "
            << hostname << ":"
            << vm->get_system_dir() << "/disk." << disk_id << " "
            << src << " "
            << snap_id << " "
            << vm->get_oid() << " "
            << ds_id
            << endl;

        xfr.close();

        vm.reset();

        {
            transfer_msg_t msg(TransferManagerMessages::TRANSFER, "", vid, xfr_name);
            tm_md->write(msg);
        }

        return;

error_history:
        os << "saveas_hot_transfer, the VM has no history";
        goto error_common;

error_disk:
        os << "saveas_hot_transfer, could not get disk information to export it";
        goto error_common;

error_driver:
        os << "saveas_hot_transfer, error getting TM driver.";
        goto error_common;

error_file:
        os << "saveas_hot_transfer, could not open file: " << xfr_name;
        os << ". You may need to manually clean hosts (previous & current)";
        goto error_common;

error_common:
        vm->log("TrM", Log::ERROR, os);

        nd.get_lcm()->trigger_saveas_failure(vid);

        return;
    });
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
        << vm->get_system_dir() << " "
        << vm->get_oid() << " "
        << vm->get_ds_id()
        << endl;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int TransferManager::snapshot_transfer_command(
        const VirtualMachine * vm, const char * snap_action, ostream& xfr)
{
    string tm_mad;
    string tm_mad_system;
    int    ds_id;
    int    disk_id;
    int    snap_id;
    const VirtualMachineDisk * disk;

    if (vm->get_snapshot_disk(ds_id, tm_mad, disk_id, snap_id) == -1)
    {
        vm->log("TrM", Log::ERROR, "Could not get disk information to "
                "take snapshot");
        return -1;
    }

    disk = vm->get_disk(disk_id);

    if (disk != nullptr)
    {
        const string& tsys = disk->vector_value("TM_MAD_SYSTEM");
        if (!tsys.empty())
        {
            tm_mad_system = "." + tsys;
        }
    }

    //SNAP_CREATE(.tm_mad_system) tm_mad host:remote_system_dir/disk.0 snapid vmid dsid
    xfr << snap_action << tm_mad_system << " "
        << tm_mad << " "
        << vm->get_hostname() << ":"
        << vm->get_system_dir() << "/disk." << disk_id << " "
        << snap_id << " "
        << vm->get_oid() << " "
        << ds_id
        << endl;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::do_snapshot_action(int vid, const char * snap_action)
{
    ostringstream os;

    ofstream xfr;
    string   xfr_name;

    unique_ptr<VirtualMachine> vm;
    int rc;

    Nebula& nd = Nebula::instance();

    auto tm_md = get();

    if (tm_md == nullptr)
    {
        goto error_driver;
    }

    vm = vmpool->get(vid);

    if (vm == nullptr)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    xfr_name = vm->get_transfer_file() + ".disk_snapshot";
    xfr.open(xfr_name.c_str(), ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }

    rc = snapshot_transfer_command(vm.get(), snap_action, xfr);

    xfr.close();

    if ( rc == -1 )
    {
        goto error_common;
    }

    vm.reset();

    {
        transfer_msg_t msg(TransferManagerMessages::TRANSFER, "", vid, xfr_name);
        tm_md->write(msg);
    }

    return;

error_driver:
    os << "disk_snapshot, error getting TM driver.";
    goto error_common;

error_history:
    os << "disk_snapshot, the VM has no history";
    goto error_common;

error_file:
    os << "disk_snapshot, could not open file: " << xfr_name;
    goto error_common;

error_common:
    vm->log("TrM", Log::ERROR, os);

    nd.get_lcm()->trigger_disk_snapshot_failure(vid);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_snapshot_create(int vid)
{
    trigger([this, vid]
    {
        do_snapshot_action(vid, "SNAP_CREATE");
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_snapshot_revert(int vid)
{
    trigger([this, vid]
    {
        do_snapshot_action(vid, "SNAP_REVERT");
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_snapshot_delete(int vid)
{
    trigger([this, vid]
    {
        do_snapshot_action(vid, "SNAP_DELETE");
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::resize_command(VirtualMachine * vm,
                                     const VirtualMachineDisk * disk, ostream& xfr)
{
    string tm_mad;
    string tm_mad_system;
    string ds_id;

    if ( disk->is_volatile() )
    {
        tm_mad = vm->get_tm_mad();
        ds_id  = std::to_string(vm->get_ds_id());
    }
    else
    {
        tm_mad = disk->vector_value("TM_MAD");
        ds_id  = disk->vector_value("DATASTORE_ID");
    }

    const string& tsys = disk->vector_value("TM_MAD_SYSTEM");
    if (!tsys.empty())
    {
        tm_mad_system = "." + tsys;
    }

    //RESIZE.(tm_mad_system) tm_mad host:remote_system_dir/disk.i size vmid dsid
    xfr << "RESIZE" << tm_mad_system
        << " " << tm_mad << " "
        << vm->get_hostname() << ":"
        << vm->get_system_dir()<< "/disk."<< disk->vector_value("DISK_ID")<< " "
        << disk->vector_value("SIZE") << " "
        << vm->get_oid() << " "
        << ds_id
        << endl;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_resize(int vid)
{
    trigger([this, vid]
    {
        ostringstream os;

        ofstream xfr;
        string   xfr_name;

        unique_ptr<VirtualMachine> vm;
        VirtualMachineDisk * disk;

        Nebula& nd = Nebula::instance();

        auto tm_md = get();

        if (tm_md == nullptr)
        {
            goto error_driver;
        }

        vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        xfr_name = vm->get_transfer_file() + ".disk_resize";
        xfr.open(xfr_name.c_str(), ios::out | ios::trunc);

        if (xfr.fail() == true)
        {
            goto error_file;
        }

        disk = vm->get_resize_disk();

        if ( disk == nullptr )
        {
            goto error_disk;
        }

        resize_command(vm.get(), disk, xfr);

        xfr.close();

        vm.reset();

        {
            transfer_msg_t msg(TransferManagerMessages::TRANSFER, "", vid, xfr_name);
            tm_md->write(msg);
        }

        return;

error_driver:
        os << "disk_resize, error getting TM driver.";
        goto error_common;

error_history:
        os << "disk_resize, the VM has no history";
        goto error_common;

error_file:
        os << "disk_resize, could not open file: " << xfr_name;
        goto error_common;

error_disk:
        os << "disk_resize, could not find resize disk";
        goto error_common;

error_common:
        vm->log("TrM", Log::ERROR, os);

        nd.get_lcm()->trigger_disk_resize_failure(vid);

        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::trigger_restore(int vid, int img_id, int inc_id,
                                      int disk_id)
{
    trigger([this, vid, img_id, inc_id, disk_id]
    {
        ostringstream oss;

        ofstream xfr;
        string   xfr_name;

        auto tm_md = get();

        Nebula& nd = Nebula::instance();

        unique_ptr<VirtualMachine> vm;

        if (tm_md == nullptr)
        {
            goto error_driver;
        }

        vm = vmpool->get(vid);

        if (!vm)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        xfr_name = vm->get_transfer_file() + ".restore";
        xfr.open(xfr_name.c_str(), ios::out | ios::trunc);

        if (xfr.fail() == true)
        {
            goto error_file;
        }

        //RESTORE tm_mad host:remote_dir vm_id img_id inc_id disk_id
        xfr << "RESTORE" << " "
            << vm->get_tm_mad() << " "
            << vm->get_hostname() << ":" << vm->get_system_dir() << " "
            << vid << " "
            << img_id << " "
            << inc_id << " "
            << disk_id << " "
            << endl;

        xfr.close();

        {
            transfer_msg_t msg(TransferManagerMessages::TRANSFER, "", vid, xfr_name);
            tm_md->write(msg);
        }

        return;

error_driver:
        oss << "restore, error getting TM driver.";
        goto error_common;

error_history:
        oss << "restore, the VM has no history";
        goto error_common;

error_file:
        oss << "restore, could not open file: " << xfr_name;
        goto error_common;

error_common:
        vm->log("TrM", Log::ERROR, oss);

        nd.get_lcm()->trigger_disk_restore_failure(vm->get_oid());

        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int TransferManager::backup_transfer_commands(
        VirtualMachine *        vm,
        ostream&                xfr)
{
    // -------------------------------------------------------------------------
    // Setup & Transfer script
    // -------------------------------------------------------------------------
    VirtualMachineDisks& disks = vm->get_disks();

    if (!vm->hasHistory())
    {
        return -1;
    }

    string vm_tm_mad = vm->get_tm_mad();
    string tm_mad_system;

    /*string tsys = disk->vector_value("TM_MAD_SYSTEM");
    if (!tsys.empty())
    {
        tm_mad_system = "." + tsys;
    }*/

    Backups& backups = vm->backups();

    bool do_volatile = backups.do_volatile();
    int  job_id      = backups.backup_job_id();

    // -------------------------------------------------------------------------
    // Image Transfer Commands
    // -------------------------------------------------------------------------
    std::vector<int> disk_ids;

    disks.backup_disk_ids(do_volatile, disk_ids);

    //BACKUP(.tm_mad_system) tm_mad host:remote_dir DISK_ID:...:DISK_ID deploy_id bj_id vmid dsid
    xfr << "BACKUP" << tm_mad_system
        << " " << vm_tm_mad << " "
        << vm->get_hostname() << ":" << vm->get_system_dir() << " "
        << one_util::join(disk_ids, ':') << " "
        << vm->get_deploy_id() << " ";

    if ( job_id == -1 )
    {
        xfr << "- ";
    }
    else
    {
        xfr << job_id << " ";
    }

    xfr << vm->get_oid() << " "
        << vm->get_ds_id()
        << endl;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int TransferManager::backup_cancel_transfer_commands(
        VirtualMachine *        vm,
        ostream&                xfr)
{
    if (!vm->hasHistory())
    {
        return -1;
    }

    string tm_mad_system;
    /*
    string tsys = disk->vector_value("TM_MAD_SYSTEM");
    if (!tsys.empty())
    {
        tm_mad_system = "." + tsys;
    }
    */

    //BACKUPCANCEL(.tm_mad_system) tm_mad host:remote_dir deploy_id
    xfr << "BACKUPCANCEL" << tm_mad_system
        << " " << vm->get_tm_mad() << " "
        << vm->get_hostname() << ":" << vm->get_system_dir() << " "
        << vm->get_deploy_id()
        << endl;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/* ************************************************************************** */
/* MAD Loading                                                                */
/* ************************************************************************** */

int TransferManager::load_drivers(const std::vector<const VectorAttribute*>& _mads)
{
    const VectorAttribute * vattr = nullptr;

    NebulaLog::info("TrM", "Loading Transfer Manager driver.");

    if ( _mads.size() > 0 )
    {
        vattr = _mads[0];
    }

    if ( vattr == nullptr )
    {
        NebulaLog::log("TrM", Log::ERROR, "Failed to load Transfer Manager driver.");
        return -1;
    }

    VectorAttribute tm_conf("TM_MAD", vattr->value());

    tm_conf.replace("NAME", transfer_driver_name);

    if ( load_driver(&tm_conf) != 0 )
    {
        NebulaLog::error("TrM", "Unable to load Transfer Manager driver");
        return -1;
    }

    NebulaLog::info("TrM", "\tTransfer manager driver loaded");

    return 0;
}
