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

#ifndef LISTENER_H_
#define LISTENER_H_

#include <functional>
#include <queue>
#include <atomic>
#include <mutex>
#include <chrono>
#include <condition_variable>
#include <thread>

#include "NebulaLog.h"

/**
 *  The Timer class executes a given action periodically in a separate thread.
 *  The thread is terminated when the object is deleted
 */
class Timer
{
public:
    /**
     *  Empty constructor, call start method to start the thread timer
     **/
    Timer() = default;

    /**
     *  Starts async thread, which call 'timer' method every 's' seconds
     **/
    Timer(double s, std::function<void()> timer)
    {
        start(s, timer);
    }

    /**
     * Destructor, stops the running thread
     **/
    ~Timer()
    {
        stop();

        if (timer_thread.joinable())
        {
            timer_thread.join();
        }
    }

    /**
     * Starts async thread, which call 'timer' method every 's' seconds
     * Can be called only if default constructor is used, to start the thread
     * Can be called only once per class instance
     **/
    void start(double s, std::function<void()> timer)
    {
        if (timer_thread.joinable())
        {
            NebulaLog::error("TMR", "Trying to start Timer thread twice!");
            return;
        }

        end = false;

        timer_thread = std::thread([&, s, timer]
        {

            std::unique_lock<std::mutex> ul(lock);

            while (true)
            {
                bool tout = cond.wait_for(ul, std::chrono::duration<double>(s), [&]
                {
                    return end == true;
                });

                if (end)
                {
                    return;
                }
                else if (!tout)
                {
                    timer();
                }
            }
        });
    }

    /**
     * Stops the running thread. It's not necessery to call this method,
     * the thread is stopped in destructor
     **/
    void stop()
    {
        std::unique_lock<std::mutex> ul(lock);

        end = true;

        cond.notify_one();
    }

private:
    std::atomic<bool> end;

    std::thread timer_thread;

    std::mutex lock;
    std::condition_variable cond;
};

/**
 *  This class implements basic functionality to listen for events. Events are
 *  triggered in separate threads. The class store them in a queue and executed
 *  them in the listner thread.
 */
class Listener
{
public:
    Listener(const std::string& _name)
        : name(_name)
    {
    }

    virtual ~Listener()
    {
        join_thread();
    }

    /**
     *  Trigger an event in the listner. For example:
     *    listener.trigger(std::bind(&Class::callback, this, param1, param2);
     *
     *    @param f, callback function for the event
     */
    void trigger(std::function<void()> f)
    {
        std::unique_lock<std::mutex> ul(lock);

        pending.push(f);

        ul.unlock();

        cond.notify_one();
    }

    /**
     *  Async stops the event loop
     */
    void finalize()
    {
        trigger([&]
        {
            if (!name.empty())
            {
                NebulaLog::info("Lis", "Stopping " + name);
            }

            finalize_action();

            end = true;

            cond.notify_one();
        });
    }

    void join_thread()
    {
        if (loop_thread.joinable())
        {
            loop_thread.join();
        }
    }

protected:
    /**
     *  Async starts the event loop waiting for events.
     */
    void start()
    {
        loop_thread = std::thread([&]
        {
            NebulaLog::info("Lis", name + " started.");

            loop();

            NebulaLog::info("Lis", name + " stopped.");
        });
    }

    void loop()
    {
        end = false;

        while (true)
        {
            std::function<void()> fn;

            {
                std::unique_lock<std::mutex> ul(lock);

                cond.wait(ul, [&] {return (end || !pending.empty());});

                if (end)
                {
                    break;
                }

                fn = pending.front();
                pending.pop();
            }

            fn();
        }
    }

    /**
     *  Action called on finalize action
     */
    virtual void finalize_action() {};

private:
    std::string name;

    std::thread loop_thread;

    std::atomic<bool> end;

    std::mutex lock;
    std::condition_variable cond;

    std::queue<std::function<void()>> pending;
};

#endif /*LISTENER_H_*/
