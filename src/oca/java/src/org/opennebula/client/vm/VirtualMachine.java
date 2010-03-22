/*******************************************************************************
 * Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
package org.opennebula.client.virtualMachine;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula VM.
 * It also offers static XML-RPC call wrappers.
 */
public class VirtualMachine extends PoolElement{

    private static final String METHOD_PREFIX = "vm.";
    private static final String ALLOCATE = METHOD_PREFIX + "allocate";
    private static final String INFO     = METHOD_PREFIX + "info";
    private static final String DEPLOY   = METHOD_PREFIX + "deploy";
    private static final String ACTION   = METHOD_PREFIX + "action";
    private static final String MIGRATE  = METHOD_PREFIX + "migrate";

    private static final String[] VM_STATES =
    {
        "INIT",
        "PENDING",
        "HOLD",
        "ACTIVE",
        "STOPPED",
        "SUSPENDED",
        "DONE",
        "FAILED" };

    private static final String[] SHORT_VM_STATES =
    {
        "init",
        "pend",
        "hold",
        "actv",
        "stop",
        "susp",
        "done",
        "fail" };

    private static final String[] LCM_STATE =
    {
        "LCM_INIT",
        "PROLOG",
        "BOOT",
        "RUNNING",
        "MIGRATE",
        "SAVE_STOP",
        "SAVE_SUSPEND",
        "SAVE_MIGRATE",
        "PROLOG_MIGRATE",
        "PROLOG_RESUME",
        "EPILOG_STOP",
        "EPILOG",
        "SHUTDOWN",
        "CANCEL",
        "FAILURE",
        "DELETE",
        "UNKNOWN" };

    private static final String[] SHORT_LCM_STATES =
    {
        null,
        "prol",
        "boot",
        "runn",
        "migr",
        "save",
        "save",
        "save",
        "migr",
        "prol",
        "epil",
        "epil",
        "shut",
        "shut",
        "fail",
        "dele",
        "unkn" };

    /**
     * Creates a new VM representation.
     *
     * @param id The virtual machine Id (vid).
     * @param client XML-RPC Client.
     */
    public VirtualMachine(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected VirtualMachine(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }


    // =================================
    // Static XML-RPC methods
    // =================================

    /**
     * Allocates a new VM in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template of the vm.
     * @return If successful the message contains the associated
     * id generated for this VM.
     */
    public static OneResponse allocate(Client client, String description)
    {
        return client.call(ALLOCATE, description);
    }

    /**
     * Retrieves the information of the given VM.
     *
     * @param client XML-RPC Client.
     * @param id The virtual machine id (vid) of the target instance.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }


    // =================================
    // Instanced object XML-RPC methods
    // =================================

    /**
     * Loads the xml representation of the virtual machine.
     * The info is also stored internally.
     *
     * @see VirtualMachine#info(Client, int)
     */
    public OneResponse info()
    {
        OneResponse response = info(client, id);
        super.processInfo(response);
        return response;
    }

    /**
     * Initiates the instance of the VM on the target host.
     *
     * @param hostId The host id (hid) of the target host where
     * the VM will be instantiated.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse deploy(int hostId)
    {
        return client.call(DEPLOY, id, hostId);
    }

    /**
     * Submits an action to be performed on the virtual machine.
     * <br/>
     * It is recommended to use the helper methods instead:
     * <ul>
     * <li>{@link VirtualMachine#shutdown()}</li>
     * <li>{@link VirtualMachine#cancel()}</li>
     * <li>{@link VirtualMachine#hold()}</li>
     * <li>{@link VirtualMachine#release()}</li>
     * <li>{@link VirtualMachine#stop()}</li>
     * <li>{@link VirtualMachine#suspend()}</li>
     * <li>{@link VirtualMachine#resume()}</li>
     * <li>{@link VirtualMachine#finalizeVM()}</li>
     * <li>{@link VirtualMachine#restart()}</li>
     * </ul>
     *
     * @param action The action name to be performed, can be:<br/>
     * "shutdown", "hold", "release", "stop", "cancel", "suspend",
     * "resume", "restart", "finalize".
     * @return If an error occurs the error message contains the reason.
     */
    protected OneResponse action(String action)
    {
        return client.call(ACTION, action, id);
    }

    /**
     * Migrates the virtual machine to the target host (hid).
     *
     * @param hostId The target host id (hid) where we want to migrate
     * the vm.
     * @param live If true we are indicating that we want livemigration,
     * otherwise false.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse migrate(int hostId, boolean live)
    {
        return client.call(MIGRATE, id, hostId, live);
    }


    // =================================
    // Helpers
    // =================================

    /**
     * Shuts down the already deployed VM.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse shutdown()
    {
        return action("shutdown");
    }

    /**
     * Cancels the running VM.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse cancel()
    {
        return action("cancel");
    }

    /**
     * Sets the VM to hold state. The VM will not be scheduled until it is
     * released.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse hold()
    {
        return action("hold");
    }

    /**
     * Releases a virtual machine from hold state.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse release()
    {
        return action("release");
    }

    /**
     * Stops the virtual machine. The virtual machine state is transferred back
     * to OpenNebula for a possible reschedule.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse stop()
    {
        return action("stop");
    }

    /**
     * Suspends the virtual machine. The virtual machine state is left in the
     * cluster node for resuming.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse suspend()
    {
        return action("suspend");
    }

    /**
     * Resumes the execution of a saved VM.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse resume()
    {
        return action("resume");
    }

    /**
     * Deletes the VM from the pool and database.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse finalizeVM()
    {
        return action("finalize");
    }

    /**
     * Resubmits the virtual machine after failure.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse restart()
    {
        return action("shutdown");
    }

    /**
     * Migrates the virtual machine to the target host (hid).
     * <br/>
     * It does the same as {@link VirtualMachine#migrate(int, boolean)}
     * with live set to false.
     *
     * @param hostId The target host id (hid) where we want to migrate
     * the vm.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse migrate(int hostId)
    {
        return migrate(hostId, false);
    }

    /**
     * Performs a live migration of the virtual machine to the
     * target host (hid).
     * <br/>
     * It does the same as {@link VirtualMachine#migrate(int, boolean)}
     * with live set to true.
     *
     * @param hostId The target host id (hid) where we want to migrate
     * the vm.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse liveMigrate(int hostId)
    {
        return migrate(hostId, true);
    }

    public int state()
    {
        return super.state();
    }

    /**
     * Returns the VM state of the VirtualMachine (string value).
     * @return The VM state of the VirtualMachine (string value).
     */
    public String stateStr()
    {
        int state = state();
        return state != -1 ? VM_STATES[state()] : null;
    }

    /**
     * Returns the LCM state of the VirtualMachine (numeric value).
     * @return The LCM state of the VirtualMachine (numeric value).
     */
    public int lcmState()
    {
        String state = xpath("LCM_STATE");
        return state != null ? Integer.parseInt(state) : -1;
    }

    /**
     * Returns the LCM state of the VirtualMachine (string value).
     * @return The LCM state of the VirtualMachine (string value).
     */
    public String lcmStateStr()
    {
        int state = lcmState();
        return state != -1 ? LCM_STATE[state] : null;
    }

    /**
     * Returns the short status string for the VirtualMachine.
     * @return The short status string for the VirtualMachine.
     */
    public String status()
    {
        int state = state();
        String shortStateStr = null;
        if(state != -1)
        {
            shortStateStr = SHORT_VM_STATES[state];
            if(shortStateStr.equals("actv"))
            {
                int lcmState = lcmState();
                if(lcmState != -1)
                    shortStateStr = SHORT_LCM_STATES[lcmState];
            }
        }
        return shortStateStr;
    }
}
