/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#ifndef MARKETPLACE_MANAGER_H_
#define MARKETPLACE_MANAGER_H_

#include "MadManager.h"
#include "ActionManager.h"
#include "MarketPlaceManagerDriver.h"

extern "C" void * marketplace_action_loop(void *arg);

class MarketPlacePool;
class MarketPlaceAppPool;
class ImagePool;
class DatastorePool;

class ImageManager;

class MarketPlaceManager : public MadManager, public ActionListener
{
public:

    /**
     *  Inititalizes the Marketplace manager:
     *    @param t, timer_period to wake up the manger to perform actions
     *    @param m, monitor_period to monitor marketplaces
     *    @param mad, list of drivers for the manager
     */
    MarketPlaceManager(time_t t, time_t m, std::vector<const Attribute*>& mad);

    ~MarketPlaceManager(){};

    /**
     * Initializes internal pointers to other managers. Must be called when
     * all the other managers exist in Nebula::instance
     */
    void init_managers();

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the MarketPlace Manager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Loads the MarketPlace Driver defined in configuration file
     *   @param uid of the user executing the driver. When uid is 0 the nebula
     *   identity will be used. Otherwise the Mad will be loaded through the
     *   sudo application.
     */
    int load_mads(int uid=0);

    /**
     *  Gets the thread identification.
     *    @return pthread_t for the manager thread (that in the action loop).
     */
    pthread_t get_thread_id() const
    {
        return marketm_thread;
    };

    /**
     *  Finalizes the Image Manager
     */
    void finalize()
    {
        am.trigger(ACTION_FINALIZE,0);
    };

    /**
     *  Imports a new app into the marketplace. The marketplace app needs to
     *  include the ORIGIN_ID attribute so the driver can locate the app. An
     *  optional template maybe provided to export the app to a cloud.
     *    @param appid of the app
     *    @param market_data of the associated marketplace in XML format
     *    @param error descrition
     *
     *    @return 0 on success
     */
    int import_app(int appid, const std::string& market_data, std::string& err);

    /**
     *  Exports the app to this cloud. If an APPTEMPLATE64 is provided associated
     *  objects can also be created.
     *    @param appid of the app
     *    @param market_data of the associated marketplace in XML format
     *    @param error descrition
     *
     *    @return 0 on success
     */
    int export_app(int appid, const std::string& market_data, std::string& err);

    /**
     *  Deletes an app from the marketplace.
     *    @param iid id of image
     *    @param error_str Error reason, if any
     *
     *    @return 0 on success
     */
    int delete_app(int iid, std::string& error_str);

     /**
      *  Trigger a monitor action for the marketplace .
      *    @param ds_id id of the datastore to monitor
      */
     void monitor_market(int ds_id);

private:
    /**
     *  Generic name for the marketplace driver
     */
     static const char *  market_driver_name;

    /**
     *  Thread id for the MarketPlace Manager
     */
    pthread_t             marketm_thread;

    /**
     *  Timer period for the Image Manager.
     */
    time_t                timer_period;

    /**
     *  Marketplace monitor interval
     */
    time_t                monitor_period;

    /**
     *  Pointer to the marketplace pool
     */
    MarketPlacePool *     mppool;

    /**
     *  Pointer to the app pool
     */
    MarketPlaceAppPool * apppool;

	/**
     *  Pointer to the image pool
     */
	ImagePool *          ipool;

	/**
     * Pointer to the image pool
     */
	DatastorePool *      dspool;

	/**
	 *  Pointer to the Image Manger
     */
	ImageManager *       imagem;

    /**
     *  Action engine for the Manager
     */
    ActionManager         am;

    /**
     *  Returns a pointer to the marketplace driver.
     *    @return the marketplace manager driver or 0 in not found
     */
    const MarketPlaceManagerDriver * get()
    {
        std::string name("NAME");

        return static_cast<const MarketPlaceManagerDriver *>
               (MadManager::get(0, name, market_driver_name));
    };

    /**
     *  Function to execute the Manager action loop method within a new pthread
     * (requires C linkage)
     */
    friend void * marketplace_action_loop(void *arg);

    /**
     *  The action function executed when an action is triggered.
     *    @param action the name of the action
     *    @param arg arguments for the action function
     */
    void do_action(const std::string& action, void * arg);

    /**
     * Formats an XML message for the MAD
     *
     *    @param app_data marketplace app XML representation
     *    @param market_data marketplace XML representation
     *    @param extra_data additional XML formatted data for the driver
     *
     *    @return the XML message
     */
    static std::string * format_message(
            const std::string& app_data,
            const std::string& market_data,
            const std::string& extra_data);
    /**
     *  This function is executed periodically to monitor marketplaces..
     */
    void timer_action();
};

#endif /*MARKETPLACE_MANAGER_H*/

