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

#include <signal.h>
#include <fcntl.h>

#include <string>
#include <iostream>
#include <sstream>

#include "MadManager.h"
#include "SyncRequest.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

MadManager::MadManager(vector<const Attribute*>& _mads):mad_conf(_mads)
{
    pthread_mutex_init(&mutex,0);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

MadManager::~MadManager()
{   
    pthread_mutex_destroy(&mutex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * mad_manager_listener(
        void *                  _mm)
{
    MadManager * mm;

    mm = static_cast<MadManager *>(_mm);

    mm->listener();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MadManager::mad_manager_system_init()
{
    struct sigaction  act;

    act.sa_handler = SIG_IGN;
    act.sa_flags   = SA_RESTART;
    sigemptyset(&act.sa_mask);

    sigaction(SIGPIPE,&act,NULL);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MadManager::start()
{
    int             rc;
    int             pipes[2];

    lock();

    rc = pipe(pipes);

    if ( rc == -1)
    {
        goto error_pipe;
    }

    pipe_r = pipes[0];
    pipe_w = pipes[1];

    fcntl(pipe_r, F_SETFD, FD_CLOEXEC);
    fcntl(pipe_w, F_SETFD, FD_CLOEXEC);

    fds.push_back(pipe_r);

    rc = pthread_create(&listener_thread,
                        0,
                        mad_manager_listener,
                        (void *) this);
    if ( rc != 0 )
    {
        goto error_create;
    }

    unlock();

    return 0;

error_create:
    close(pipe_r);
    close(pipe_w);

error_pipe:

    unlock();

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MadManager::stop()
{ 
    pthread_cancel(listener_thread);

    pthread_join(listener_thread,0);
    
    lock();
       
    close(pipe_r);
    
    close(pipe_w);
    
    for (unsigned int i=0;i<mads.size();i++)
    {
        delete mads[i];
    }

    unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MadManager::add(Mad *mad)
{
    char    buf = 'A';
    int     rc;

    if ( mad == 0 )
    {
    	return -1;
    }
    
    lock();

    rc = mad->start();

    if ( rc != 0 )
    {
        unlock();

        return -1;
    }

    mads.push_back(mad);

    write(pipe_w, &buf, sizeof(char));

    unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const Mad * MadManager::get(
    int     uid,
    const   string& name,
    const   string& value)
{
    unsigned int                        i;
    Mad *                               md = 0;
    multimap<string,string>::iterator   it;

    lock();

    for (i=0;i<mads.size();i++)
    {
        if (uid == mads[i]->uid)
        {
            it = mads[i]->attributes.find(name);

            if ((it != mads[i]->attributes.end()) &&
                    (it->second == value))
            {
                md = mads[i];
                break;
            }
        }
    }

    unlock();

    return md;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MadManager::listener()
{
    int             greater;
    unsigned int    i,j;
    int             rc,mrc;

    char            c;

    Mad *           mad;
    int             fd;
    fd_set          in_pipes;
    fd_set          rfds;
    struct timeval  tv;
        
    pthread_setcancelstate(PTHREAD_CANCEL_ENABLE, 0);
    
    pthread_setcanceltype(PTHREAD_CANCEL_DEFERRED,0); 
    
    while (1)
    {
        lock();
        
        FD_ZERO(&in_pipes);

        for (i=0,greater=0; i < fds.size() ; i++)
        {
            FD_SET(fds[i], &in_pipes);

            if ( fds[i] > greater )
            {
                greater = fds[i];
            }
        }

        unlock();

        // Wait for a message        
        rc = select(greater+1, &in_pipes, NULL, NULL, NULL);

        if ( rc <= 0 )
        {
            continue;
        }
        
        for (i=0; i< fds.size(); i++)
        {
            fd  = fds[i];

            if ( FD_ISSET(fd, &in_pipes) )
            {
                if ( fd == pipe_r ) // Driver added, update the fd vector
                {
                    read(fd, (void *) &c, sizeof(char));
                    
                    lock();

                    fds.clear();

                    fds.push_back(pipe_r);

                    for (j=0;j<mads.size();j++)
                    {
                        fds.push_back(mads[j]->mad_nebula_pipe);
                    }

                    unlock();
                    
                    continue;
                }

                mad = mads[i-1];

                buffer.str("");

                do
                {
                    FD_ZERO(&rfds);
                    FD_SET(mad->mad_nebula_pipe, &rfds);

                    tv.tv_sec  = 0;
                    tv.tv_usec = 25000;

                    rc = select(mad->mad_nebula_pipe+1,&rfds,0,0,&tv);
            
                    if ( rc <= 0 )
                    {
                        break;
                    }

                    rc = read(mad->mad_nebula_pipe,(void *) &c,sizeof(char));
                    buffer.put(c);
                }
                while ( rc > 0 && c != '\n');
                                
                if ( rc <= 0 ) // Error reload the driver and recover
                {
                    mrc = mad->reload();

                    if ( mrc == 0 )
                    {
                        mad->recover();
                    }
                    else
                    {                        
                        lock();

                        mads.erase(mads.begin() + i - 1);

                        delete mad;

                        unlock();
                        
                    }

                    continue;
                }
                else //MAD specific protocol
                {
                    string msg = buffer.str();

                    mad->protocol(msg);
                }
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MadManager::check_time_outs_action()
{
    map<int, SyncRequest *>::iterator it;

    time_t the_time = time(0);

    lock();

    it = sync_requests.begin();

    while ( it != sync_requests.end())
    {
        if ((it->second->time_out != 0) && (the_time > it->second->time_out))
        {
            SyncRequest * ar = it->second;
            sync_requests.erase(it++);

            ar->result  = false;
            ar->timeout = true;
            ar->message = "Request timeout";

            ar->notify();
        }
        else
        {
            ++it;
        }
    }

    unlock();

}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MadManager::add_request(SyncRequest *ar)
{
    static int request_id = 0;

    lock();

    ar->id = request_id++;

    sync_requests.insert(sync_requests.end(),make_pair(ar->id,ar));

    unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

SyncRequest * MadManager::get_request(int id)
{
    SyncRequest * ar = 0;
    map<int,SyncRequest *>::iterator it;
    ostringstream oss;

    lock();

    it = sync_requests.find(id);

    if ( it != sync_requests.end())
    {
        ar = it->second;

        sync_requests.erase(it);
    }

    unlock();

    return ar;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MadManager::notify_request(int id, bool result, const string& message)
{

    SyncRequest * ar;

    ar = get_request(id);

    if ( ar == 0 )
    {
        return;
    }

    ar->result = result;

    if ( message != "-" )
    {
        if ( !ar->message.empty() )
        {
            ar->message.append("; ");
        }

        ar->message.append(message);
    }

    ar->notify();
}
