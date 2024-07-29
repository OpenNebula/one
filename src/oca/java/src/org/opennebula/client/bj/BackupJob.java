/*******************************************************************************
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems
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
package org.opennebula.client.backupjob;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula Backup Job.
 * It also offers static XML-RPC call wrappers.
 */
public class BackupJob extends PoolElement
{

    private static final String METHOD_PREFIX = "backupjob.";
    private static final String ALLOCATE    = METHOD_PREFIX + "allocate";
    private static final String DELETE      = METHOD_PREFIX + "delete";
    private static final String UPDATE      = METHOD_PREFIX + "update";
    private static final String RENAME      = METHOD_PREFIX + "rename";
    private static final String INFO        = METHOD_PREFIX + "info";
    private static final String CHOWN       = METHOD_PREFIX + "chown";
    private static final String CHMOD       = METHOD_PREFIX + "chmod";
    private static final String LOCK        = METHOD_PREFIX + "lock";
    private static final String UNLOCK      = METHOD_PREFIX + "unlock";
    private static final String BACKUP      = METHOD_PREFIX + "backup";
    private static final String CANCEL      = METHOD_PREFIX + "cancel";
    private static final String RETRY       = METHOD_PREFIX + "retry";
    private static final String PRIORITY    = METHOD_PREFIX + "priority";
    private static final String SCHEDADD    = METHOD_PREFIX + "schedadd";
    private static final String SCHEDDELETE = METHOD_PREFIX + "scheddelete";
    private static final String SCHEDUPDATE = METHOD_PREFIX + "schedupdate";

    /**
     * Creates a new Backup Job representation.
     * @param id The Backup Job id.
     * @param client XML-RPC Client.
     */
    public BackupJob(int id, Client client)
    {
        super(id, client);
    }

    /**
     * @see PoolElement
     */
    protected BackupJob(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }

    // =================================
    // Static XML-RPC methods
    // =================================

    /**
     * Allocates a new BackupJob in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param description A string containing the template of the Backup Job.
     *
     * @return If successful the message contains the associated
     * ID generated for this Backup Job.
     */
    public static OneResponse allocate(
            Client  client,
            String  description)
    {
        return client.call(ALLOCATE, description);
    }

    /**
     * Deletes an Backup Job from OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param id The Backup Job ID we want to delete.
     * @return An encapsulated response.
     */
    public static OneResponse delete(Client client, int id)
    {
        return client.call(DELETE, id);
    }

    /**
     * Retrieves the information of the given Backup JOb.
     *
     * @param client XML-RPC Client.
     * @param id The Backup Job ID
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }

    /**
     * Replaces the template contents.
     *
     * @param client XML-RPC Client.
     * @param id The Backkup Job ID we want to modify.
     * @param new_template New template contents
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the Backup Job ID.
     */
    public static OneResponse update(Client client, int id, String new_template, boolean append)
    {
        return client.call(UPDATE, id, new_template, append ? 1 : 0);
    }

    /**
     * Renames Backup Job
     *
     * @param client XML-RPC Client.
     * @param id The Backup Job ID.
     * @param name New name for the Backup Job.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse rename(Client client, int id, String name)
    {
        return client.call(RENAME, id, name);
    }

    /**
     * Changes the owner/group
     *
     * @param client XML-RPC Client.
     * @param id The Backup Job ID we want to modify.
     * @param uid The new owner user ID. Set it to -1 to leave the current one.
     * @param gid The new group ID. Set it to -1 to leave the current one.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chown(Client client, int id, int uid, int gid)
    {
        return client.call(CHOWN, id, uid, gid);
    }

    /**
     * Changes the Backup Job permissions
     *
     * @param client XML-RPC Client.
     * @param id The Backup Job ID we want to modify.
     * @param owner_u 1 to allow, 0 deny, -1 do not change
     * @param owner_m 1 to allow, 0 deny, -1 do not change
     * @param owner_a 1 to allow, 0 deny, -1 do not change
     * @param group_u 1 to allow, 0 deny, -1 do not change
     * @param group_m 1 to allow, 0 deny, -1 do not change
     * @param group_a 1 to allow, 0 deny, -1 do not change
     * @param other_u 1 to allow, 0 deny, -1 do not change
     * @param other_m 1 to allow, 0 deny, -1 do not change
     * @param other_a 1 to allow, 0 deny, -1 do not change
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chmod(Client client, int id,
                                    int owner_u, int owner_m, int owner_a,
                                    int group_u, int group_m, int group_a,
                                    int other_u, int other_m, int other_a)
    {
        return chmod(client, CHMOD, id,
                owner_u, owner_m, owner_a,
                group_u, group_m, group_a,
                other_u, other_m, other_a);
    }

    /**
     * Changes the permissions
     *
     * @param client XML-RPC Client.
     * @param id The Backup Job ID of the target object.
     * @param octet Permissions octed , e.g. 640
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chmod(Client client, int id, String octet)
    {
        return chmod(client, CHMOD, id, octet);
    }

    /**
     * Changes the permissions
     *
     * @param client XML-RPC Client.
     * @param id The Backup Job ID of the target object.
     * @param octet Permissions octed , e.g. 640
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chmod(Client client, int id, int octet)
    {
        return chmod(client, CHMOD, id, octet);
    }

    /**
     * Lock Backup Job
     *
     * @param client XML-RPC Client.
     * @param id The Backup Job ID.
     * @param level Lock level.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse lock(Client client, int id, int level)
    {
        return client.call(LOCK, id, level);
    }

    /**
     * Unlock Backup Job
     *
     * @param client XML-RPC Client.
     * @param id The Backup Job ID.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse unlock(Client client, int id)
    {
        return client.call(UNLOCK, id);
    }

    /**
     * Execute the Backup Job
     *
     * @param client XML-RPC Client.
     * @param id The Backup Job ID.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse backup(Client client, int id)
    {
        return client.call(BACKUP, id);
    }

    /**
     * Cancel ongoing Backup Job
     *
     * @param client XML-RPC Client.
     * @param id The Backup Job ID.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse cancel(Client client, int id)
    {
        return client.call(CANCEL, id);
    }

    /**
     * Retry failed Backup Job, executes again backup for failed Virtual Machines
     *
     * @param client XML-RPC Client.
     * @param id The Backup Job ID.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse retry(Client client, int id)
    {
        return client.call(RETRY, id);
    }

    /**
     * Set priority for Backup Job, range for priority is 0-100.
     * Base value is 50, only admin user can set priority over 50
     *
     * @param client XML-RPC Client.
     * @param id The Backup Job ID.
     * @param priority New value for priority
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse priority(Client client, int id, int prio)
    {
        return client.call(PRIORITY, id, prio);
    }

    /**
     * Add Scheduled Action to Backup Job
     *
     * @param client XML-RPC Client.
     * @param id The Backup Job ID.
     * @param template Scheduled Action template.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse schedadd(Client client, int id, String template)
    {
        return client.call(SCHEDADD, id, template);
    }

    /**
     * Update Backup Job Scheduled Action
     *
     * @param client XML-RPC Client.
     * @param id The Backup Job ID.
     * @param sa_id The Scheduled Action ID.
     * @param template Updated values for Scheduled Action.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse schedupdate(Client client, int id, int sa_id, String template)
    {
        return client.call(SCHEDUPDATE, id, sa_id, template);
    }

    /**
     * Delete Backup Job Scheduled Action
     *
     * @param client XML-RPC Client.
     * @param id The Backup Job ID.
     * @param sa_id The Scheduled Action ID.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse scheddelete(Client client, int id, int sa_id)
    {
        return client.call(SCHEDDELETE, id, sa_id);
    }

    // =================================
    // Instanced object XML-RPC methods
    // =================================

    /**
     * Retrieves the information of the Backup Job.
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
     * Deletes the Backup Job from OpenNebula.
     *
     * @param force Ignore errors
     * @return A encapsulated response.
     */
    public OneResponse delete()
    {
        return delete(client, id);
    }

    /**
     * Replaces the template contents.
     *
     * @param new_template New template contents
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the Backup Job ID.
     */
    public OneResponse update(String new_template, boolean append)
    {
        return update(client, id, new_template, append);
    }

    /**
     * Renames this Backup Job
     *
     * @param name New name for the Backup Job.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse rename(String name)
    {
        return rename(client, id, name);
    }

    /**
     * Changes the owner/group
     *
     * @param uid The new owner user ID. Set it to -1 to leave the current one.
     * @param gid The new group ID. Set it to -1 to leave the current one.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chown(int uid, int gid)
    {
        return chown(client, id, uid, gid);
    }

    /**
     * Changes the owner
     *
     * @param uid The new owner user ID.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chown(int uid)
    {
        return chown(uid, -1);
    }

    /**
     * Changes the group
     *
     * @param gid The new group ID.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chgrp(int gid)
    {
        return chown(-1, gid);
    }

    /**
     * Changes the Backup Job permissions
     *
     * @param owner_u 1 to allow, 0 deny, -1 do not change
     * @param owner_m 1 to allow, 0 deny, -1 do not change
     * @param owner_a 1 to allow, 0 deny, -1 do not change
     * @param group_u 1 to allow, 0 deny, -1 do not change
     * @param group_m 1 to allow, 0 deny, -1 do not change
     * @param group_a 1 to allow, 0 deny, -1 do not change
     * @param other_u 1 to allow, 0 deny, -1 do not change
     * @param other_m 1 to allow, 0 deny, -1 do not change
     * @param other_a 1 to allow, 0 deny, -1 do not change
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chmod(int owner_u, int owner_m, int owner_a,
                             int group_u, int group_m, int group_a,
                             int other_u, int other_m, int other_a)
    {
        return chmod(client, id,
                    owner_u, owner_m, owner_a,
                    group_u, group_m, group_a,
                    other_u, other_m, other_a);
    }

    /**
     * Changes the permissions
     *
     * @param octet Permissions octed , e.g. 640
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chmod(String octet)
    {
        return chmod(client, id, octet);
    }

    /**
     * Changes the permissions
     *
     * @param octet Permissions octed , e.g. 640
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chmod(int octet)
    {
        return chmod(client, id, octet);
    }

    /**
     * Lock this Backup Job
     *
     * @param level Lock level.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse lock(int level)
    {
        return lock(client, id, level);
    }

    /**
     * Unlock this Backup Job
     *
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse unlock()
    {
        return unlock(client, id);
    }

    /**
     * Execute the Backup Job
     *
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse backup()
    {
        return backup(client, id);
    }

    /**
     * Cancel ongoing Backup Job
     *
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse cancel()
    {
        return cancel(client, id);
    }

    /**
     * Retry failed Backup Job, executes again backup for failed Virtual Machines
     *
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse retry()
    {
        return retry(client, id);
    }

    /**
     * Set priority for Backup Job, range for priority is 0-100.
     * Base value is 50, only admin user can set priority over 50
     *
     * @param priority New value for priority
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse priority(int prio)
    {
        return priority(client, id, prio);
    }

    /**
     * Add Scheduled Action to Backup Job
     *
     * @param template Scheduled Action template.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse schedadd(String template)
    {
        return schedadd(client, id, template);
    }

    /**
     * Update Backup Job Scheduled Action
     *
     * @param sa_id The Scheduled Action ID.
     * @param template Updated values for Scheduled Action.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse schedupdate(int sa_id, String template)
    {
        return schedupdate(client, id, sa_id, template);
    }

    /**
     * Delete Backup Job Scheduled Action
     *
     * @param sa_id The Scheduled Action ID.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse scheddelete(int sa_id)
    {
        return scheddelete(client, id, sa_id);
    }
}
