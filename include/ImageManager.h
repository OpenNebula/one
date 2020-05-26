/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

#ifndef IMAGE_MANAGER_H_
#define IMAGE_MANAGER_H_

#include "MadManager.h"
#include "ActionManager.h"
#include "ImageManagerDriver.h"
#include "NebulaLog.h"

using namespace std;

extern "C" void * image_action_loop(void *arg);

class Image;
class Snapshots;
class Template;

class ImageManager : public MadManager, public ActionListener
{
public:

    ImageManager(time_t                    _timer_period,
                 time_t                    _monitor_period,
                 ImagePool *               _ipool,
                 DatastorePool *           _dspool,
                 vector<const VectorAttribute*>& _mads,
                 int                       _monitor_vm_disk):
            MadManager(_mads),
            timer_period(_timer_period),
            monitor_period(_monitor_period),
            monitor_vm_disk(_monitor_vm_disk),
            ipool(_ipool),
            dspool(_dspool)
    {
        am.addListener(this);
    };

    ~ImageManager(){};

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the Information Manager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Loads the Image Driver defined in configuration file
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
        return imagem_thread;
    };

    /**
     *  Finalizes the Image Manager
     */
    void finalize()
    {
        am.finalize();
    };

    /**************************************************************************/
    /*                           Image Manager Actions                        */
    /* Operates in a semi-sinchronous mode. Operations will be granted or not */
    /* , when needed the image repository drivers will be used to perform FS  */
    /* operations in the background.                                          */
    /**************************************************************************/

    /**
     *  Try to acquire an image from the repository for a VM.
     *    @param image_id id of image
     *    @param error string describing the error
     *    @param attach true if attaching the image to a VM
     *    @return pointer to the image or 0 if could not be acquired
     */
    Image * acquire_image(int vm_id, int image_id, bool attach, string& error);

    /**
     *  Try to acquire an image from the repository for a VM.
     *    @param name of the image
     *    @param id of owner
     *    @param error string describing the error
     *    @param attach true if attaching the image to a VM
     *    @return pointer to the image or 0 if could not be acquired
     */
    Image * acquire_image(int vm_id, const string& name, int uid, bool attach, string& error);

    /**
     *  Releases an image and triggers any needed operations in the repo
     *    @param iid image id of the image to be released
     *    @param failed the associated VM releasing the images is FAILED
     */
    void release_image(int vm_id, int iid, bool failed);

    /**
     *  Closes any cloning operation on the image, updating the state if needed
     *    @param iid image id of the image to that was being cloned
     *    @param ot Object type, image or market app
     *    @param clone_oid the cloned resource id
     */
    void release_cloning_resource(int iid, PoolObjectSQL::ObjectType ot, int clone_oid);

    /**
     *  Closes any cloning operation on the image, updating the state if needed
     *    @param iid image id of the image to that was being cloned
     *    @param clone_img_id the cloned image id
     */
    void release_cloning_image(int iid, int clone_img_id)
    {
        release_cloning_resource(iid, PoolObjectSQL::IMAGE, clone_img_id);
    };

    /**
     *  Closes any cloning operation on the image, updating the state if needed
     *    @param iid image id of the image to that was being cloned
     *    @param clone_oid the cloned marketplace app id
     */
    void release_cloning_app(int iid, int clone_oid)
    {
        release_cloning_resource(iid, PoolObjectSQL::MARKETPLACEAPP, clone_oid);
    };

    /**
     *  Enables the image
     *    @param iid Image id
     *    @param to_enable true will enable the image.
     *    @param error_str Error reason, if any
     *    @return 0 on success
     */
    int enable_image(int iid, bool to_enable, string& error_str);

    /**
     *  Adds a new image to the repository copying or creating it as needed
     *    @param img pointer to the image
     *    @param ds_data data of the associated datastore in XML format
     *    @param extra_data data to be sent to the driver
     *    @param error Error reason
     *
     *    @return 0 on success
     */
    int register_image(int iid,
                       const string& ds_data,
                       const string& extra_data,
                       string& error);

    /**
     * Checks if an image is ready to be cloned
     *
     * @param cloning_id ID of the image to be cloned
     * @param oss_error Error reason, if any
     *
     * @return 0 if the image can be cloned, -1 otherwise
     */
    int can_clone_image(int cloning_id, ostringstream&  oss_error);

    /**
     * Sets the state to CLONE for the given image
     *   @param ot Object type, image or market app
     *   @param new_id for the target image or market app
     *   @param clonning_id the ID of the image to be cloned
     *   @param error if any
     *   @return 0 on success
     */
    int set_clone_state(PoolObjectSQL::ObjectType ot, int new_id,
            int cloning_id, std::string& error);

    /**
     * Sets the state to CLONE for the given image
     *   @param new_id for the target image
     *   @param clonning_id the ID of the image to be cloned
     *   @param error if any
     *   @return 0 on success
     */
    int set_img_clone_state(int new_id, int cloning_id, std::string& error)
    {
        return set_clone_state(PoolObjectSQL::IMAGE, new_id, cloning_id, error);
    };

    /**
     * Sets the state to CLONE for the given image
     *   @param new_id for the target market app
     *   @param clonning_id the ID of the image to be cloned
     *   @param error if any
     *   @return 0 on success
     */
    int set_app_clone_state(int new_id, int cloning_id, std::string& error)
    {
        return set_clone_state(PoolObjectSQL::MARKETPLACEAPP, new_id, cloning_id, error);
    };

    /**
     *  Clone an existing image to the repository
     *    @param new_id of the new image
     *    @param cloning_id of the image to be cloned
     *    @param ds_data data of the associated datastore in XML format
     *    @param extra_data data to be sent to the driver
     *    @param error describing the error
     *    @return 0 on success
     */
    int clone_image(int new_id,
                    int cloning_id,
                    const string& ds_data,
                    const string& extra_data,
                    string& error);
    /**
     *  Deletes an image from the repository and the DB. The Datastore image list
     *  is also updated
     *    @param iid id of image
     *    @param error_str Error reason, if any
     *    @return 0 on success
     */
    int delete_image(int iid, string& error_str);

    /**
     *  Gets the size of an image by calling the STAT action of the associated
     *  datastore driver.
     *
     *  @param img_tmpl the template for the image
     *  @param ds_tmpl the template for the datastore
     *  @oaram result with a string representation of the size or if an error
     *         occurred describing the error.
     *  @result 0 on success
     */
     int stat_image(Template* img_tmpl, const string& ds_tmpl, string& res);

     /**
      *  Trigger a monitor action for the datastore.
      *    @param ds_id id of the datastore to monitor
      */
     void monitor_datastore(int ds_id);

    /**
     *  Set the snapshots for the given image. The image MUST be persistent
     *  and of type OS or DATABLOCK.
     *    @param iid id of image
     *    @param s snapshot list
     */
     void set_image_snapshots(int iid, const Snapshots& s);

     /**
      *  Clear the snapshots of an image by setting an empty set.
      *    @param iid id of image
      */
     void clear_image_snapshots(int iid);

    /**
     *  Set the size for the given image. The image MUST be persistent
     *  and of type OS or DATABLOCK.
     *    @param iid id of image
     *    @param size
     */
     void set_image_size(int iid, long long size);

     /**
      *  Deletes the snapshot of an image
      *    @param iid id of image
      *    @param sid id of the snapshot
      *    @param error_str Error reason, if any
      *    @return 0 on success
      */
     int delete_snapshot(int iid, int sid, string& error);

     /**
      *  Reverts image state to a previous snapshot
      *    @param iid id of image
      *    @param sid id of the snapshot
      *    @param error_str Error reason, if any
      *    @return 0 on success
      */
     int revert_snapshot(int iid, int sid, string& error);

     /**
      *  Flattens ths snapshot by commiting changes to base image.
      *    @param iid id of image
      *    @param sid id of the snapshot
      *    @param error_str Error reason, if any
      *    @return 0 on success
      */
     int flatten_snapshot(int iid, int sid, string& error);

private:
    /**
     *  Generic name for the Image driver
     */
     static const char *  image_driver_name;

    /**
     *  Thread id for the Image Manager
     */
    pthread_t             imagem_thread;

    /**
     *  Timer period for the Image Manager.
     */
    time_t                timer_period;

    /**
     *  Datastore Monitor Interval
     */
    time_t                monitor_period;

    /**
     *  Monitor Virtual Machine disk usage every X datastore monitoring.
     *  0 to disable
     */
    int                   monitor_vm_disk;

    /**
     *  Pointer to the Image Pool to access VMs
     */
    ImagePool *           ipool;

    /**
     *  Pointer to the DS Pool
     */
    DatastorePool *       dspool;

    /**
     *  Action engine for the Manager
     */
    ActionManager         am;

    /**
     *  Returns a pointer to the Image Manager Driver used for the Repository
     *    @return the Image Manager driver or 0 in not found
     */
    const ImageManagerDriver * get()
    {
        string name("NAME");

        return static_cast<const ImageManagerDriver *>
               (MadManager::get(0,name,image_driver_name));
    };

    /**
     *  Function to execute the Manager action loop method within a new pthread
     * (requires C linkage)
     */
    friend void * image_action_loop(void *arg);

    /**
     *  The action function executed when an action is triggered.
     *    @param action the name of the action
     *    @param arg arguments for the action function
     */
    void do_action(const string& action, void * arg);

    /**
     *  Acquires an image updating its state.
     *    @param image pointer to image, it should be locked
     *    @param attach true if attaching the image to a VM
     *    @return 0 on success
     */
    int acquire_image(int vm_id, Image *img, bool attach, string& error);

    /**
     *  Moves a file to an image in the repository
     *    @param image to be updated (it's source attribute)
     *    @param source path of the disk file
     */
    void move_image(Image *img, const string& source);

    /**
     * Formats an XML message for the MAD
     *
     *    @param img_data Image XML representation
     *    @param ds_data Datastore XML representation
     *    @param extra_data additional XML formatted data for the driver
     *    @return the XML message
     */
    static string * format_message(const string& img_data,
            const string& ds_data,
            const string& extra_data);

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    /**
     *  This function is executed periodically to monitor Datastores.
     */
    void timer_action(const ActionRequest& ar);

    void finalize_action(const ActionRequest& ar)
    {
        NebulaLog::log("ImM",Log::INFO,"Stopping Image Manager...");
        MadManager::stop();
    };
};

#endif /*IMAGE_MANAGER_H*/
