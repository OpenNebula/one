/*******************************************************************************
 * Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)
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
package org.opennebula.client;

import java.io.ByteArrayInputStream;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.Document;
import org.w3c.dom.Node;

public class OneSystem
{
    protected Client client;

    private static final String USER_QUOTA_INFO     = "userquota.info";
    private static final String USER_QUOTA_UPDATE   = "userquota.update";
    private static final String GROUP_QUOTA_INFO    = "groupquota.info";
    private static final String GROUP_QUOTA_UPDATE  = "groupquota.update";


    public OneSystem(Client client)
    {
        this.client = client;
    }

    /**
     * Gets the default user quota limits
     *
     * @return the default user quota in case of success, Error otherwise
     */
    public OneResponse getUserQuotas()
    {
        return client.call(USER_QUOTA_INFO);
    }

    /**
     * Gets the default user quota limits
     *
     * @return The xml root node in case of success, null otherwise
     */
    public Node getUserQuotasXML()
    {
        OneResponse r = getUserQuotas();
        Node xml = null;

        if (r.isError())
        {
            return null;
        }

        try
        {
            DocumentBuilder builder =
                DocumentBuilderFactory.newInstance().newDocumentBuilder();
            Document doc = builder.parse(
                new ByteArrayInputStream(r.getMessage().getBytes()));

            xml = doc.getDocumentElement();
        }
        catch (Exception e) {}

        return xml;
    }

    /**
     * Sets the default user quota limits
     *
     * @param quota a template (XML or txt) with the new quota limits
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse setUserQuotas(String quota)
    {
        return client.call(USER_QUOTA_UPDATE, quota);
    }

    /**
     * Gets the default group quota limits
     *
     * @return the default group quota in case of success, Error otherwise
     */
    public OneResponse getGroupQuotas()
    {
        return client.call(GROUP_QUOTA_INFO);
    }

    /**
     * Gets the default group quota limits
     *
     * @return The xml root node in case of success, null otherwise
     */
    public Node getGroupQuotasXML()
    {
        OneResponse r = getGroupQuotas();
        Node xml = null;

        if (r.isError())
        {
            return null;
        }

        try
        {
            DocumentBuilder builder =
                DocumentBuilderFactory.newInstance().newDocumentBuilder();
            Document doc = builder.parse(
                new ByteArrayInputStream(r.getMessage().getBytes()));

            xml = doc.getDocumentElement();
        }
        catch (Exception e) {}

        return xml;
    }

    /**
     * Sets the default group quota limits
     *
     * @param quota a template (XML or txt) with the new quota limits
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse setGroupQuotas(String quota)
    {
        return client.call(GROUP_QUOTA_UPDATE, quota);
    }
}
