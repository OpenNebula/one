/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#include <curl/curl.h>
#include <string>

/* Class for sedning Http requests and receiving responses.
 * Note: Very simple implementation:
 *          - no consistency check
 *          - no checks if the response is in correct format
 *          - almost no error handling
 */
class HttpRequest
{
public:
    HttpRequest();

    ~HttpRequest();

    /** Send a POST request, receive response as JSON
     * @param url Address
     * @param data Data to send in json format
     * @param response In case of success full response from server in json format,
     *      the caller should extract the data from { json : {...} }.
     *      Contains error string in case of failure.
     * @return 0 on success, -1 otherwise
     */
    int post_json(const std::string& url, const std::string& data, std::string& response);

    int post_json(const std::string& data, std::string& response)
    {
        return post_json(_url, data, response);
    }

    /** Send a GET request, receive response as JSON
     * @param url Address
     * @param response In case of success full response from server in json format,
     *      the caller should extract the data from { json : {...} }.
     *      Contains error string in case of failure.
     * @return 0 on success, -1 otherwise
     */
    int get_json(const std::string& url, std::string& response);

    int get_json(std::string& response)
    {
        return get_json(_url, response);
    }

    bool is_initialized() const
    {
        return !_url.empty();
    }

    /**
     * Set server url adress, in the form "scheme://host:port/path "
     */
    void set_server(const std::string& url)
    {
        _url = url;
    }

    /**
     * Set maximum time in seconds that transfer operation can take.
     * 0 -> Use curl default value
     * See curl CURLOPT_TIMEOUT for more info
     */
    void set_timeout(long timeout)
    {
        _timeout = timeout;
    }

    /**
     * Set proxy server, including protocol and port. Example "http://example.com:1234"
     * See curl CURLOPT_PROXY for more info
     */
    void set_proxy(const std::string& proxy)
    {
        _proxy = proxy;
    }

private:
    /**
     * Callback method for writing response of curl operation to string
     * See curl CURLOPT_WRITEFUNCTION for more info
     */
    static size_t write_to_string(void *ptr, size_t size, size_t count, void *str);

    /**
     * Check curl response, eventually set error message
     * @param curl Pointer to curl handle
     * @param error Contains error message if any
     * @return 0 on success, -1 otherwise
     */
    static int check_http_code(CURL* curl, std::string& msg);

    /**
     * Server url adress
     */
    std::string _url;

    /**
     * Maximum time in seconds that transfer operation can take.
     * 0 -> Use curl default value
     */
    long _timeout = 0;

    /**
     * Curl proxy server, including the protocol and port.
     */
    std::string _proxy;
};
