/*******************************************************************************
 * Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs
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

/**
 * This class encapsulates OpenNebula's XML-RPC responses. Each response
 * carries a boolean indicating if it is an error. It can also contain a
 * success message, or an error message.
 */
public class OneResponse{
    /**
     * Creates a new response.
     *
     * @param success Indicates if the call was successful, and if
     * the message is an error or an information string.
     * @param message String containing the response message, or
     * the error message.
     */
    public OneResponse(boolean success, String message)
    {
        this.success = success;
        this.msg     = message;
    }

    /**
     * Returns true if the call resulted in error.
     *
     * @return True if the call resulted in error.
     */
    public boolean isError()
    {
        return !success;
    }

    /**
     * Returns a string containing the error message, or null
     * if the response isn't an error.
     *
     * @return A string containing the error message, or null
     * if the response isn't an error.
     */
    public String getErrorMessage()
    {
        return success ? null : msg;
    }

    /**
     * Returns a string containing the response information, or
     * null if the response was an error. Note that the success
     * message could be also null.
     *
     * @return A string containing the response information, or
     * null if the response was an error. Note that the success
     * message could be also null.
     */
    public String getMessage()
    {
        return success ? msg : null;
    }

    /**
     * Parses the string returned by getMessage
     *
     * @return The parsed int, or Integer.MIN_VALUE in case of error
     *
     * @see #getMessage
     */
    public int getIntMessage()
    {
        int ret = Integer.MIN_VALUE;

        try
        {
            ret = Integer.parseInt( getMessage() );
        }
        catch (NumberFormatException e) {}

        return ret;
    }

    // ------------------------------------------------------------------------
    // PRIVATE ATTRIBUTES
    // ------------------------------------------------------------------------

    private boolean success;
    private String  msg;
}
