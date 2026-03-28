/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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
/*--------------------------------------------------------------------------- */

package goca

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	errs "github.com/OpenNebula/one/src/oca/go/src/goca/errors"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"

	cleanhttp "github.com/hashicorp/go-cleanhttp"
	"github.com/kolo/xmlrpc"
)

// OneConfig contains the information to communicate with OpenNebula
type OneConfig struct {
	// Token is the authentication string. In the format of <user>:<password>
	Token string

	// Endpoint contains OpenNebula's XML-RPC API endpoint. Defaults to
	// http://localhost:2633/RPC2
	Endpoint string

	// Use gRPC protocol
	IsGRPC bool
}

// Client is a basic XML-RPC client implementing RPCCaller
type Client struct {
	url        string
	token      string
	httpClient *http.Client
}

type Response struct {
	status  bool
	body    string
	bodyInt int
}

// NewConfig returns a new OneConfig object with the specified user, password,
// and endpoint. It reads the ONEAPI_PROTOCOL to choose between GRPC and XML_RPC
func NewConfig(user, password, endpoint string) OneConfig {
	var conf OneConfig

	if user == "" && password == "" {
		oneAuthPath := os.Getenv("ONE_AUTH")
		if oneAuthPath == "" {
			oneAuthPath = os.Getenv("HOME") + "/.one/one_auth"
		}

		file, err := os.Open(oneAuthPath)
		if err != nil {
			log.Fatalln(err)
		}
		defer file.Close()

		scanner := bufio.NewScanner(file)

		scanner.Scan()
		if scanner.Err() != nil {
			log.Fatalln(scanner.Err())
		}

		conf.Token = scanner.Text()
	} else {
		conf.Token = user + ":" + password
	}

	conf.IsGRPC = os.Getenv("ONEAPI_PROTOCOL") == "grpc"

	if endpoint == "" {
		if conf.IsGRPC {
			conf.Endpoint = os.Getenv("ONE_GRPC")
			if conf.Endpoint == "" {
				conf.Endpoint = "localhost:2634"
			}
		} else {
			conf.Endpoint = os.Getenv("ONE_XMLRPC")
			if conf.Endpoint == "" {
				conf.Endpoint = "http://localhost:2633/RPC2"
			}
		}
	} else {
		conf.Endpoint = endpoint
	}

	return conf
}

// NewClientFromConfig returns a new OpenNebula client. It will be a gRPC or
// XML-RPC client depending on the configuration. Returns nil if configuration
// fails.
func NewClientFromConfig(conf OneConfig) (RPCCaller, error) {
	if conf.IsGRPC {
		return NewGRPCClient(conf.Token, conf.Endpoint)
	}
	return &Client{
		url:        conf.Endpoint,
		token:      conf.Token,
		httpClient: cleanhttp.DefaultPooledClient(),
	}, nil
}

// NewDefaultClient returns a new XML-RPC client.
// Deprecated: Use NewClientFromConfig to have support for XML-RPC and gRPC.
// This function is kept for backward compatibility and will
// panic if gRPC is configured.
func NewDefaultClient(conf OneConfig) *Client {
	client, err := NewClientFromConfig(conf)
	if err != nil {
		log.Fatalln("Error initializing the Client: ", err)
	}
	c, ok := client.(*Client)
	if !ok {
		log.Fatalln("NewDefaultClient is not compatible with gRPC. Use NewClientWithContext instead.")
	}
	return c
}

// NewClient return a new one client that allows setting a custom http.Client.
// If the httpClient is nil, it will return a NewDefaultClient
func NewClient(conf OneConfig, httpClient *http.Client) *Client {
	if httpClient == nil {
		return NewDefaultClient(conf)
	}
	return &Client{
		url:        conf.Endpoint,
		token:      conf.Token,
		httpClient: httpClient,
	}
}

// GetToken returns the authentication token
func (c *Client) GetToken() string {
	return c.token
}

// CallContext is an XML-RPC wrapper. It returns a pointer to response and an error and can be canceled through the passed context
func (c *Client) CallContext(ctx context.Context, method string, args ...interface{}) (*Response, error) {
	var (
		ok bool

		status  bool
		body    string
		bodyInt int64
		errCode int64
	)

	xmlArgs := make([]interface{}, len(args)+1)

	xmlArgs[0] = c.token
	copy(xmlArgs[1:], args[:])

	buf, err := xmlrpc.EncodeMethodCall(method, xmlArgs...)
	if err != nil {
		return nil,
			&errs.ClientError{Code: errs.ClientReqBuild, Msg: "xmlrpc request encoding", Err: err}
	}

	req, err := http.NewRequestWithContext(ctx, "POST", c.url, bytes.NewBuffer(buf))
	if err != nil {
		return nil,
			&errs.ClientError{Code: errs.ClientReqBuild, Msg: "http request build", Err: err}
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil,
			&errs.ClientError{Code: errs.ClientReqHTTP, Msg: "http make request", Err: err}
	}

	if resp.StatusCode/100 != 2 {
		return nil, &errs.ClientError{
			Code:     errs.ClientRespHTTP,
			Msg:      fmt.Sprintf("http status code: %d", resp.StatusCode),
			HttpResp: resp,
		}
	}

	respData, err := ioutil.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		return nil,
			&errs.ClientError{errs.ClientRespHTTP, "read http response body", resp, err}
	}

	// Server side XML-RPC library: xmlrpc-c
	xmlrpcResp := xmlrpc.Response(respData)

	// Handle the <fault> tag in the xml server response
	if err := xmlrpcResp.Err(); err != nil {
		return nil,
			&errs.ClientError{errs.ClientRespXMLRPCFault, "server response", resp, err}
	}

	result := []interface{}{}

	// Unmarshall the XML-RPC response
	if err := xmlrpcResp.Unmarshal(&result); err != nil {
		return nil,
			&errs.ClientError{errs.ClientRespXMLRPCParse, "unmarshal xmlrpc", resp, err}
	}

	// Parse according the XML-RPC OpenNebula API documentation
	status, ok = result[0].(bool)
	if ok == false {
		return nil,
			&errs.ClientError{errs.ClientRespONeParse, "index 0: boolean expected", resp, nil}
	}

	body, ok = result[1].(string)
	if ok == false {
		bodyInt, ok = result[1].(int64)
		if ok == false {
			return nil,
				&errs.ClientError{errs.ClientRespONeParse, "index 1: int or string expected", resp, nil}
		}
	}

	errCode, ok = result[2].(int64)
	if ok == false {
		return nil,
			&errs.ClientError{errs.ClientRespONeParse, "index 2: boolean expected", resp, nil}
	}

	if status == false {
		return nil, &errs.ResponseError{
			Code: errs.OneErrCode(errCode),
			Msg:  body,
		}
	}

	r := &Response{status, body, int(bodyInt)}

	return r, nil
}

// Body accesses the body of the response
func (r *Response) Body() string {
	return r.body
}

// BodyInt accesses the body of the response, if it's an int.
func (r *Response) BodyInt() int {
	return r.bodyInt
}

// ---------- ACL -------------------------------------------------------------

func (c *Client) AclCreateRule(ctx context.Context, user, resource, rights, zone string) (*Response, error) {
	return c.CallContext(ctx, "one.acl.addrule", user, resource, rights, zone)
}

func (c *Client) AclDelRule(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.acl.delrule", id)
}

func (c *Client) AclInfo(ctx context.Context) (*Response, error) {
	return c.CallContext(ctx, "one.acl.info")
}

// ---------- Backup Job ------------------------------------------------------

func (c *Client) BackupJobAllocate(ctx context.Context, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.backupjob.allocate", tmpl)
}

func (c *Client) BackupJobDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.backupjob.delete", int32(id))
}

func (c *Client) BackupJobInfo(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.backupjob.info", int32(id))
}

func (c *Client) BackupJobUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.backupjob.update", int32(id), tmpl, uType)
}

func (c *Client) BackupJobRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.backupjob.rename", int32(id), name)
}

func (c *Client) BackupJobChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	args := append([]interface{}{id}, perm.ToArgs()...)

	return c.CallContext(ctx, "one.backupjob.chmod", args...)
}

func (c *Client) BackupJobChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	return c.CallContext(ctx, "one.backupjob.chown", int32(id), uid, gid)
}

func (c *Client) BackupJobLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	return c.CallContext(ctx, "one.backupjob.lock", int32(id), level, test)
}

func (c *Client) BackupJobUnlock(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.backupjob.unlock", int32(id))
}

func (c *Client) BackupJobBackup(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.backupjob.backup", int32(id))
}

func (c *Client) BackupJobCancel(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.backupjob.cancel", int32(id))
}

func (c *Client) BackupJobRetry(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.backupjob.retry", int32(id))
}

func (c *Client) BackupJobPriority(ctx context.Context, id, priority int) (*Response, error) {
	return c.CallContext(ctx, "one.backupjob.priority", int32(id), priority)
}

func (c *Client) BackupJobSchedAdd(ctx context.Context, id int, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.backupjob.schedadd", int32(id), tmpl)
}

func (c *Client) BackupJobSchedDel(ctx context.Context, id, sa_id int) (*Response, error) {
	return c.CallContext(ctx, "one.backupjob.scheddelete", int32(id), sa_id)
}

func (c *Client) BackupJobSchedUpdate(ctx context.Context, id, sa_id int, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.backupjob.schedupdate", int32(id), sa_id, tmpl)
}

func (c *Client) BackupJobPoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	return c.CallContext(ctx, "one.backupjobpool.info", filter, start, end)
}

// ---------- Cluster ---------------------------------------------------------

func (c *Client) ClusterAllocate(ctx context.Context, name string) (*Response, error) {
	return c.CallContext(ctx, "one.cluster.allocate", name)
}

func (c *Client) ClusterDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.cluster.delete", id)
}

func (c *Client) ClusterInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.cluster.info", id, decrypt)
}

func (c *Client) ClusterUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.cluster.update", id, tmpl, uType)
}

func (c *Client) ClusterRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.cluster.rename", id, name)
}

func (c *Client) ClusterAddHost(ctx context.Context, id, host_id int) (*Response, error) {
	return c.CallContext(ctx, "one.cluster.addhost", id, host_id)
}

func (c *Client) ClusterDelHost(ctx context.Context, id, host_id int) (*Response, error) {
	return c.CallContext(ctx, "one.cluster.delhost", id, host_id)
}

func (c *Client) ClusterAddDatastore(ctx context.Context, id, ds_id int) (*Response, error) {
	return c.CallContext(ctx, "one.cluster.adddatastore", id, ds_id)
}

func (c *Client) ClusterDelDatastore(ctx context.Context, id, ds_id int) (*Response, error) {
	return c.CallContext(ctx, "one.cluster.deldatastore", id, ds_id)
}

func (c *Client) ClusterAddVnet(ctx context.Context, id, net_id int) (*Response, error) {
	return c.CallContext(ctx, "one.cluster.addvnet", id, net_id)
}

func (c *Client) ClusterDelVnet(ctx context.Context, id, net_id int) (*Response, error) {
	return c.CallContext(ctx, "one.cluster.delvnet", id, net_id)
}

func (c *Client) ClusterOptimize(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.cluster.optimize", id)
}

func (c *Client) ClusterPlanExecute(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.cluster.planexecute", id)
}

func (c *Client) ClusterPlanDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.cluster.plandelete", id)
}

func (c *Client) ClusterPoolInfo(ctx context.Context) (*Response, error) {
	return c.CallContext(ctx, "one.clusterpool.info")
}

// ---------- Datastore -------------------------------------------------------

func (c *Client) DatastoreAllocate(ctx context.Context, tmpl string, cluster int) (*Response, error) {
	return c.CallContext(ctx, "one.datastore.allocate", tmpl, cluster)
}

func (c *Client) DatastoreDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.datastore.delete", id)
}

func (c *Client) DatastoreInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.datastore.info", id, decrypt)
}

func (c *Client) DatastoreUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.datastore.update", id, tmpl, uType)
}

func (c *Client) DatastoreRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.datastore.rename", id, name)
}

func (c *Client) DatastoreChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	args := append([]interface{}{id}, perm.ToArgs()...)

	return c.CallContext(ctx, "one.datastore.chmod", args...)
}

func (c *Client) DatastoreChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	return c.CallContext(ctx, "one.datastore.chown", id, uid, gid)
}

func (c *Client) DatastoreEnable(ctx context.Context, id int, enable bool) (*Response, error) {
	return c.CallContext(ctx, "one.datastore.enable", id, enable)
}

func (c *Client) DatastorePoolInfo(ctx context.Context) (*Response, error) {
	return c.CallContext(ctx, "one.datastorepool.info")
}

// ---------- Document --------------------------------------------------------

func (c *Client) DocumentAllocate(ctx context.Context, tmpl string, docType int) (*Response, error) {
	return c.CallContext(ctx, "one.document.allocate", tmpl, docType)
}

func (c *Client) DocumentDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.document.delete", id)
}

func (c *Client) DocumentInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.document.info", id, decrypt)
}

func (c *Client) DocumentUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.document.update", id, tmpl, uType)
}

func (c *Client) DocumentRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.document.rename", id, name)
}

func (c *Client) DocumentChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	args := append([]interface{}{id}, perm.ToArgs()...)

	return c.CallContext(ctx, "one.document.chmod", args...)
}

func (c *Client) DocumentChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	return c.CallContext(ctx, "one.document.chown", id, uid, gid)
}

func (c *Client) DocumentLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	return c.CallContext(ctx, "one.document.lock", id, level, test)
}

func (c *Client) DocumentUnlock(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.document.unlock", id)
}

func (c *Client) DocumentClone(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.document.clone", id, name)
}

func (c *Client) DocumentPoolInfo(ctx context.Context, filter, start, end, docType int) (*Response, error) {
	return c.CallContext(ctx, "one.documentpool.info", filter, start, end)
}

// ---------- Group -----------------------------------------------------------

func (c *Client) GroupAllocate(ctx context.Context, name string) (*Response, error) {
	return c.CallContext(ctx, "one.group.allocate", name)
}

func (c *Client) GroupDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.group.delete", id)
}

func (c *Client) GroupInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.group.info", id, decrypt)
}

func (c *Client) GroupUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.group.update", id, tmpl, uType)
}

func (c *Client) GroupAddAdmin(ctx context.Context, id, user_id int) (*Response, error) {
	return c.CallContext(ctx, "one.group.addadmin", id, user_id)
}

func (c *Client) GroupDelAdmin(ctx context.Context, id, user_id int) (*Response, error) {
	return c.CallContext(ctx, "one.group.deladmin", id, user_id)
}

func (c *Client) GroupQuota(ctx context.Context, id int, quota string) (*Response, error) {
	return c.CallContext(ctx, "one.group.quota", id, quota)
}

func (c *Client) GroupDefaultQuotaInfo(ctx context.Context) (*Response, error) {
	return c.CallContext(ctx, "one.groupquota.info")
}

func (c *Client) GroupDefaultQuotaUpdate(ctx context.Context, quota string) (*Response, error) {
	return c.CallContext(ctx, "one.groupquota.update", quota)
}

func (c *Client) GroupPoolInfo(ctx context.Context) (*Response, error) {
	return c.CallContext(ctx, "one.grouppool.info")
}

// ---------- Hook ------------------------------------------------------------

func (c *Client) HookAllocate(ctx context.Context, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.hook.allocate", tmpl)
}

func (c *Client) HookDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.hook.delete", id)
}

func (c *Client) HookInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.hook.info", id, decrypt)
}

func (c *Client) HookUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.hook.update", id, tmpl, uType)
}

func (c *Client) HookRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.hook.rename", id, name)
}

func (c *Client) HookLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	return c.CallContext(ctx, "one.hook.lock", id, level, test)
}

func (c *Client) HookUnlock(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.hook.unlock", id)
}

func (c *Client) HookRetry(ctx context.Context, id, exe_id int) (*Response, error) {
	return c.CallContext(ctx, "one.hook.retry", id, exe_id)
}

func (c *Client) HookPoolInfo(ctx context.Context) (*Response, error) {
	return c.CallContext(ctx, "one.hookpool.info")
}

func (c *Client) HookLogInfo(ctx context.Context, start, end, hook_id, rc_hook int) (*Response, error) {
	return c.CallContext(ctx, "one.hooklog.info", start, end, hook_id, rc_hook)
}

// ---------- Host ------------------------------------------------------------

func (c *Client) HostAllocate(ctx context.Context, name, im_mad, vm_mad string, cluster int) (*Response, error) {
	return c.CallContext(ctx, "one.host.allocate", name, im_mad, vm_mad, cluster)
}

func (c *Client) HostDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.host.delete", id)
}

func (c *Client) HostInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.host.info", id, decrypt)
}

func (c *Client) HostUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.host.update", id, tmpl, uType)
}

func (c *Client) HostRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.host.rename", id, name)
}

func (c *Client) HostStatus(ctx context.Context, id, status int) (*Response, error) {
	return c.CallContext(ctx, "one.host.status", id, status)
}

func (c *Client) HostMonitoring(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.host.monitoring", id)
}

func (c *Client) HostPoolInfo(ctx context.Context) (*Response, error) {
	return c.CallContext(ctx, "one.hostpool.info")
}

func (c *Client) HostPoolMonitoring(ctx context.Context, seconds int) (*Response, error) {
	return c.CallContext(ctx, "one.hostpool.monitoring", seconds)
}

// ---------- Image -----------------------------------------------------------

func (c *Client) ImageAllocate(ctx context.Context, tmpl string, dsid uint, skip_capacity_check bool) (*Response, error) {
	return c.CallContext(ctx, "one.image.allocate", tmpl, dsid, skip_capacity_check)
}

func (c *Client) ImageDelete(ctx context.Context, id int, force bool) (*Response, error) {
	return c.CallContext(ctx, "one.image.delete", id, force)
}

func (c *Client) ImageInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.image.info", id, decrypt)
}

func (c *Client) ImageUpdate(ctx context.Context, id int, tmpl string, append int) (*Response, error) {
	return c.CallContext(ctx, "one.image.update", id, tmpl, append)
}

func (c *Client) ImageRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.image.rename", id, name)
}

func (c *Client) ImageChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	args := append([]interface{}{id}, perm.ToArgs()...)

	return c.CallContext(ctx, "one.image.chmod", args...)
}

func (c *Client) ImageChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	return c.CallContext(ctx, "one.image.chown", id, uid, gid)
}

func (c *Client) ImageLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	return c.CallContext(ctx, "one.image.lock", id, level, test)
}

func (c *Client) ImageUnlock(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.image.unlock", id)
}

func (c *Client) ImageClone(ctx context.Context, id int, name string, dsid int) (*Response, error) {
	return c.CallContext(ctx, "one.image.clone", id, name, dsid)
}

func (c *Client) ImageEnable(ctx context.Context, id int, enable bool) (*Response, error) {
	return c.CallContext(ctx, "one.image.enable", id, enable)
}

func (c *Client) ImagePersistent(ctx context.Context, id int, persistent bool) (*Response, error) {
	return c.CallContext(ctx, "one.image.persistent", id, persistent)
}

func (c *Client) ImageChtype(ctx context.Context, id int, new_type string) (*Response, error) {
	return c.CallContext(ctx, "one.image.chtype", id, new_type)
}

func (c *Client) ImageSnapshotDelete(ctx context.Context, id, snap_id int) (*Response, error) {
	return c.CallContext(ctx, "one.image.snapshotdelete", id, snap_id)
}

func (c *Client) ImageSnapshotRevert(ctx context.Context, id, snap_id int) (*Response, error) {
	return c.CallContext(ctx, "one.image.snapshotrevert", id, snap_id)
}

func (c *Client) ImageSnapshotFlatten(ctx context.Context, id, snap_id int) (*Response, error) {
	return c.CallContext(ctx, "one.image.snapshotflatten", id, snap_id)
}

func (c *Client) ImageResize(ctx context.Context, id int, newSize string) (*Response, error) {
	return c.CallContext(ctx, "one.image.resize", id, newSize)
}

func (c *Client) ImageRestore(ctx context.Context, id, dsid int, opt_tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.image.restore", id, dsid, opt_tmpl)
}

func (c *Client) ImagePoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	return c.CallContext(ctx, "one.imagepool.info", filter, start, end);
}

func (c *Client) UserAllocate(ctx context.Context, name, password, driver string, groupIDs []int) (*Response, error) {
	return c.CallContext(ctx, "one.user.allocate", name, password, driver, groupIDs)
}

// ---------- Marketplace -----------------------------------------------------

func (c *Client) MarketAllocate(ctx context.Context, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.market.allocate", tmpl)
}

func (c *Client) MarketDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.market.delete", id)
}

func (c *Client) MarketInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.market.info", id, decrypt)
}

func (c *Client) MarketUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.market.update", id, tmpl, uType)
}

func (c *Client) MarketRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.market.rename", id, name)
}

func (c *Client) MarketChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	args := append([]interface{}{id}, perm.ToArgs()...)

	return c.CallContext(ctx, "one.market.chmod", args...)
}

func (c *Client) MarketChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	return c.CallContext(ctx, "one.market.chown", id, uid, gid)
}

func (c *Client) MarketEnable(ctx context.Context, id int, enable bool) (*Response, error) {
	return c.CallContext(ctx, "one.market.enable", id, enable)
}

func (c *Client) MarketPoolInfo(ctx context.Context) (*Response, error) {
	return c.CallContext(ctx, "one.marketpool.info")
}

// ---------- Marketplace App -------------------------------------------------

func (c *Client) MarketAppAllocate(ctx context.Context, tmpl string, market_id int) (*Response, error) {
	return c.CallContext(ctx, "one.marketapp.allocate", tmpl, market_id)
}

func (c *Client) MarketAppDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.marketapp.delete", id)
}

func (c *Client) MarketAppInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.marketapp.info", id, decrypt)
}

func (c *Client) MarketAppUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.marketapp.update", id, tmpl, uType)
}

func (c *Client) MarketAppRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.marketapp.rename", id, name)
}

func (c *Client) MarketAppChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	args := append([]interface{}{id}, perm.ToArgs()...)

	return c.CallContext(ctx, "one.marketapp.chmod", args...)
}

func (c *Client) MarketAppChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	return c.CallContext(ctx, "one.marketapp.chown", id, uid, gid)
}

func (c *Client) MarketAppLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	return c.CallContext(ctx, "one.marketapp.lock", id, level, test)
}

func (c *Client) MarketAppUnlock(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.marketapp.unlock", id)
}

func (c *Client) MarketAppEnable(ctx context.Context, id int, enable bool) (*Response, error) {
	return c.CallContext(ctx, "one.marketapp.enable", id, enable)
}

func (c *Client) MarketAppPoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	return c.CallContext(ctx, "one.marketapppool.info", filter, start, end)
}

// ---------- Security Group --------------------------------------------------

func (c *Client) SecGroupAllocate(ctx context.Context, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.secgroup.allocate", tmpl)
}

func (c *Client) SecGroupDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.secgroup.delete", id)
}

func (c *Client) SecGroupInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.secgroup.info", id, decrypt)
}

func (c *Client) SecGroupUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.secgroup.update", id, tmpl, uType)
}

func (c *Client) SecGroupRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.secgroup.rename", id, name)
}

func (c *Client) SecGroupChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	args := append([]interface{}{id}, perm.ToArgs()...)

	return c.CallContext(ctx, "one.secgroup.chmod", args...)
}

func (c *Client) SecGroupChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	return c.CallContext(ctx, "one.secgroup.chown", id, uid, gid)
}

func (c *Client) SecGroupClone(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.secgroup.clone", id, name)
}

func (c *Client) SecGroupCommit(ctx context.Context, id int, recovery bool) (*Response, error) {
	return c.CallContext(ctx, "one.secgroup.commit", id, recovery)
}

func (c *Client) SecGroupPoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	return c.CallContext(ctx, "one.secgrouppool.info", filter, start, end)
}

// ---------- Template --------------------------------------------------------

func (c *Client) TemplateAllocate(ctx context.Context, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.template.allocate", tmpl)
}

func (c *Client) TemplateDelete(ctx context.Context, id int, recursive bool) (*Response, error) {
	return c.CallContext(ctx, "one.template.delete", id, recursive)
}

func (c *Client) TemplateInfo(ctx context.Context, id int, extended, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.template.info", id, extended, decrypt)
}

func (c *Client) TemplateUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.template.update", id, tmpl, uType)
}

func (c *Client) TemplateRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.template.rename", id, name)
}

func (c *Client) TemplateChmod(ctx context.Context, id int, perm shared.Permissions, recursive bool) (*Response, error) {
	args := append([]interface{}{id}, perm.ToArgs()...)
	return c.CallContext(ctx, "one.template.chmod", append(args, recursive)...)
}

func (c *Client) TemplateChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	return c.CallContext(ctx, "one.template.chown", id, uid, gid)
}

func (c *Client) TemplateLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	return c.CallContext(ctx, "one.template.lock", id, level, test)
}

func (c *Client) TemplateUnlock(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.template.unlock", id)
}

func (c *Client) TemplateClone(ctx context.Context, id int, name string, recursive bool) (*Response, error) {
	return c.CallContext(ctx, "one.template.clone", id, name, recursive)
}

func (c *Client) TemplateInstantiate(ctx context.Context, id int, name string, hold bool, extra_tmpl string, persistent bool) (*Response, error) {
	return c.CallContext(ctx, "one.template.instantiate", id, name, hold, extra_tmpl, persistent)
}

func (c *Client) TemplatePoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	return c.CallContext(ctx, "one.templatepool.info", filter, start, end)
}

// ---------- User ------------------------------------------------------------

func (c *Client) UserDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.user.delete", id)
}

func (c *Client) UserInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.user.info", id, decrypt)
}

func (c *Client) UserUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.user.update", id, tmpl, uType)
}

func (c *Client) UserAddGroup(ctx context.Context, id int, groupID int) (*Response, error) {
	return c.CallContext(ctx, "one.user.addgroup", id, groupID)
}

func (c *Client) UserChangeAuth(ctx context.Context, id int, authDriver, password string) (*Response, error) {
	return c.CallContext(ctx, "one.user.chauth", id, authDriver, password)
}

func (c *Client) UserChangeGroup(ctx context.Context, id int, groupID int) (*Response, error) {
	return c.CallContext(ctx, "one.user.chgrp", id, groupID)
}

func (c *Client) UserDelGroup(ctx context.Context, id int, groupID int) (*Response, error) {
	return c.CallContext(ctx, "one.user.delgroup", id, groupID)
}

func (c *Client) UserEnable(ctx context.Context, id int, enable bool) (*Response, error) {
	return c.CallContext(ctx, "one.user.enable", id, enable)
}

func (c *Client) UserLogin(ctx context.Context, uname, token string, validTime, effectiveGID int) (*Response, error) {
	return c.CallContext(ctx, "one.user.login", uname, token, validTime, effectiveGID)
}

func (c *Client) UserPassword(ctx context.Context, id int, password string) (*Response, error) {
	return c.CallContext(ctx, "one.user.passwd", id, password)
}

func (c *Client) UserQuota(ctx context.Context, id int, quota string) (*Response, error) {
	return c.CallContext(ctx, "one.user.quota", id, quota)
}

func (c *Client) UserDefaultQuotaInfo(ctx context.Context) (*Response, error) {
	return c.CallContext(ctx, "one.userquota.info")
}

func (c *Client) UserDefaultQuotaUpdate(ctx context.Context, quota string) (*Response, error) {
	return c.CallContext(ctx, "one.userquota.update", quota)
}

func (c *Client) UserPoolInfo(ctx context.Context) (*Response, error) {
	return c.CallContext(ctx, "one.userpool.info")
}

// ---------- VDC -------------------------------------------------------------

func (c *Client) VdcAllocate(ctx context.Context, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vdc.allocate", tmpl)
}

func (c *Client) VdcDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.vdc.delete", id)
}

func (c *Client) VdcInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.vdc.info", id, decrypt)
}

func (c *Client) VdcUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.vdc.update", id, tmpl, uType)
}

func (c *Client) VdcRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.vdc.rename", id, name)
}

func (c *Client) VdcAddGroup(ctx context.Context, id, group int) (*Response, error) {
	return c.CallContext(ctx, "one.vdc.addgroup", id, group)
}

func (c *Client) VdcDelGroup(ctx context.Context, id, group int) (*Response, error) {
	return c.CallContext(ctx, "one.vdc.delgroup", id, group)
}

func (c *Client) VdcAddCluster(ctx context.Context, id, zone, cluster int) (*Response, error) {
	return c.CallContext(ctx, "one.vdc.addcluster", id, zone, cluster)
}

func (c *Client) VdcDelCluster(ctx context.Context, id, zone, cluster int) (*Response, error) {
	return c.CallContext(ctx, "one.vdc.delcluster", id, zone, cluster)
}

func (c *Client) VdcAddHost(ctx context.Context, id, zone, host int) (*Response, error) {
	return c.CallContext(ctx, "one.vdc.addhost", id, zone, host)
}

func (c *Client) VdcDelHost(ctx context.Context, id, zone, host int) (*Response, error) {
	return c.CallContext(ctx, "one.vdc.delhost", id, zone, host)
}

func (c *Client) VdcAddDatastore(ctx context.Context, id, zone, ds int) (*Response, error) {
	return c.CallContext(ctx, "one.vdc.adddatastore", id, zone, ds)
}

func (c *Client) VdcDelDatastore(ctx context.Context, id, zone, ds int) (*Response, error) {
	return c.CallContext(ctx, "one.vdc.deldatastore", id, zone, ds)
}

func (c *Client) VdcAddVnet(ctx context.Context, id, zone, net int) (*Response, error) {
	return c.CallContext(ctx, "one.vdc.addvnet", id, zone, net)
}

func (c *Client) VdcDelVnet(ctx context.Context, id, zone, net int) (*Response, error) {
	return c.CallContext(ctx, "one.vdc.delvnet", id, zone, net)
}

func (c *Client) VdcPoolInfo(ctx context.Context) (*Response, error) {
	return c.CallContext(ctx, "one.vdcpool.info")
}

// ---------- Virtual Machine -------------------------------------------------

func (c *Client) VMAllocate(ctx context.Context, tmpl string, hold bool) (*Response, error) {
	return c.CallContext(ctx, "one.vm.allocate", tmpl, hold)
}

func (c *Client) VMInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.vm.info", id, decrypt)
}

func (c *Client) VMUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.update", id, tmpl, uType)
}

func (c *Client) VMRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.vm.rename", id, name)
}

func (c *Client) VMChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	args := append([]interface{}{id}, perm.ToArgs()...)
	return c.CallContext(ctx, "one.vm.chmod", args...)
}

func (c *Client) VMChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.chown", id, uid, gid)
}

func (c *Client) VMLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	return c.CallContext(ctx, "one.vm.lock", id, level, test)
}

func (c *Client) VMUnlock(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.unlock", id)
}

func (c *Client) VMDeploy(ctx context.Context, id, hid int, no_overcommit bool, ds_id int, nic_tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vm.deploy", id, hid, no_overcommit, ds_id, nic_tmpl)
}

func (c *Client) VMAction(ctx context.Context, action string, id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.action", action, id)
}

func (c *Client) VMMigrate(ctx context.Context, id, hid int, live, no_overcommit bool, ds_id, migration_type int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.migrate", id, hid, live, no_overcommit, ds_id, migration_type)
}

func (c *Client) VMDiskSaveAs(ctx context.Context, id, disk_id int, name, image_type string, snap_id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.disksaveas", id, disk_id, name, image_type, snap_id)
}

func (c *Client) VMDiskSnapshotCreate(ctx context.Context, id, disk_id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.vm.disksnapshotcreate", id, disk_id, name)
}

func (c *Client) VMDiskSnapshotDelete(ctx context.Context, id, disk_id, snap_id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.disksnapshotdelete", id, disk_id, snap_id)
}

func (c *Client) VMDiskSnapshotRevert(ctx context.Context, id, disk_id, snap_id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.disksnapshotrevert", id, disk_id, snap_id)
}

func (c *Client) VMDiskSnapshotRename(ctx context.Context, id, disk_id, snap_id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.vm.disksnapshotrename", id, disk_id, snap_id, name)
}

func (c *Client) VMDiskAttach(ctx context.Context, id int, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vm.attach", id, tmpl)
}

func (c *Client) VMDiskDetach(ctx context.Context, id, disk_id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.detach", id, disk_id)
}

func (c *Client) VMDiskResize(ctx context.Context, id, disk_id int, size string) (*Response, error) {
	return c.CallContext(ctx, "one.vm.diskresize", id, disk_id, size)
}

func (c *Client) VMNicAttach(ctx context.Context, id int, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vm.attachnic", id, tmpl)
}

func (c *Client) VMNicDetach(ctx context.Context, id, nic_id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.detachnic", id, nic_id)
}

func (c *Client) VMNicUpdate(ctx context.Context, id, nic_id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.updatenic", id, nic_id, tmpl, uType)
}

func (c *Client) VMSGAttach(ctx context.Context, id, nic_id, sg_id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.attachsg", id, nic_id, sg_id)
}

func (c *Client) VMSGDetach(ctx context.Context, id, nic_id, sg_id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.detachsg", id, nic_id, sg_id)
}

func (c *Client) VMSnapshotCreate(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.vm.snapshotcreate", id, name)
}

func (c *Client) VMSnapshotDelete(ctx context.Context, id, snap_id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.snapshotdelete", id, snap_id)
}

func (c *Client) VMSnapshotRevert(ctx context.Context, id, snap_id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.snapshotrevert", id, snap_id)
}

func (c *Client) VMResize(ctx context.Context, id int, tmpl string, no_overcommit bool) (*Response, error) {
	return c.CallContext(ctx, "one.vm.resize", id, tmpl, no_overcommit)
}

func (c *Client) VMUpdateConf(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.updateconf", id, tmpl)
}

func (c *Client) VMRecover(ctx context.Context, id, operation int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.recover", id, operation)
}

func (c *Client) VMMonitoring(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.monitoring", id)
}

func (c *Client) VMSchedAdd(ctx context.Context, id int, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vm.schedadd", id, tmpl)
}

func (c *Client) VMSchedUpdate(ctx context.Context, id, sched_id int, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vm.schedupdate", id, sched_id, tmpl)
}

func (c *Client) VMSchedDelete(ctx context.Context, id, sched_id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.scheddelete", id, sched_id)
}

func (c *Client) VMBackup(ctx context.Context, id, ds_id int, reset bool) (*Response, error) {
	return c.CallContext(ctx, "one.vm.backup", id, ds_id, reset)
}

func (c *Client) VMBackupCancel(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.backupcancel", id)
}

func (c *Client) VMRestore(ctx context.Context, id, image_id, inc_id, disk_id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.restore", id, image_id, inc_id, disk_id)
}

func (c *Client) VMPciAttach(ctx context.Context, id int, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vm.attachpci", id, tmpl)
}

func (c *Client) VMPciDetach(ctx context.Context, id, pci_id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.detachpci", id, pci_id)
}

func (c *Client) VMExec(ctx context.Context, id int, cmd string, cmd_stdin string) (*Response, error) {
	return c.CallContext(ctx, "one.vm.exec", id, cmd, cmd_stdin)
}

func (c *Client) VMExecRetry(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.retryexec", id)
}

func (c *Client) VMExecCancel(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.vm.cancelexec", id)
}

func (c *Client) VMPoolInfo(ctx context.Context, filter, start, end, state int, filter_str string) (*Response, error) {
	return c.CallContext(ctx, "one.vmpool.info", filter, start, end, state, filter_str)
}

func (c *Client) VMPoolInfoExtended(ctx context.Context, filter, start, end, state int, filter_str string) (*Response, error) {
	return c.CallContext(ctx, "one.vmpool.infoextended", filter, start, end, state, filter_str)
}

func (c *Client) VMPoolInfoSet(ctx context.Context, ids string, extended bool) (*Response, error) {
	return c.CallContext(ctx, "one.vmpool.infoset", ids, extended)
}

func (c *Client) VMPoolMonitoring(ctx context.Context, filter, seconds int) (*Response, error) {
	return c.CallContext(ctx, "one.vmpool.monitoring", filter, seconds)
}

func (c *Client) VMPoolAccounting(ctx context.Context, filter, start, end int) (*Response, error) {
	return c.CallContext(ctx, "one.vmpool.accounting", filter, start, end)
}

func (c *Client) VMPoolShowback(ctx context.Context, filter, start_month, start_year, end_month, end_year int) (*Response, error) {
	return c.CallContext(ctx, "one.vmpool.showback", filter, start_month, start_year, end_month, end_year)
}

func (c *Client) VMPoolShowbackCalculate(ctx context.Context, start_month, start_year, end_month, end_year int) (*Response, error) {
	return c.CallContext(ctx, "one.vmpool.calculateshowback", start_month, start_year, end_month, end_year)
}

// ---------- VM Group --------------------------------------------------------

func (c *Client) VMGroupAllocate(ctx context.Context, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vmgroup.allocate", tmpl)
}

func (c *Client) VMGroupDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.vmgroup.delete", id)
}

func (c *Client) VMGroupInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.vmgroup.info", id, decrypt)
}

func (c *Client) VMGroupUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.vmgroup.update", id, tmpl, uType)
}

func (c *Client) VMGroupRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.vmgroup.rename", id, name)
}

func (c *Client) VMGroupChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	args := append([]interface{}{id}, perm.ToArgs()...)

	return c.CallContext(ctx, "one.vmgroup.chmod", args...)
}

func (c *Client) VMGroupChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	return c.CallContext(ctx, "one.vmgroup.chown", id, uid, gid)
}

func (c *Client) VMGroupLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	return c.CallContext(ctx, "one.vmgroup.lock", id, level, test)
}

func (c *Client) VMGroupUnlock(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.vmgroup.unlock", id)
}

func (c *Client) VMGroupRoleAdd(ctx context.Context, id int, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vmgroup.roleadd", id, tmpl)
}

func (c *Client) VMGroupRoleDelete(ctx context.Context, id, role_id int) (*Response, error) {
	return c.CallContext(ctx, "one.vmgroup.roledelete", id, role_id)
}

func (c *Client) VMGroupRoleUpdate(ctx context.Context, id, role_id int, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vmgroup.roleupdate", id, role_id, tmpl)
}

func (c *Client) VMGroupPoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	return c.CallContext(ctx, "one.vmgrouppool.info", filter, start, end)
}

// ---------- Virtual Network -------------------------------------------------

func (c *Client) VNetAllocate(ctx context.Context, tmpl string, cluster int) (*Response, error) {
	return c.CallContext(ctx, "one.vn.allocate", tmpl, cluster)
}

func (c *Client) VNetDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.vn.delete", id)
}

func (c *Client) VNetInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.vn.info", id, decrypt)
}

func (c *Client) VNetUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.vn.update", id, tmpl, uType)
}

func (c *Client) VNetRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.vn.rename", id, name)
}

func (c *Client) VNetChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	args := append([]interface{}{id}, perm.ToArgs()...)

	return c.CallContext(ctx, "one.vn.chmod", args...)
}

func (c *Client) VNetChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	return c.CallContext(ctx, "one.vn.chown", id, uid, gid)
}

func (c *Client) VNetLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	return c.CallContext(ctx, "one.vn.lock", id, level, test)
}

func (c *Client) VNetUnlock(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.vn.unlock", id)
}

func (c *Client) VNetAddAR(ctx context.Context, id int, tmpl string ) (*Response, error) {
	return c.CallContext(ctx, "one.vn.add_ar", id, tmpl)
}

func (c *Client) VNetRmAR(ctx context.Context, id, ar_id int, force bool) (*Response, error) {
	return c.CallContext(ctx, "one.vn.rm_ar", id, ar_id, force)
}

func (c *Client) VNetUpdateAR(ctx context.Context, id int, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vn.update_ar", id, tmpl)
}

func (c *Client) VNetReserve(ctx context.Context, id int, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vn.reserve", id, tmpl)
}

func (c *Client) VNetFreeAR(ctx context.Context, id, ar_id int) (*Response, error) {
	return c.CallContext(ctx, "one.vn.free_ar", id, ar_id)
}

func (c *Client) VNetHold(ctx context.Context, id int, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vn.hold", id, tmpl)
}

func (c *Client) VNetRelease(ctx context.Context, id int, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vn.release", id, tmpl)
}

func (c *Client) VNetRecover(ctx context.Context, id, operation int) (*Response, error) {
	return c.CallContext(ctx, "one.vn.recover", id, operation)
}

func (c *Client) VNetPoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	return c.CallContext(ctx, "one.vnpool.info", filter, start, end)
}

// ---------- Virtual Network -------------------------------------------------

func (c *Client) VNTemplateAllocate(ctx context.Context, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vntemplate.allocate", tmpl)
}

func (c *Client) VNTemplateDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.vntemplate.delete", id)
}

func (c *Client) VNTemplateInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.vntemplate.info", id, decrypt)
}

func (c *Client) VNTemplateUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.vntemplate.update", id, tmpl, uType)
}

func (c *Client) VNTemplateRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.vntemplate.rename", id, name)
}

func (c *Client) VNTemplateChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	args := append([]interface{}{id}, perm.ToArgs()...)

	return c.CallContext(ctx, "one.vntemplate.chmod", args...)
}

func (c *Client) VNTemplateChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	return c.CallContext(ctx, "one.vntemplate.chown", id, uid, gid)
}

func (c *Client) VNTemplateLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	return c.CallContext(ctx, "one.vntemplate.lock", id, level, test)
}

func (c *Client) VNTemplateUnlock(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.vntemplate.unlock", id)
}

func (c *Client) VNTemplateClone(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.vntemplate.clone", id, name)
}

func (c *Client) VNTemplateInstantiate(ctx context.Context, id int, name, extra_tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vntemplate.instantiate", id, name, extra_tmpl)
}

func (c *Client) VNTemplatePoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	return c.CallContext(ctx, "one.vntemplatepool.info", filter, start, end)
}

// ---------- Virtual Router --------------------------------------------------

func (c *Client) VRouterAllocate(ctx context.Context, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vrouter.allocate", tmpl)
}

func (c *Client) VRouterDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.vrouter.delete", id)
}

func (c *Client) VRouterInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.vrouter.info", id, decrypt)
}

func (c *Client) VRouterUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.vrouter.update", id, tmpl, uType)
}

func (c *Client) VRouterRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.vrouter.rename", id, name)
}

func (c *Client) VRouterChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	args := append([]interface{}{id}, perm.ToArgs()...)

	return c.CallContext(ctx, "one.vrouter.chmod", args...)
}

func (c *Client) VRouterChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	return c.CallContext(ctx, "one.vrouter.chown", id, uid, gid)
}

func (c *Client) VRouterLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	return c.CallContext(ctx, "one.vrouter.lock", id, level, test)
}

func (c *Client) VRouterUnlock(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.vrouter.unlock", id)
}

func (c *Client) VRouterInstantiate(ctx context.Context, id, num_vms, template_id int, name string, hold bool, extra_tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vrouter.instantiate", id, num_vms, template_id, name, hold, extra_tmpl)
}

func (c *Client) VRouterAttachNic(ctx context.Context, id int, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.vrouter.attachnic", id, tmpl)
}

func (c *Client) VRouterDetachNic(ctx context.Context, id, nic_id int) (*Response, error) {
	return c.CallContext(ctx, "one.vrouter.detachnic", id, nic_id)
}

func (c *Client) VRouterPoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	return c.CallContext(ctx, "one.vrouterpool.info", filter, start, end)
}

// ---------- Zone ------------------------------------------------------------

func (c *Client) ZoneAllocate(ctx context.Context, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.zone.allocate", tmpl)
}

func (c *Client) ZoneDelete(ctx context.Context, id int) (*Response, error) {
	return c.CallContext(ctx, "one.zone.delete", id)
}

func (c *Client) ZoneInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	return c.CallContext(ctx, "one.zone.info", id, decrypt)
}

func (c *Client) ZoneUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	return c.CallContext(ctx, "one.zone.update", id, tmpl, uType)
}

func (c *Client) ZoneRename(ctx context.Context, id int, name string) (*Response, error) {
	return c.CallContext(ctx, "one.zone.rename", id, name)
}

func (c *Client) ZoneAddServer(ctx context.Context, id int, tmpl string) (*Response, error) {
	return c.CallContext(ctx, "one.zone.addserver", id, tmpl)
}

func (c *Client) ZoneDelServer(ctx context.Context, id, server_id int) (*Response, error) {
	return c.CallContext(ctx, "one.zone.delserver", id, server_id)
}

func (c *Client) ZoneResetServer(ctx context.Context, id, server_id int) (*Response, error) {
	return c.CallContext(ctx, "one.zone.resetserver", id, server_id)
}

func (c *Client) ZoneEnable(ctx context.Context, id int, enable bool) (*Response, error) {
	return c.CallContext(ctx, "one.zone.enable", id, enable)
}

func (c *Client) ZoneRaftStatus(ctx context.Context) (*Response, error) {
	return c.CallContext(ctx, "one.zone.raftstatus")
}

func (c *Client) ZonePoolInfo(ctx context.Context) (*Response, error) {
	return c.CallContext(ctx, "one.zonepool.info")
}

// ---------- System ------------------------------------------------------------

func (c *Client) SystemVersion(ctx context.Context) (*Response, error) {
	return c.CallContext(ctx, "one.system.version")
}

func (c *Client) SystemConfig(ctx context.Context) (*Response, error) {
	return c.CallContext(ctx, "one.system.config")
}
