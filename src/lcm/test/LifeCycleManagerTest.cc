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

#include "OneUnitTest.h"
#include "Nebula.h"
#include "DummyManager.h"
#include "NebulaTestLCM.h"

using namespace std;

const int uids[] = {123, 261, 123};
const int gids[] = {150, 164, 175};

const char* unames[] = {"one", "two", "three"};
const char* gnames[] = {"oneadmin", "oneadmin", "users"};

const string names[] = {"VM one", "Second VM", "VM 3"};

const string templates[] =
{
    "NAME   = \"VM one\"\n"
    "MEMORY = 128\n"
    "CPU    = 1",

    "NAME   = \"Second VM\"\n"
    "MEMORY = 256\n"
    "CPU    = 2",

    "NAME   = \"VM 3\"\n"
    "MEMORY = 1024\n"
    "CPU    = 1"
};

static int     hid = 123;
static string  hostname    = "test_hostname";
static string  vmm_mad     = "vmm_mad";
static string  vnm_mad     = "vnm_mad";

class LifeCycleManagerTest : public OneUnitTest
{

    CPPUNIT_TEST_SUITE (LifeCycleManagerTest);

    CPPUNIT_TEST ( lcm_init_to_prolog );
    CPPUNIT_TEST ( lcm_init_to_prolog_resume );

    CPPUNIT_TEST ( prolog_to_boot );
    CPPUNIT_TEST ( prolog_to_failed );
    CPPUNIT_TEST ( prolog_to_pending );

    CPPUNIT_TEST ( prolog_resume_to_boot );
    CPPUNIT_TEST ( prolog_resume_to_failed );
    CPPUNIT_TEST ( prolog_resume_to_pending );

    CPPUNIT_TEST ( boot_to_running );
    CPPUNIT_TEST ( boot_to_failed );
    CPPUNIT_TEST ( boot_to_pending );

    CPPUNIT_TEST ( running_to_save_migrate );
    CPPUNIT_TEST ( running_to_save_stop );
    CPPUNIT_TEST ( running_to_shutdown );
    CPPUNIT_TEST ( running_to_save_suspend );
    CPPUNIT_TEST ( running_to_migrate );
    CPPUNIT_TEST ( running_to_cancel );
    CPPUNIT_TEST ( running_to_pending );

    CPPUNIT_TEST ( save_migrate_to_prolog_migrate );
    CPPUNIT_TEST ( save_migrate_to_running );
    CPPUNIT_TEST ( save_migrate_to_pending );

    CPPUNIT_TEST ( prolog_migrate_to_boot );
    CPPUNIT_TEST ( prolog_migrate_to_failed );
    CPPUNIT_TEST ( prolog_migrate_to_pending );

    CPPUNIT_TEST ( cancel_to_done );
    CPPUNIT_TEST ( cancel_to_running );
    CPPUNIT_TEST ( cancel_to_pending );

    CPPUNIT_TEST ( migrate_to_running );
    CPPUNIT_TEST ( migrate_to_failed );
    CPPUNIT_TEST ( migrate_to_pending );

    CPPUNIT_TEST ( save_suspend_to_suspended );
    CPPUNIT_TEST ( save_suspend_to_running );
    CPPUNIT_TEST ( save_suspend_to_pending );

    CPPUNIT_TEST ( shutdown_to_epilog );
    CPPUNIT_TEST ( shutdown_to_running );
    CPPUNIT_TEST ( shutdown_to_pending );

    CPPUNIT_TEST ( save_stop_to_epilog_stop );
    CPPUNIT_TEST ( save_stop_to_running );
    CPPUNIT_TEST ( save_stop_to_pending );

    CPPUNIT_TEST ( epilog_to_done );
    CPPUNIT_TEST ( epilog_to_failed );
    CPPUNIT_TEST ( epilog_to_pending );

    CPPUNIT_TEST ( epilog_stop_to_stop );
    CPPUNIT_TEST ( epilog_stop_to_failed );
    CPPUNIT_TEST ( epilog_stop_to_pending );

    CPPUNIT_TEST_SUITE_END ();

private:

    VirtualMachine *            vm;
    VirtualMachinePool *        vmpool;
    HostPool *                  hpool;

    LifeCycleManager *          lcm;
    VirtualMachineManagerTest * vmm;
    TransferManagerTest *       tm;
    DispatchManager *           dm;

    NebulaTestLCM *                tester;

    int     oid;
    int     rc;

    vector<LifeCycleManager::Actions> tm_actions;
    vector<LifeCycleManager::Actions> vmm_actions;

    /**
     *  Wait until the VM changes to the specified state.
     *  There is a time-out of 30 seconds.
     */
    void wait_assert(VirtualMachine*        vm,
                   VirtualMachine::VmState  state,
                   VirtualMachine::LcmState lcm_state = VirtualMachine::RUNNING)
    {
        int n_steps = 1000;
        int step    = 30000;

        int i = 0;

        while( !(
            (
                vm->get_state() == state
                &&
                (
                    state != VirtualMachine::ACTIVE
                    ||
                    vm->get_lcm_state() == lcm_state
                )
            )
            ||
            i > n_steps ))
        {
            usleep(step);
            i++;
        }

        CPPUNIT_ASSERT( vm->get_state()     == state );

        if( state == VirtualMachine::ACTIVE)
        {
            CPPUNIT_ASSERT( vm->get_lcm_state() == lcm_state );
        }
    }

    /**
     *  Allocates the indexth VM template
     */
    int allocate(int index)
    {
        VirtualMachineTemplate * vm_template;
        int             oid;
        char *          error_msg = 0;
        int             rc;
        string          err;

        vm_template = new VirtualMachineTemplate;
        rc = vm_template->parse(templates[index],&error_msg);

        if( rc == 0 )
        {
            string uname = unames[index];
            string gname = gnames[index];

            return vmpool->allocate(uids[index], 
                                    gids[index], 
                                    uname,
                                    gname,
                                    vm_template, 
                                    &oid,
                                    err, 
                                    false);
        }
        else
        {
            return -1;
        }
    };

    /**
     *  Allocates a VM and sets it to pending state, creaing a history entry.
     *  The VM returned is locked
     */
    VirtualMachine* allocate_pending(int index)
    {
        oid = allocate(index);

        CPPUNIT_ASSERT(oid >= 0);

        vm = vmpool->get(oid,true);
        vm->unlock();

        CPPUNIT_ASSERT( vm != 0 );
        CPPUNIT_ASSERT( vm->get_state() == VirtualMachine::PENDING );

        vm->lock();

        vm->add_history(hid,hostname,vmm_mad,vnm_mad);
        rc = vmpool->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );

        vmpool->update(vm); //Insert last_seq in the DB

        return vm;
    }

    /**
     *  Allocates a VM and sets it to running state.
     *  The VM returned is unlocked
     */
    VirtualMachine* allocate_running(int index)
    {
        vm = allocate_pending(index);

        tm_actions.push_back(LifeCycleManager::PROLOG_SUCCESS);
        tm->set_actions(tm_actions);

        vmm_actions.push_back(LifeCycleManager::DEPLOY_SUCCESS);
        vmm->set_actions(vmm_actions);

        rc = dm->deploy(vm);
        vm->unlock();

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::RUNNING);

        tm->clear_actions();
        vmm->clear_actions();

        tm_actions.clear();
        vmm_actions.clear();

        return vm;
    }

public:

    void setUp()
    {
        // Create var dir.
        string command = "mkdir -p var";
        std::system(command.c_str());

        create_db();

        tester = new NebulaTestLCM();

        Nebula& neb = Nebula::instance();
        neb.start();

        lcm     = neb.get_lcm();

        vmpool  = neb.get_vmpool();
        hpool   = neb.get_hpool();

        vmm     = static_cast<VirtualMachineManagerTest*>(neb.get_vmm());
        tm      = static_cast<TransferManagerTest*>(neb.get_tm());
        dm      = neb.get_dm();
    }

    void tearDown()
    {
        tm_actions.clear();
        vmm_actions.clear();

        // -----------------------------------------------------------
        // Stop the managers & free resources
        // -----------------------------------------------------------

        vmm->trigger(VirtualMachineManager::FINALIZE,0);
        lcm->trigger(LifeCycleManager::FINALIZE,0);

        tm->trigger(TransferManager::FINALIZE,0);
        dm->trigger(DispatchManager::FINALIZE,0);

        //sleep to wait drivers???
        pthread_join(vmm->get_thread_id(),0);
        pthread_join(lcm->get_thread_id(),0);
        pthread_join(tm->get_thread_id(),0);
        pthread_join(dm->get_thread_id(),0);

        //XML Library
        xmlCleanupParser();

        delete_db();

        // Clean var dir.
        string command = "rm -r var";
        std::system(command.c_str());

        delete tester;
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void lcm_init_to_prolog()
    {
        vm = allocate_pending(0);

        rc = dm->deploy(vm);
        vm->unlock();

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::PROLOG );
    }

/* -------------------------------------------------------------------------- */

    void lcm_init_to_prolog_resume()
    {
        vm = allocate_pending(0);
        vm->set_reason(History::STOP_RESUME);
        vm->cp_history();

        rc = dm->deploy(vm);
        vm->unlock();

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::PROLOG_RESUME );
    }

/* -------------------------------------------------------------------------- */

    void prolog_to_boot()
    {
        vm = allocate_pending(0);

        tm_actions.push_back(LifeCycleManager::PROLOG_SUCCESS);
        tm->set_actions(tm_actions);

        rc = dm->deploy(vm);
        vm->unlock();

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::BOOT );
    }

/* -------------------------------------------------------------------------- */

    void prolog_to_failed()
    {
        vm = allocate_pending(0);

        tm_actions.push_back(LifeCycleManager::PROLOG_FAILURE);
        tm->set_actions(tm_actions);

        rc = dm->deploy(vm);
        vm->unlock();

        wait_assert(vm, VirtualMachine::FAILED );
    }

/* -------------------------------------------------------------------------- */

    void prolog_to_pending()
    {
        vm = allocate_pending(0);
        vm->unlock();

        rc = dm->resubmit(vm->get_oid());
        wait_assert(vm, VirtualMachine::PENDING);
    }

/* -------------------------------------------------------------------------- */

    void prolog_resume_to_boot()
    {
        vm = allocate_pending(0);
        vm->set_reason(History::STOP_RESUME);
        vm->cp_history();

        tm_actions.push_back(LifeCycleManager::PROLOG_SUCCESS);
        tm->set_actions(tm_actions);

        rc = dm->deploy(vm);
        vm->unlock();

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::BOOT );
    }

/* -------------------------------------------------------------------------- */

    void prolog_resume_to_failed()
    {
        vm = allocate_pending(0);
        vm->set_reason(History::STOP_RESUME);
        vm->cp_history();

        tm_actions.push_back(LifeCycleManager::PROLOG_FAILURE);
        tm->set_actions(tm_actions);

        rc = dm->deploy(vm);
        vm->unlock();

        wait_assert(vm, VirtualMachine::FAILED );
    }

/* -------------------------------------------------------------------------- */

    void prolog_resume_to_pending()
    {
        vm = allocate_pending(0);
        vm->set_reason(History::STOP_RESUME);
        vm->cp_history();

        rc = dm->deploy(vm);
        vm->unlock();

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::PROLOG_RESUME );

        rc = dm->resubmit(vm->get_oid());
        wait_assert(vm, VirtualMachine::PENDING);
    }

/* -------------------------------------------------------------------------- */

    void boot_to_running()
    {
        allocate_running(0);
    }

/* -------------------------------------------------------------------------- */

    void boot_to_failed()
    {
        vm = allocate_pending(0);

        tm_actions.push_back(LifeCycleManager::PROLOG_SUCCESS);
        tm->set_actions(tm_actions);

        vmm_actions.push_back(LifeCycleManager::DEPLOY_FAILURE);
        vmm->set_actions(vmm_actions);

        rc = dm->deploy(vm);
        vm->unlock();

        wait_assert(vm, VirtualMachine::FAILED );
    }

/* -------------------------------------------------------------------------- */

    void boot_to_pending()
    {
        vm = allocate_pending(0);

        tm_actions.push_back(LifeCycleManager::PROLOG_SUCCESS);
        tm->set_actions(tm_actions);

        rc = dm->deploy(vm);
        vm->unlock();

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::BOOT );

        rc = dm->resubmit(vm->get_oid());
        CPPUNIT_ASSERT( rc == 0 );
        wait_assert(vm, VirtualMachine::PENDING);
    }

/* -------------------------------------------------------------------------- */

    void running_to_save_migrate()
    {
        vm = allocate_running(0);

        vm->add_history(hid,hostname,vmm_mad,vnm_mad);

        rc = vmpool->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );

        vmpool->update(vm); //Insert last_seq in the DB

        dm->migrate(vm);

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::SAVE_MIGRATE );
    }

/* -------------------------------------------------------------------------- */

    void running_to_save_stop()
    {
        vm = allocate_running(0);

        dm->stop(vm->get_oid());

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::SAVE_STOP );
    }

/* -------------------------------------------------------------------------- */

    void running_to_shutdown()
    {
        vm = allocate_running(0);

        dm->shutdown(vm->get_oid());

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::SHUTDOWN );
    }

/* -------------------------------------------------------------------------- */

    void running_to_save_suspend()
    {
        vm = allocate_running(0);

        dm->suspend(vm->get_oid());

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::SAVE_SUSPEND );
    }

/* -------------------------------------------------------------------------- */

    void running_to_migrate()
    {
        vm = allocate_running(0);

        dm->live_migrate(vm);

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::MIGRATE );
    }

/* -------------------------------------------------------------------------- */

    void running_to_cancel()
    {
        vm = allocate_running(0);

        dm->cancel(vm->get_oid());

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::CANCEL );
    }

/* -------------------------------------------------------------------------- */

    void running_to_pending()
    {
        vm = allocate_running(0);

        rc = dm->resubmit(vm->get_oid());
        CPPUNIT_ASSERT( rc == 0 );
        wait_assert(vm, VirtualMachine::PENDING);
    }

/* -------------------------------------------------------------------------- */

    void save_migrate_to_prolog_migrate()
    {
        vm = allocate_running(0);

        vm->add_history(hid,hostname,vmm_mad,vnm_mad);

        rc = vmpool->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );

        vmpool->update(vm); //Insert last_seq in the DB

        vmm_actions.push_back(LifeCycleManager::SAVE_SUCCESS);
        vmm->set_actions(vmm_actions);

        dm->migrate(vm);

        wait_assert(vm, VirtualMachine::ACTIVE,VirtualMachine::PROLOG_MIGRATE );
    }

/* -------------------------------------------------------------------------- */

    void save_migrate_to_running()
    {
        vm = allocate_running(0);

        vm->add_history(hid,hostname,vmm_mad,vnm_mad);

        rc = vmpool->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );

        vmpool->update(vm); //Insert last_seq in the DB

        vmm_actions.push_back(LifeCycleManager::SAVE_FAILURE);
        vmm->set_actions(vmm_actions);

        dm->migrate(vm);

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::RUNNING );
    }

/* -------------------------------------------------------------------------- */

    void save_migrate_to_pending()
    {
        vm = allocate_running(0);

        vm->add_history(hid,hostname,vmm_mad,vnm_mad);

        rc = vmpool->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );

        vmpool->update(vm); //Insert last_seq in the DB

        dm->migrate(vm);

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::SAVE_MIGRATE );

        rc = dm->resubmit(vm->get_oid());
        CPPUNIT_ASSERT( rc == 0 );
        wait_assert(vm, VirtualMachine::PENDING);
    }

/* -------------------------------------------------------------------------- */

    void prolog_migrate_to_boot()
    {
        vm = allocate_running(0);

        vm->add_history(hid,hostname,vmm_mad,vnm_mad);

        rc = vmpool->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );

        vmpool->update(vm); //Insert last_seq in the DB

        tm_actions.push_back(LifeCycleManager::PROLOG_SUCCESS);
        tm->set_actions(tm_actions);

        vmm_actions.push_back(LifeCycleManager::SAVE_SUCCESS);
        vmm->set_actions(vmm_actions);

        dm->migrate(vm);

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::BOOT );
    }

/* -------------------------------------------------------------------------- */

    void prolog_migrate_to_failed()
    {
        vm = allocate_running(0);

        vm->add_history(hid,hostname,vmm_mad,vnm_mad);

        rc = vmpool->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );

        vmpool->update(vm); //Insert last_seq in the DB

        tm_actions.push_back(LifeCycleManager::PROLOG_FAILURE);
        tm->set_actions(tm_actions);

        vmm_actions.push_back(LifeCycleManager::SAVE_SUCCESS);
        vmm->set_actions(vmm_actions);

        dm->migrate(vm);

        wait_assert(vm, VirtualMachine::FAILED);
    }

/* -------------------------------------------------------------------------- */

    void prolog_migrate_to_pending()
    {
        vm = allocate_running(0);

        vm->add_history(hid,hostname,vmm_mad,vnm_mad);

        rc = vmpool->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );

        vmpool->update(vm); //Insert last_seq in the DB

        vmm_actions.push_back(LifeCycleManager::SAVE_SUCCESS);
        vmm->set_actions(vmm_actions);

        dm->migrate(vm);

        wait_assert(vm, VirtualMachine::ACTIVE,VirtualMachine::PROLOG_MIGRATE );

        rc = dm->resubmit(vm->get_oid());
        wait_assert(vm, VirtualMachine::PENDING);
    }

/* -------------------------------------------------------------------------- */

    void cancel_to_done()
    {
        vm = allocate_running(0);

        vmm_actions.push_back(LifeCycleManager::CANCEL_SUCCESS);
        vmm->set_actions(vmm_actions);

        dm->cancel(vm->get_oid());

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::EPILOG );
    }

/* -------------------------------------------------------------------------- */

    void cancel_to_running()
    {
        vm = allocate_running(0);

        vmm_actions.push_back(LifeCycleManager::CANCEL_FAILURE);
        vmm->set_actions(vmm_actions);

        dm->cancel(vm->get_oid());

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::RUNNING );
    }

/* -------------------------------------------------------------------------- */

    void cancel_to_pending()
    {
        vm = allocate_running(0);
        dm->cancel(vm->get_oid());
        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::CANCEL );

        rc = dm->resubmit(vm->get_oid());
        wait_assert(vm, VirtualMachine::PENDING);
    }

/* -------------------------------------------------------------------------- */

    void migrate_to_running()
    {
        vm = allocate_running(0);

        vm->add_history(hid,hostname,vmm_mad,vnm_mad);
        rc = vmpool->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );

        vmpool->update(vm); //Insert last_seq in the DB

        CPPUNIT_ASSERT( vm->hasHistory() );
        CPPUNIT_ASSERT( vm->hasPreviousHistory() );

        vmm_actions.push_back(LifeCycleManager::DEPLOY_SUCCESS);
        vmm->set_actions(vmm_actions);

        dm->live_migrate(vm);

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::RUNNING );
    }

/* -------------------------------------------------------------------------- */

    void migrate_to_failed()
    {
        vm = allocate_running(0);

        vm->add_history(hid,hostname,vmm_mad,vnm_mad);
        rc = vmpool->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );

        vmpool->update(vm); //Insert last_seq in the DB

        CPPUNIT_ASSERT( vm->hasHistory() );
        CPPUNIT_ASSERT( vm->hasPreviousHistory() );

        vmm_actions.push_back(LifeCycleManager::DEPLOY_FAILURE);
        vmm->set_actions(vmm_actions);

        dm->live_migrate(vm);

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::RUNNING );
    }

/* -------------------------------------------------------------------------- */

    void migrate_to_pending()
    {
        vm = allocate_running(0);

        vm->add_history(hid,hostname,vmm_mad,vnm_mad);
        rc = vmpool->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );

        vmpool->update(vm); //Insert last_seq in the DB

        CPPUNIT_ASSERT( vm->hasHistory() );
        CPPUNIT_ASSERT( vm->hasPreviousHistory() );

        dm->live_migrate(vm);
        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::MIGRATE );

        rc = dm->resubmit(vm->get_oid());
        wait_assert(vm, VirtualMachine::PENDING);
    }

/* -------------------------------------------------------------------------- */

    void save_suspend_to_suspended()
    {
        vm = allocate_running(0);

        vmm_actions.push_back(LifeCycleManager::SAVE_SUCCESS);
        vmm->set_actions(vmm_actions);

        dm->suspend(vm->get_oid());

        wait_assert(vm, VirtualMachine::SUSPENDED);
    }

/* -------------------------------------------------------------------------- */

    void save_suspend_to_running()
    {
        vm = allocate_running(0);

        vmm_actions.push_back(LifeCycleManager::SAVE_FAILURE);
        vmm->set_actions(vmm_actions);

        dm->suspend(vm->get_oid());

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::RUNNING );
    }

/* -------------------------------------------------------------------------- */

    void save_suspend_to_pending()
    {
        vm = allocate_running(0);
        dm->suspend(vm->get_oid());
        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::SAVE_SUSPEND );

        rc = dm->resubmit(vm->get_oid());
        wait_assert(vm, VirtualMachine::PENDING);
    }

/* -------------------------------------------------------------------------- */

    void shutdown_to_epilog()
    {
        vm = allocate_running(0);

        vmm_actions.push_back(LifeCycleManager::SHUTDOWN_SUCCESS);
        vmm->set_actions(vmm_actions);

        dm->shutdown(vm->get_oid());

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::EPILOG );
    }

/* -------------------------------------------------------------------------- */

    void shutdown_to_running()
    {
        vm = allocate_running(0);

        vmm_actions.push_back(LifeCycleManager::SHUTDOWN_FAILURE);
        vmm->set_actions(vmm_actions);

        dm->shutdown(vm->get_oid());

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::RUNNING );
    }

/* -------------------------------------------------------------------------- */

    void shutdown_to_pending()
    {
        vm = allocate_running(0);
        dm->shutdown(vm->get_oid());
        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::SHUTDOWN );

        rc = dm->resubmit(vm->get_oid());
        wait_assert(vm, VirtualMachine::PENDING);
    }

/* -------------------------------------------------------------------------- */

    void save_stop_to_epilog_stop()
    {
        vm = allocate_running(0);

        vmm_actions.push_back(LifeCycleManager::SAVE_SUCCESS);
        vmm->set_actions(vmm_actions);

        dm->stop(vm->get_oid());

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::EPILOG_STOP );
    }

/* -------------------------------------------------------------------------- */

    void save_stop_to_running()
    {
        vm = allocate_running(0);

        vmm_actions.push_back(LifeCycleManager::SAVE_FAILURE);
        vmm->set_actions(vmm_actions);

        dm->stop(vm->get_oid());

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::RUNNING );
    }


/* -------------------------------------------------------------------------- */

    void save_stop_to_pending()
    {
        vm = allocate_running(0);
        dm->stop(vm->get_oid());
        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::SAVE_STOP );

        rc = dm->resubmit(vm->get_oid());
        wait_assert(vm, VirtualMachine::PENDING);
    }

/* -------------------------------------------------------------------------- */

    void epilog_to_done()
    {
        vm = allocate_running(0);

        vmm_actions.push_back(LifeCycleManager::SHUTDOWN_SUCCESS);
        vmm->set_actions(vmm_actions);

        tm_actions.push_back(LifeCycleManager::EPILOG_SUCCESS);
        tm->set_actions(tm_actions);

        dm->shutdown(vm->get_oid());

        wait_assert(vm, VirtualMachine::DONE );
    }

/* -------------------------------------------------------------------------- */

    void epilog_to_failed()
    {
        vm = allocate_running(0);

        vmm_actions.push_back(LifeCycleManager::SHUTDOWN_SUCCESS);
        vmm->set_actions(vmm_actions);

        tm_actions.push_back(LifeCycleManager::EPILOG_FAILURE);
        tm->set_actions(tm_actions);

        dm->shutdown(vm->get_oid());

        wait_assert(vm, VirtualMachine::FAILED );
    }

/* -------------------------------------------------------------------------- */

    void epilog_to_pending()
    {
        vm = allocate_running(0);

        vmm_actions.push_back(LifeCycleManager::SHUTDOWN_SUCCESS);
        vmm->set_actions(vmm_actions);

        dm->shutdown(vm->get_oid());

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::EPILOG );

        rc = dm->resubmit(vm->get_oid());
        wait_assert(vm, VirtualMachine::PENDING);
    }

/* -------------------------------------------------------------------------- */

    void epilog_stop_to_stop()
    {
        vm = allocate_running(0);

        vmm_actions.push_back(LifeCycleManager::SAVE_SUCCESS);
        vmm->set_actions(vmm_actions);

        tm_actions.push_back(LifeCycleManager::EPILOG_SUCCESS);
        tm->set_actions(tm_actions);

        dm->stop(vm->get_oid());

        wait_assert(vm, VirtualMachine::STOPPED );
    }

/* -------------------------------------------------------------------------- */

    void epilog_stop_to_failed()
    {
        vm = allocate_running(0);

        vmm_actions.push_back(LifeCycleManager::SAVE_SUCCESS);
        vmm->set_actions(vmm_actions);

        tm_actions.push_back(LifeCycleManager::EPILOG_FAILURE);
        tm->set_actions(tm_actions);

        dm->stop(vm->get_oid());

        wait_assert(vm, VirtualMachine::FAILED );
    }

/* -------------------------------------------------------------------------- */

    void epilog_stop_to_pending()
    {
        vm = allocate_running(0);

        vmm_actions.push_back(LifeCycleManager::SAVE_SUCCESS);
        vmm->set_actions(vmm_actions);

        dm->stop(vm->get_oid());

        wait_assert(vm, VirtualMachine::ACTIVE, VirtualMachine::EPILOG_STOP );

        rc = dm->resubmit(vm->get_oid());
        wait_assert(vm, VirtualMachine::PENDING);
    }

/* -------------------------------------------------------------------------- */

};

int main(int argc, char ** argv)
{
    OneUnitTest::set_one_auth();

    return OneUnitTest::main(argc, argv, LifeCycleManagerTest::suite());
}
