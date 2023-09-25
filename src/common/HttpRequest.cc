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

#include "HttpRequest.h"
#include <iostream>

using namespace std;


HttpRequest::HttpRequest()
{
    curl_global_init(CURL_GLOBAL_ALL);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

HttpRequest::~HttpRequest()
{
    curl_global_cleanup();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HttpRequest::post_json(const std::string& url, const std::string& data, std::string& response)
{
    auto curl = curl_easy_init();

    if (!curl) return -1;

    auto headers = curl_slist_append(nullptr, "Accept: application/json");
    headers = curl_slist_append(headers, "Content-Type: application/json");

    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, data.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_to_string);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

    if (_timeout != 0)
    {
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, _timeout);
    }

    if (!_proxy.empty())
    {
        curl_easy_setopt(curl, CURLOPT_PROXY, _proxy);
    }

    auto ec = curl_easy_perform(curl);

    if (ec != CURLE_OK)
    {
        response = curl_easy_strerror(ec);

        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);

        return -1;
    }

    auto rc = check_http_code(curl, response);

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HttpRequest::get_json(const std::string& url, std::string& response)
{
    auto curl = curl_easy_init(); // todo use RAII to automatically clean up

    if (!curl) return -1;

    auto headers = curl_slist_append(nullptr, "Accept: application/json");

    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_NOPROGRESS, 1L);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_to_string);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

    if (_timeout != 0)
    {
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, _timeout);
    }

    if (!_proxy.empty())
    {
        curl_easy_setopt(curl, CURLOPT_PROXY, _proxy);
    }

    auto ec = curl_easy_perform(curl);

    if (ec != CURLE_OK)
    {
        response = curl_easy_strerror(ec);

        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);

        return -1;
    }

    auto rc = check_http_code(curl, response);

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

size_t HttpRequest::write_to_string(void *ptr, size_t size, size_t count, void *str)
{
    ((string*)str)->assign((char*)ptr, 0, size*count);
    return size*count;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HttpRequest::check_http_code(CURL* curl, std::string& msg)
{
    long http_code = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);

    if (http_code != 200)
    {
        msg = "Http code " + to_string(http_code) + ": " + msg;

        return -1;
    }

    return 0;
}