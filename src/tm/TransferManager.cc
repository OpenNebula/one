/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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
#include "Nebula.h"

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

    Nebula::log("TrM",Log::INFO,"Transfer Manager started.");
    
    tm->am.loop(0,0);

    Nebula::log("TrM",Log::INFO,"Transfer Manager stopped.");
    
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
    
    Nebula::log("TrM",Log::INFO,"Starting Transfer Manager...");

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
        
    case EPILOG:
        aname = "EPILOG";
        break;

    case EPILOG_STOP:
        aname = "EPILOG_STOP";
        break;
        
    case CHECKPOINT:
        aname = "CHECKPOINT";
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
    int vid;

    if (arg == 0)
    {
        return;
    }

    vid  = *(static_cast<int *>(arg));

    delete static_cast<int *>(arg);
    
    if (action == "PROLOG")
    {
        prolog_action(vid);
    }
    else if (action == "PROLOG_MIGR")
    {
        prolog_migr_action(vid);
    }
    else if (action == "PROLOG_RESUME")
    {
        prolog_resume_action(vid);
    }        
    else if (action == "EPILOG")
    {
        epilog_action(vid);
    }
    else if (action == "EPILOG_STOP")
    {
        epilog_stop_action(vid);
    }    
    else if (action == "CHECKPOINT")
    {
        checkpoint_action(vid);
    }
    else if (action == ACTION_FINALIZE)
    {
        Nebula::log("TrM",Log::INFO,"Stopping Transfer Manager...");
        
        MadManager::stop();
    }
    else
    {
        ostringstream oss;
        oss << "Unknown action name: " << action;
        
        Nebula::log("TrM", Log::ERROR, oss);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::prolog_action(int vid)
{
    ofstream        xfr;
    ostringstream   os;
    string          xfr_name;
    
    const VectorAttribute * disk;
    string          source;
    string          type;
    string          clon;
        
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
    
    tm_md = get(vm->get_uid(),vm->get_tm_mad());
    
    if ( tm_md == 0 )
    {
        goto error_driver;
    }
    
    xfr.open(vm->get_transfer_file().c_str(), ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }
        
    // ------------------------------------------------------------------------
    // Swap and image Commands
    // ------------------------------------------------------------------------

    num = vm->get_template_attribute("DISK",attrs);
    
    for (int i=0; i < num ;i++,source="",type="",clon="")
    {
        disk = dynamic_cast<const VectorAttribute *>(attrs[i]);
        
        if ( disk == 0 )
        {
            continue;
        }
        
        type   = disk->vector_value("TYPE");
                                
        if ( type.empty() == false)
        {
            transform(type.begin(),type.end(),type.begin(),(int(*)(int))toupper);
        }
        
        if ( type == "SWAP" )
        {
            string  size = disk->vector_value("SIZE");

            if (size.empty()==true)
            {
                size = "1";
            }
            
            xfr << "MKSWAP " << size << " " << vm->get_hostname() << ":"
                << vm->get_remote_dir() << "/disk." << i << endl;
        }
        else
        {
            source = disk->vector_value("SOURCE");
                            
            if ( source.empty() )
            {
                goto error_empty_disk;
            }
            
            clon = disk->vector_value("CLONE");
            
            if ( clon.empty() == true )
            {
                clon = "YES"; //Clone by default
            }
            else
            {
                transform(clon.begin(),clon.end(),clon.begin(),(int(*)(int))toupper);
            }
            
            if (clon == "YES")
            {
                xfr << "CLONE ";
            }
            else
            {
                xfr << "LN ";
            }
            
            if ( source.find(":") == string::npos ) //Regular file
            {
                xfr << nd.get_nebula_hostname() << ":" << source << " ";
            } 
            else //TM Plugin specific protocol
            {
                xfr << source << " ";
            }
            
            xfr << vm->get_hostname() << ":" << vm->get_remote_dir()
                << "/disk." << i << endl;
        }
    }

    // ------------------------------------------------------------------------
    // TODO: Context commands
    // ------------------------------------------------------------------------

    xfr.close();
    
    tm_md->transfer(vid,vm->get_transfer_file());
    
    vm->unlock();
    
    return;
    
error_history:
    os.str("");
    os << "prolog, VM " << vid << " has no history";
    goto error_common;
    
error_file:
    os.str("");
    os << "prolog, could not open file: " << vm->get_transfer_file();
    goto error_common;
    
error_driver:
    os.str("");
    os << "prolog, error getting driver " << vm->get_tm_mad();
    goto error_common;
    
error_empty_disk:
    os.str("");
    os << "prolog, undefined source disk image in VM template";
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
    
    tm_md = get(vm->get_uid(),vm->get_tm_mad());
    
    if ( tm_md == 0 )
    {
        goto error_driver;
    }
    
    xfr.open(vm->get_transfer_file().c_str(), ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }
        
    // ------------------------------------------------------------------------
    // Move image directory
    // ------------------------------------------------------------------------

    xfr << "MV ";
    xfr << vm->get_previous_hostname() << ":" << vm->get_remote_dir() << " ";
    xfr << vm->get_hostname() << ":" << vm->get_remote_dir() << endl;

    // ------------------------------------------------------------------------
    // TODO: Context commands
    // ------------------------------------------------------------------------

    xfr.close();
    
    tm_md->transfer(vid,vm->get_transfer_file());
    
    vm->unlock();
    
    return;
    
error_history:
    os.str("");
    os << "prolog_migr, VM " << vid << " has no history";
    goto error_common;
    
error_file:
    os.str("");
    os << "prolog_migr, could not open file: " << vm->get_transfer_file();
    goto error_common;
    
error_driver:
    os.str("");
    os << "prolog_migr, error getting driver " << vm->get_tm_mad();
    goto error_common;
    
error_common:
    (nd.get_lcm())->trigger(LifeCycleManager::PROLOG_FAILURE,vid);
    vm->log("TM", Log::ERROR, os);
        
    vm->unlock();
    return;
   
    (nd.get_lcm())->trigger(LifeCycleManager::PROLOG_SUCCESS,vid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::prolog_resume_action(int vid)
{
    ofstream        xfr;
    ostringstream   os;
        
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
    
    tm_md = get(vm->get_uid(),vm->get_tm_mad());
    
    if ( tm_md == 0 )
    {
        goto error_driver;
    }
    
    xfr.open(vm->get_transfer_file().c_str(), ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }
        
    // ------------------------------------------------------------------------
    // Move image directory
    // ------------------------------------------------------------------------

    xfr << "MV ";
    xfr << nd.get_nebula_hostname() << ":" << vm->get_local_dir() << "/images ";
    xfr << vm->get_hostname() << ":" << vm->get_remote_dir() << endl;

    // ------------------------------------------------------------------------
    // TODO: Context commands
    // ------------------------------------------------------------------------

    xfr.close();
    
    tm_md->transfer(vid,vm->get_transfer_file());
    
    vm->unlock();
    
    return;
    
error_history:
    os.str("");
    os << "prolog_resume, VM " << vid << " has no history";
    goto error_common;
    
error_file:
    os.str("");
    os << "prolog_resume, could not open file: " << vm->get_transfer_file();
    goto error_common;
    
error_driver:
    os.str("");
    os << "prolog_resume, error getting driver " << vm->get_tm_mad();
    goto error_common;
    
error_common:
    (nd.get_lcm())->trigger(LifeCycleManager::PROLOG_FAILURE,vid);
    vm->log("TM", Log::ERROR, os);
        
    vm->unlock();
    return;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::epilog_action(int vid)
{
    ofstream        xfr;
    ostringstream   os;
    string          xfr_name;
    
    const VectorAttribute * disk;
    string          source;
    string          save;
    string          clon;
        
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
    
    tm_md = get(vm->get_uid(),vm->get_tm_mad());
    
    if ( tm_md == 0 )
    {
        goto error_driver;
    }
    
    xfr.open(vm->get_transfer_file().c_str(), ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }
    
    // ------------------------------------------------------------------------
    // copy back VM image (DISK with SAVE="yes")
    // ------------------------------------------------------------------------

    num = vm->get_template_attribute("DISK",attrs);
    
    for (int i=0; i < num ;i++,save="")
    {
        disk = dynamic_cast<const VectorAttribute *>(attrs[i]);
        
        if ( disk == 0 )
        {
            continue;
        }
        
        save = disk->vector_value("SAVE");
                                
        if ( save.empty() == true)
        {
            continue;
        }
        
        transform(save.begin(),save.end(),save.begin(),(int(*)(int))toupper);
        
        if ( save == "YES" )
        {
            xfr << "MV " << vm->get_hostname() << ":" << vm->get_remote_dir()
                << "/disk." << i << " "
                << nd.get_nebula_hostname() << ":" << vm->get_local_dir()
                << "/disk." << i << endl;
        }
    }

    xfr << "DELETE " << vm->get_hostname() <<":"<< vm->get_remote_dir() << endl;

    xfr.close();
    
    tm_md->transfer(vid,vm->get_transfer_file());
    
    vm->unlock();
    
    return;
    
error_history:
    os.str("");
    os << "epilog, VM " << vid << " has no history";
    goto error_common;
    
error_file:
    os.str("");
    os << "epilog, could not open file: " << vm->get_transfer_file();
    goto error_common;
    
error_driver:
    os.str("");
    os << "epilog, error getting driver " << vm->get_vmm_mad();
    goto error_common;
    
error_common:
    (nd.get_lcm())->trigger(LifeCycleManager::PROLOG_FAILURE,vid);
    vm->log("TM", Log::ERROR, os);
        
    vm->unlock();
    return; 
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::epilog_stop_action(int vid)
{
    ofstream        xfr;
    ostringstream   os;
        
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
    
    tm_md = get(vm->get_uid(),vm->get_tm_mad());
    
    if ( tm_md == 0 )
    {
        goto error_driver;
    }
    
    xfr.open(vm->get_transfer_file().c_str(), ios::out | ios::trunc);

    if (xfr.fail() == true)
    {
        goto error_file;
    }
        
    // ------------------------------------------------------------------------
    // Move image directory
    // ------------------------------------------------------------------------

    xfr << "MV ";
    xfr << vm->get_hostname() << ":" << vm->get_remote_dir() << " ";
    xfr << nd.get_nebula_hostname() << ":" << vm->get_local_dir() << endl;

    // ------------------------------------------------------------------------
    // TODO: Context commands
    // ------------------------------------------------------------------------

    xfr.close();
    
    tm_md->transfer(vid,vm->get_transfer_file());
    
    vm->unlock();
    
    return;
    
error_history:
    os.str("");
    os << "epilog_stop, VM " << vid << " has no history";
    goto error_common;
    
error_file:
    os.str("");
    os << "epilog_stop, could not open file: " << vm->get_transfer_file();
    goto error_common;
    
error_driver:
    os.str("");
    os << "epilog_stop, error getting driver " << vm->get_tm_mad();
    goto error_common;
    
error_common:
    (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_FAILURE,vid);
    vm->log("TM", Log::ERROR, os);
        
    vm->unlock();
    return;
 
    (nd.get_lcm())->trigger(LifeCycleManager::EPILOG_SUCCESS,vid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManager::checkpoint_action(int vid)
{

}

/* ************************************************************************** */
/* MAD Loading                                                                */
/* ************************************************************************** */

void TransferManager::load_mads(int uid)
{
    unsigned int                    i;
    ostringstream                   oss;
    const VectorAttribute *         vattr;
    int                             rc;
    string                          name;
    TransferManagerDriver *         tm_driver = 0;
    
    oss << "Loading Transfer Manager drivers.";
    
    Nebula::log("TM",Log::INFO,oss);
    
    for(i=0,oss.str("");i<mad_conf.size();i++,oss.str(""),tm_driver=0)
    {
        vattr = static_cast<const VectorAttribute *>(mad_conf[i]);
        
        name  = vattr->vector_value("NAME");
        
        oss << "\tLoading driver: " << name;
        Nebula::log("VMM", Log::INFO, oss);
        
        tm_driver = new TransferManagerDriver(
                uid, 
                vattr->value(),
                (uid != 0),
                vmpool);
        
        if ( tm_driver == 0 )
            continue;
        
        rc = add(tm_driver);
        
        if ( rc == 0 )
        {
            oss.str("");
            oss << "\tDriver " << name << " loaded.";
            
            Nebula::log("TM",Log::INFO,oss);
        }
    }
}
