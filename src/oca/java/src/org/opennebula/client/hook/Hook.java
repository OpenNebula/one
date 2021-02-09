/*******************************************************************************
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems
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
package org.opennebula.client.hook;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula Hook.
 * It also offers static XML-RPC call wrappers.
 */
public class Hook extends PoolElement
{

    private static final String METHOD_PREFIX = "hook.";
    private static final String ALLOCATE = METHOD_PREFIX + "allocate";
    private static final String INFO     = METHOD_PREFIX + "info";
    private static final String DELETE   = METHOD_PREFIX + "delete";
    private static final String UPDATE   = METHOD_PREFIX + "update";
    private static final String RENAME   = METHOD_PREFIX + "rename";
    private static final String LOCK     = METHOD_PREFIX + "lock";
    private static final String UNLOCK   = METHOD_PREFIX + "unlock";
    private static final String RETRY    = METHOD_PREFIX + "retry";

    /**
     * Creates a new Hook representation.
     * @param id The Hook id.
     * @param client XML-RPC Client.
     */
    public Hook(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected Hook(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }

    // =================================
    // Static XML-RPC methods
    // =================================


    /**
     * Allocates a new Hook in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template of the Hook.
     * @return If successful the message contains the associated
     * id generated for this Hook.
     */
    public static OneResponse allocate(Client client, String description)
    {
        return client.call(ALLOCATE, description);
    }

    /**
     * Retrieves the information of the given Hook.
     *
     * @param client XML-RPC Client.
     * @param id The Hook id for the Hook to retrieve the information from
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id, false);
    }

    /**
     * Deletes a Hook from OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param id The Hook id of the target Hook we want to delete.
     * @return A encapsulated response.
     */
    public static OneResponse delete(Client client, int id)
    {
        return client.call(DELETE, id, false);
    }

    /**
     * Replaces the Hook contents.
     *
     * @param client XML-RPC Client.
     * @param id The Hook id of the target Hook we want to modify.
     * @param new_template New Hook contents.
     * @param append True to append new attributes instead of replace the whole Hook
     * @return If successful the message contains the Hook id.
     */
    public static OneResponse update(Client client, int id, String new_template,
        boolean append)
    {
        return client.call(UPDATE, id, new_template, append ? 1 : 0);
    }

    /**
     * Renames this Hook
     *
     * @param client XML-RPC Client.
     * @param id The Hook id of the target Hook.
     * @param name New name for the Hook.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse rename(Client client, int id, String name)
    {
        return client.call(RENAME, id, name);
    }

    /**
     * lock this Hook
     *
     * @param client XML-RPC Client.
     * @param id The hook id.
     * @param level Lock level.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse lock(Client client, int id, int level)
    {
        return client.call(LOCK, id, level);
    }

    /**
     * Unlock this Hook
     *
     * @param client XML-RPC Client.
     * @param id The Hook id.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse unlock(Client client, int id)
    {
        return client.call(UNLOCK, id);
    }

    /**
     * Retry this Hook
     *
     * @param client XML-RPC Client.
     * @param id The Hook id.
     * @param exec_id the hook execution id.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse retry(Client client, int id, int exec_id)
    {
        return client.call(RETRY, id, exec_id);
    }

    // =================================
    // Instanced object XML-RPC methods
    // =================================

    /**
     * Retrieves the information of the Hook.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info()
    {
        OneResponse response = info(client, id);
        super.processInfo(response);
        return response;
    }

    /**
     * Deletes the Hook from OpenNebula.
     *
     * @return A encapsulated response.
     */
    public OneResponse delete()
    {
        return delete(client, id);
    }

    /**
     * Replaces the Hook contents.
     *
     * @param new_template New Hook contents.
     * @return If successful the message contains the Hook id.
     */
    public OneResponse update(String new_template)
    {
        return update(new_template, false);
    }

    /**
     * Replaces the Hook contents.
     *
     * @param new_template New Hook contents.
     * @param append True to append new attributes instead of replace the whole Hook
     * @return If successful the message contains the hook id.
     */
    public OneResponse update(String new_template, boolean append)
    {
        return update(client, id, new_template, append);
    }

    /**
     * Renames this Hook
     *
     * @param name New name for the Hook.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse rename(String name)
    {
        return rename(client, id, name);
    }

    /**
     * Lock this Hook
     *
     * @param level Lock level.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse lock(int level)
    {
        return lock(client, id, level);
    }

    /**
     * Unlock this Hook
     *
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse unlock()
    {
        return unlock(client, id);
    }

    /**
     * Retry this Hook
     *
     * @param exec_id the hook execution id.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse retry(int exec_id)
    {
        return retry(client, id, exec_id);
    }
}
