/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#include "BackupJob.h"
#include "OneDB.h"
#include "NebulaUtil.h"
#include "Nebula.h"
#include "ScheduledActionPool.h"
#include "VirtualMachinePool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
const int BackupJob::MAX_PRIO = 99;

const int BackupJob::MIN_PRIO = 0;

const int BackupJob::MAX_USER_PRIO = 49;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

BackupJob::BackupJob(int          uid,
              int                 gid,
              const std::string&  uname,
              const std::string&  gname,
              int                 umask,
              std::unique_ptr<Template> templ)
    : PoolObjectSQL(-1, BACKUPJOB, "", uid, gid, uname, gname, one_db::backup_job_table),
      _priority(50),
      _sched_actions("SCHED_ACTIONS"),
      _updated("UPDATED_VMS"),
      _outdated("OUTDATED_VMS"),
      _backing_up("BACKING_UP_VMS"),
      _error("ERROR_VMS"),
      _last_time(0),
      _last_duration(0)
{
    if (templ)
    {
        obj_template = move(templ);
    }
    else
    {
        obj_template = get_new_template();
    }

    set_umask(umask);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int BackupJob::bootstrap(SqlDB * db)
{
    std::ostringstream oss(one_db::backup_job_db_bootstrap);

    return db->exec_local_wr(oss);
}

/* -------------------------------------------------------------------------- */

int BackupJob::update(SqlDB * db)
{
    std::string tmp;
    return insert_replace(db, true, tmp);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int BackupJob::insert(SqlDB *db, std::string& error_str)
{
    erase_template_attribute("NAME", name);

    if (parse(error_str) != 0)
    {
        return -1;
    }

    return insert_replace(db, false, error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int BackupJob::insert_replace(SqlDB *db, bool replace, std::string& error_str)
{
    ostringstream   oss;

    string xml_body;
    char * sql_name;
    char * sql_xml;

    int    rc;

    sql_name = db->escape_str(name);

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    sql_xml = db->escape_str(to_xml(xml_body));

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

    oss << " INTO " << one_db::backup_job_table
        << " (" << one_db::backup_job_db_names << ") VALUES ("
        <<         oid              << ","
        << "'" <<  sql_name         << "',"
        << "'" <<  sql_xml          << "',"
        <<         uid              << ","
        <<         gid              << ","
        <<         owner_u          << ","
        <<         group_u          << ","
        <<         other_u          << ","
        <<         _priority        << ","
        <<         _outdated.size() << ")";

    rc = db->exec_wr(oss);

    db->free_str(sql_xml);

    db->free_str(sql_name);

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the Backup Job to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    error_str = "Cannot escape Backup Job body";
    goto error_common;

error_name:
    error_str = "Cannot escape Backup Job name";
    goto error_common;

error_common:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::string& BackupJob::to_xml_extended(std::string& xml, bool do_sa) const
{
    ostringstream oss;

    string lock_str, perms_xml, template_xml, tmp_xml;

    string sas_xml;

    if ( do_sa )
    {
        ScheduledActionPool * sa_pool = Nebula::instance().get_sapool();

        sa_pool->dump(_sched_actions.get_collection(), sas_xml);
    }

    oss <<
        "<BACKUPJOB>" <<
            "<ID>"       << oid       << "</ID>"       <<
            "<UID>"      << uid       << "</UID>"      <<
            "<GID>"      << gid       << "</GID>"      <<
            "<UNAME>"    << uname     << "</UNAME>"    <<
            "<GNAME>"    << gname     << "</GNAME>"    <<
            "<NAME>"     << name      << "</NAME>"     <<
            lock_db_to_xml(lock_str)  <<
            perms_to_xml(perms_xml)   <<
            "<PRIORITY>" << _priority << "</PRIORITY>" <<
            "<LAST_BACKUP_TIME>"     << _last_time     << "</LAST_BACKUP_TIME>" <<
            "<LAST_BACKUP_DURATION>" << _last_duration << "</LAST_BACKUP_DURATION>" <<
            _sched_actions.to_xml(tmp_xml) <<
            _updated.to_xml(tmp_xml)  <<
            _outdated.to_xml(tmp_xml) <<
            _backing_up.to_xml(tmp_xml) <<
            _error.to_xml(tmp_xml)    <<
            obj_template->to_xml(template_xml, sas_xml) <<
        "</BACKUPJOB>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */

int BackupJob::from_xml(const std::string &xml_str)
{
    vector<xmlNodePtr> content;

    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml_str);

    rc += xpath(oid,  "/BACKUPJOB/ID", -1);
    rc += xpath(name, "/BACKUPJOB/NAME", "");

    rc += xpath(uid, "/BACKUPJOB/UID", -1);
    rc += xpath(gid, "/BACKUPJOB/GID", -1);

    rc += xpath(uname, "/BACKUPJOB/UNAME", "not_found");
    rc += xpath(gname, "/BACKUPJOB/GNAME", "not_found");

    rc += xpath(_priority, "/BACKUPJOB/PRIORITY", 50);
    rc += xpath(_last_time, "/BACKUPJOB/LAST_BACKUP_TIME", (time_t) 0);
    rc += xpath(_last_duration, "/BACKUPJOB/LAST_BACKUP_DURATION", (time_t) 0);

    rc += lock_db_from_xml();
    rc += perms_from_xml();

    ObjectXML::get_nodes("/BACKUPJOB/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    _sched_actions.from_xml(this, "/BACKUPJOB/");

    _updated.from_xml(this, "/BACKUPJOB/");

    _outdated.from_xml(this, "/BACKUPJOB/");

    _backing_up.from_xml(this, "/BACKUPJOB/");

    _error.from_xml(this, "/BACKUPJOB/");

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int BackupJob::execute(string& error)
{
    if ( _backing_up.size() > 0 || _outdated.size() > 0 )
    {
        error = "Unable to execute Backup Job, pending backups in progress";
        return -1;
    }

    string sattr;

    std::vector<unsigned int> vms;

    _error.clear();

    _updated.clear();

    if (!get_template_attribute("BACKUP_VMS", sattr))
    {
        error = "Wrong BACKUP_VMS attribute or not defined";
        return -1;
    }

    one_util::split(sattr, ',', vms);

    _outdated.add(vms);

    _last_time = time(0);

    clear_template_error_message();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void BackupJob::cancel()
{
    _outdated.clear();

    _backing_up.clear();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void BackupJob::retry()
{
    _outdated.add(_error.get_collection());

    _error.clear();

    clear_template_error_message();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

BackupJob::Execution BackupJob::exec_mode() const
{
    string exec_s;

    obj_template->get("EXECUTION", exec_s);

    return str_to_execution(exec_s);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int BackupJob::ds_id() const
{
    int id;
    if (!obj_template->get("DATASTORE_ID", id))
    {
        return -1;
    }

    return id;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int BackupJob::reset() const
{
    bool r;
    obj_template->get("RESET", r);

    return r;
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void BackupJob::backup_started(int vm_id)
{
    _outdated.del(vm_id);

    _backing_up.add(vm_id);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void BackupJob::remove_vm(int vm_id)
{
    _outdated.del(vm_id);

    string sattr;
    if (!get_template_attribute("BACKUP_VMS", sattr))
    {
        return;
    }

    vector<unsigned int> vms;
    one_util::split(sattr, ',', vms);

    vms.erase(remove(vms.begin(), vms.end(), vm_id)
              , vms.end());

    sattr = one_util::join(vms, ',');
    replace_template_attribute("BACKUP_VMS", sattr);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void BackupJob::backup_finished(int vm_id, bool success)
{
    _backing_up.del(vm_id);

    if (success)
    {
        _updated.add(vm_id);
    }
    else
    {
        _error.add(vm_id);
    }

    _last_duration = time(0) - _last_time;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void BackupJob::add_error(int vm_id)
{
    _outdated.del(vm_id);

    _error.add(vm_id);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void BackupJob::get_backup_config(Template &tmpl)
{
    /* ---------------------------------------------------------------------- */
    /* CONFIGURATION ATTRIBUTES                                               */
    /*  - KEEP_LAST                                                           */
    /*  - BACKUP_VOLATILE                                                     */
    /*  - FS_FREEZE                                                           */
    /*  - MODE                                                                */
    /* ---------------------------------------------------------------------- */
    static vector<string> CONFIG_ATTRIBUTES = { "KEEP_LAST", "BACKUP_VOLATILE",
        "FS_FREEZE", "MODE"};

    string tmp_str;
    VectorAttribute* va = new VectorAttribute("BACKUP_CONFIG");

    for (const string& att : CONFIG_ATTRIBUTES)
    {
        if (get_template_attribute(att, tmp_str))
        {
            va->replace(att, tmp_str);
        }
    }

    tmpl.set(va);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int BackupJob::replace_template(
        const string&   tmpl_str,
        bool            keep_restricted,
        string&         error)
{
    auto new_tmpl = make_unique<VirtualMachineTemplate>(false,'=',"USER_TEMPLATE");
    string new_str, backup_vms;

    if ( new_tmpl->parse_str_or_xml(tmpl_str, error) != 0 )
    {
        return -1;
    }

    // Store old BACKUP_VMS value, to detect changes in post_update_template
    get_template_attribute("BACKUP_VMS", backup_vms);

    new_tmpl->replace("BACKUP_VMS_OLD", backup_vms);

    new_tmpl->to_xml(new_str);

    return PoolObjectSQL::replace_template(new_str, keep_restricted, error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int BackupJob::append_template(
        const string&   tmpl_str,
        bool            keep_restricted,
        string&         error)
{
    auto new_tmpl = make_unique<VirtualMachineTemplate>(false,'=',"USER_TEMPLATE");
    string new_str, backup_vms;

    if ( new_tmpl->parse_str_or_xml(tmpl_str, error) != 0 )
    {
        return -1;
    }

    // Store old BACKUP_VMS value, to detect changes in post_update_template
    get_template_attribute("BACKUP_VMS", backup_vms);

    new_tmpl->replace("BACKUP_VMS_OLD", backup_vms);

    new_tmpl->to_xml(new_str);

    return PoolObjectSQL::append_template(new_str, keep_restricted, error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int BackupJob::parse(string& error)
{
    string sattr;
    int    iattr;
    bool   battr;

    // -------------------------------------------------------------------------
    // Parse Backup Jobs attributes
    //  - KEEP_LAST
    //  - BACKUP_VOLATILE
    //  - FSFREEZE
    //  - MODE
    //  - EXECUTION
    //  - PRIORITY
    // -------------------------------------------------------------------------
    if ( erase_template_attribute("KEEP_LAST", iattr) == 0 || iattr < 0 )
    {
        iattr = 0;
    }

    add_template_attribute("KEEP_LAST", iattr);

    if ( erase_template_attribute("BACKUP_VOLATILE", battr) == 0 )
    {
        battr = false;
    }

    add_template_attribute("BACKUP_VOLATILE", battr);

    if ( erase_template_attribute("FS_FREEZE", sattr) == 0 || sattr.empty() )
    {
        sattr = "NONE";
    }
    else
    {
        one_util::toupper(sattr);

        if ((sattr != "NONE") && (sattr != "AGENT") && (sattr != "SUSPEND"))
        {
            sattr = "NONE";
        }
    }

    add_template_attribute("FS_FREEZE", sattr);

    if ( erase_template_attribute("MODE", sattr) == 0 || sattr.empty() )
    {
        sattr = "FULL";
    }
    else
    {
        one_util::toupper(sattr);

        if ((sattr != "FULL") && (sattr != "INCREMENT"))
        {
            sattr = "FULL";
        }
    }

    add_template_attribute("MODE", sattr);

    erase_template_attribute("EXECUTION", sattr);

    Execution exec = str_to_execution(sattr);

    add_template_attribute("EXECUTION", execution_to_str(exec));

    if ( erase_template_attribute("PRIORITY", iattr) > 0 &&
         iattr >= MIN_PRIO && iattr <= MAX_PRIO )
    {
        _priority = iattr;
    }

    // -------------------------------------------------------------------------
    // VMs part of this backup job. Order represents backup order.
    // -------------------------------------------------------------------------
    std::vector<unsigned int> vms;

    if ( erase_template_attribute("BACKUP_VMS", sattr) != 0 )
    {
        one_util::split(sattr, ',', vms);

        auto last = std::unique(vms.begin(), vms.end());

        vms.erase(last, vms.end());

        sattr = one_util::join(vms, ',');
    }
    else
    {
        sattr = "";
    }

    add_template_attribute("BACKUP_VMS", sattr);

    string sattr_old;

    erase_template_attribute("BACKUP_VMS_OLD", sattr_old);

    if (process_backup_vms(sattr, sattr_old, error) != 0)
    {
        return -1;
    }

    // -------------------------------------------------------------------------
    // Update collections if VMs are no longer in BACKUP_VM
    // -------------------------------------------------------------------------

    ObjectCollection base("BASE", vms);

    _updated.del_not_present(base);

    _outdated.del_not_present(base);

    _backing_up.del_not_present(base);

    _error.del_not_present(base);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int BackupJob::process_backup_vms(const std::string& vms_new_str,
                                  const std::string& vms_old_str,
                                        std::string& error)
{
    set<unsigned int> vms_old;
    set<unsigned int> vms_new;
    set<unsigned int> vms_added;
    set<unsigned int> vms_deleted;

    auto bjid     = get_oid();
    bool is_error = false;

    auto vmpool = Nebula::instance().get_vmpool();

    one_util::split_unique(vms_new_str, ',', vms_new);
    one_util::split_unique(vms_old_str, ',', vms_old);

    set_difference(vms_new.begin(), vms_new.end(),
                   vms_old.begin(), vms_old.end(),
                   inserter(vms_added, vms_added.begin()));
    set_difference(vms_old.begin(), vms_old.end(),
                   vms_new.begin(), vms_new.end(),
                   inserter(vms_deleted, vms_deleted.begin()));

    // Add Backup Job ID to added VMs
    for (auto vmid : vms_added)
    {
        auto vm = vmpool->get(vmid);

        if (!vm)
        {
            continue;
        }

        auto& backups = vm->backups();

        if (backups.backup_job_id() != -1 &&
            backups.backup_job_id() != bjid)
        {
            ostringstream oss;

            is_error = true;

            oss << "Unable to add VM " << vmid << " to Backup Job "
                << bjid << ". It's already in Backup Job " << backups.backup_job_id();

            error = oss.str();

            break;
        }

        backups.backup_job_id(bjid);

        vmpool->update(vm.get());
    }

    if (is_error)
    {
        // Revert Backup Job ID from added VMs
        for (auto vmid : vms_added)
        {
            auto vm = vmpool->get(vmid);

            if (!vm || vm->backups().backup_job_id() != bjid)
            {
                continue;
            }

            vm->backups().remove_backup_job_id();

            vmpool->update(vm.get());
        }

        return -1;
    }

    // Remove Backup Job ID from removed VMs
    remove_id_from_vms(vms_deleted);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void BackupJob::remove_id_from_vms()
{
    string sattr;
    set<unsigned int> vms;

    get_template_attribute("BACKUP_VMS", sattr);
    one_util::split_unique(sattr, ',', vms);

    remove_id_from_vms(vms);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void BackupJob::remove_id_from_vms(const set<unsigned int>& vms)
{
    auto vmpool = Nebula::instance().get_vmpool();

    auto bjid = get_oid();

    // Remove Backup Job ID from VMs
    for (auto vmid : vms)
    {
        auto vm = vmpool->get(vmid);

        if (!vm || vm->backups().backup_job_id() != bjid)
        {
            continue;
        }

        auto& backups = vm->backups();
        backups.remove_backup_job_id();

        if (backups.mode() == Backups::INCREMENT)
        {
            backups.incremental_backup_id(-1);
            backups.last_increment_id(-1);
        }

        vmpool->update(vm.get());
    }
}
