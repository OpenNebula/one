package goca

import (
	"context"
	"fmt"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"

	// Generated gRPC files
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/acl"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/backupjob"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/cluster"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/datastore"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/document"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/group"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/hook"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/host"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/image"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/marketplace"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/marketplaceapp"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/secgroup"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/system"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/template"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/user"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/vdc"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/vm"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/vmgroup"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/vn"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/vntemplate"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/vrouter"
	"github.com/OpenNebula/one/src/oca/go/src/goca/api/zone"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	errs "github.com/OpenNebula/one/src/oca/go/src/goca/errors"
)

// GRPCClient communicates with OpenNebula using the gRPC protocol.
type GRPCClient struct {
	token    string
	endpoint string
	conn     *grpc.ClientConn
}

// NewGRPCClient creates a new gRPC client.
func NewGRPCClient(token, endpoint string) (*GRPCClient, error) {
	// For production, you should use secure credentials.
	conn, err := grpc.Dial(endpoint, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("did not connect: %w", err)
	}

	return &GRPCClient{
		token:    token,
		endpoint: endpoint,
		conn:     conn,
	}, nil
}

// MakeErrorResponse translates a gRPC error into a specific OpenNebula error.
func MakeErrorResponse(err error) (*Response, error) {
	if st, ok := status.FromError(err); ok {
		// It's a gRPC error. Translate it to an OpenNebula ResponseError.
		return nil, &errs.ResponseError{Code: errs.OneErrCodeFromGrpc(st.Code()), Msg: st.Message()}
	}

	// It's not a gRPC status error (e.g., network error). Wrap it in a ClientError.
	return nil, &errs.ClientError{Code: errs.ClientGRPCFault, Msg: "Client failure", Err: err}
}

// GetToken returns the authentication token
func (c *GRPCClient) GetToken() string {
	return c.token
}

// ---------- ACL -------------------------------------------------------------

// AclCreateRule creates a new ACL rule using the gRPC service.
func (c *GRPCClient) AclCreateRule(ctx context.Context, user, resource, rights, zone string) (*Response, error) {
	aclClient := acl.NewAclServiceClient(c.conn)
	req := &acl.AddRuleRequest{
		SessionId:c.token,
		User:     user,
		Resource: resource,
		Rights:   rights,
		Zone:     zone,
	}
	res, err := aclClient.AddRule(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) AclDelRule(ctx context.Context, id int) (*Response, error) {
	aclClient := acl.NewAclServiceClient(c.conn)
	req := &acl.DelRuleRequest{SessionId:c.token, Oid: int32(id)}
	res, err := aclClient.DelRule(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) AclInfo(ctx context.Context) (*Response, error) {
	aclClient := acl.NewAclServiceClient(c.conn)
	req := &acl.InfoRequest{SessionId:c.token}
	res, err := aclClient.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Backup Job ------------------------------------------------------

func (c *GRPCClient) BackupJobAllocate(ctx context.Context, tmpl string) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.AllocateRequest{SessionId: c.token, Template: tmpl}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) BackupJobDelete(ctx context.Context, id int) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) BackupJobInfo(ctx context.Context, id int) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.InfoRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) BackupJobUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) BackupJobRename(ctx context.Context, id int, name string) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) BackupJobChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.ChmodRequest{
		SessionId:   c.token,
		Oid:         int32(id),
		UserUse:     int32(perm.OwnerU),
		UserManage:  int32(perm.OwnerM),
		UserAdmin:   int32(perm.OwnerA),
		GroupUse:    int32(perm.GroupU),
		GroupManage: int32(perm.GroupM),
		GroupAdmin:  int32(perm.GroupA),
		OtherUse:    int32(perm.OtherU),
		OtherManage: int32(perm.OtherM),
		OtherAdmin:  int32(perm.OtherA),
	}
	res, err := client.Chmod(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) BackupJobChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.ChownRequest{SessionId: c.token, Oid: int32(id), UserId: int32(uid), GroupId: int32(gid)}
	res, err := client.Chown(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) BackupJobLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.LockRequest{SessionId: c.token, Oid: int32(id), Level: int32(level), Test: test}
	res, err := client.Lock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) BackupJobUnlock(ctx context.Context, id int) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.UnlockRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Unlock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) BackupJobBackup(ctx context.Context, id int) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.BackupRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Backup(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) BackupJobCancel(ctx context.Context, id int) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.CancelRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Cancel(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) BackupJobRetry(ctx context.Context, id int) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.RetryRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Retry(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) BackupJobPriority(ctx context.Context, id, priority int) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.PriorityRequest{SessionId: c.token, Oid: int32(id), Priority: int32(priority)}
	res, err := client.Priority(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) BackupJobSchedAdd(ctx context.Context, id int, tmpl string) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.SchedAddRequest{SessionId: c.token, Oid: int32(id), Template: tmpl}
	res, err := client.SchedAdd(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) BackupJobSchedDel(ctx context.Context, id, sa_id int) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.SchedDelRequest{SessionId: c.token, Oid: int32(id), SaId: int32(sa_id)}
	res, err := client.SchedDel(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) BackupJobSchedUpdate(ctx context.Context, id, sa_id int, tmpl string) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.SchedUpdateRequest{SessionId: c.token, Oid: int32(id), SaId: int32(sa_id), Template: tmpl}
	res, err := client.SchedUpdate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) BackupJobPoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	client := backupjob.NewBackupJobServiceClient(c.conn)
	req := &backupjob.PoolInfoRequest{SessionId: c.token, FilterFlag: int32(filter), Start: int32(start), End: int32(end)}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Cluster ---------------------------------------------------------

func (c *GRPCClient) ClusterAllocate(ctx context.Context, name string) (*Response, error) {
	client := cluster.NewClusterServiceClient(c.conn)
	req := &cluster.AllocateRequest{SessionId: c.token, Name: name}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ClusterDelete(ctx context.Context, id int) (*Response, error) {
	client := cluster.NewClusterServiceClient(c.conn)
	req := &cluster.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ClusterInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := cluster.NewClusterServiceClient(c.conn)
	req := &cluster.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) ClusterUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := cluster.NewClusterServiceClient(c.conn)
	req := &cluster.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ClusterRename(ctx context.Context, id int, name string) (*Response, error) {
	client := cluster.NewClusterServiceClient(c.conn)
	req := &cluster.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ClusterAddHost(ctx context.Context, id, host_id int) (*Response, error) {
	client := cluster.NewClusterServiceClient(c.conn)
	req := &cluster.AddHostRequest{SessionId: c.token, Oid: int32(id), HostId: int32(host_id)}
	res, err := client.AddHost(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ClusterDelHost(ctx context.Context, id, host_id int) (*Response, error) {
	client := cluster.NewClusterServiceClient(c.conn)
	req := &cluster.DelHostRequest{SessionId: c.token, Oid: int32(id), HostId: int32(host_id)}
	res, err := client.DelHost(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ClusterAddDatastore(ctx context.Context, id, ds_id int) (*Response, error) {
	client := cluster.NewClusterServiceClient(c.conn)
	req := &cluster.AddDatastoreRequest{SessionId: c.token, Oid: int32(id), DsId: int32(ds_id)}
	res, err := client.AddDatastore(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ClusterDelDatastore(ctx context.Context, id, ds_id int) (*Response, error) {
	client := cluster.NewClusterServiceClient(c.conn)
	req := &cluster.DelDatastoreRequest{SessionId: c.token, Oid: int32(id), DsId: int32(ds_id)}
	res, err := client.DelDatastore(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ClusterAddVnet(ctx context.Context, id, net_id int) (*Response, error) {
	client := cluster.NewClusterServiceClient(c.conn)
	req := &cluster.AddVNetRequest{SessionId: c.token, Oid: int32(id), VnetId: int32(net_id)}
	res, err := client.AddVNet(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ClusterDelVnet(ctx context.Context, id, net_id int) (*Response, error) {
	client := cluster.NewClusterServiceClient(c.conn)
	req := &cluster.DelVNetRequest{SessionId: c.token, Oid: int32(id), VnetId: int32(net_id)}
	res, err := client.DelVNet(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ClusterOptimize(ctx context.Context, id int) (*Response, error) {
	client := cluster.NewClusterServiceClient(c.conn)
	req := &cluster.OptimizeRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Optimize(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ClusterPlanExecute(ctx context.Context, id int) (*Response, error) {
	client := cluster.NewClusterServiceClient(c.conn)
	req := &cluster.PlanExecuteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.PlanExecute(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ClusterPlanDelete(ctx context.Context, id int) (*Response, error) {
	client := cluster.NewClusterServiceClient(c.conn)
	req := &cluster.PlanDeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.PlanDelete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ClusterPoolInfo(ctx context.Context) (*Response, error) {
	client := cluster.NewClusterServiceClient(c.conn)
	req := &cluster.PoolInfoRequest{SessionId: c.token}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Datastore -------------------------------------------------------

func (c *GRPCClient) DatastoreAllocate(ctx context.Context, tmpl string, cluster int) (*Response, error) {
	client := datastore.NewDatastoreServiceClient(c.conn)
	req := &datastore.AllocateRequest{SessionId: c.token, Template: tmpl, ClusterId: int32(cluster)}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) DatastoreDelete(ctx context.Context, id int) (*Response, error) {
	client := datastore.NewDatastoreServiceClient(c.conn)
	req := &datastore.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) DatastoreInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := datastore.NewDatastoreServiceClient(c.conn)
	req := &datastore.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) DatastoreUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := datastore.NewDatastoreServiceClient(c.conn)
	req := &datastore.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) DatastoreRename(ctx context.Context, id int, name string) (*Response, error) {
	client := datastore.NewDatastoreServiceClient(c.conn)
	req := &datastore.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) DatastoreChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	client := datastore.NewDatastoreServiceClient(c.conn)
	req := &datastore.ChmodRequest{
		SessionId:   c.token,
		Oid:         int32(id),
		UserUse:     int32(perm.OwnerU),
		UserManage:  int32(perm.OwnerM),
		UserAdmin:   int32(perm.OwnerA),
		GroupUse:    int32(perm.GroupU),
		GroupManage: int32(perm.GroupM),
		GroupAdmin:  int32(perm.GroupA),
		OtherUse:    int32(perm.OtherU),
		OtherManage: int32(perm.OtherM),
		OtherAdmin:  int32(perm.OtherA),
	}
	res, err := client.Chmod(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) DatastoreChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	client := datastore.NewDatastoreServiceClient(c.conn)
	req := &datastore.ChownRequest{SessionId: c.token, Oid: int32(id), UserId: int32(uid), GroupId: int32(gid)}
	res, err := client.Chown(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) DatastoreEnable(ctx context.Context, id int, enable bool) (*Response, error) {
	client := datastore.NewDatastoreServiceClient(c.conn)
	req := &datastore.EnableRequest{SessionId: c.token, Oid: int32(id), Enable: enable}
	res, err := client.Enable(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) DatastorePoolInfo(ctx context.Context) (*Response, error) {
	client := datastore.NewDatastoreServiceClient(c.conn)
	req := &datastore.PoolInfoRequest{SessionId: c.token}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Document --------------------------------------------------------

func (c *GRPCClient) DocumentAllocate(ctx context.Context, tmpl string, docType int) (*Response, error) {
	client := document.NewDocumentServiceClient(c.conn)
	req := &document.AllocateRequest{SessionId: c.token, Template: tmpl, Type: int32(docType)}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) DocumentDelete(ctx context.Context, id int) (*Response, error) {
	client := document.NewDocumentServiceClient(c.conn)
	req := &document.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) DocumentInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := document.NewDocumentServiceClient(c.conn)
	req := &document.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) DocumentUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := document.NewDocumentServiceClient(c.conn)
	req := &document.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) DocumentRename(ctx context.Context, id int, name string) (*Response, error) {
	client := document.NewDocumentServiceClient(c.conn)
	req := &document.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) DocumentChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	client := document.NewDocumentServiceClient(c.conn)
	req := &document.ChmodRequest{
		SessionId:   c.token,
		Oid:         int32(id),
		UserUse:     int32(perm.OwnerU),
		UserManage:  int32(perm.OwnerM),
		UserAdmin:   int32(perm.OwnerA),
		GroupUse:    int32(perm.GroupU),
		GroupManage: int32(perm.GroupM),
		GroupAdmin:  int32(perm.GroupA),
		OtherUse:    int32(perm.OtherU),
		OtherManage: int32(perm.OtherM),
		OtherAdmin:  int32(perm.OtherA),
	}
	res, err := client.Chmod(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) DocumentChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	client := document.NewDocumentServiceClient(c.conn)
	req := &document.ChownRequest{SessionId: c.token, Oid: int32(id), UserId: int32(uid), GroupId: int32(gid)}
	res, err := client.Chown(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) DocumentLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	client := document.NewDocumentServiceClient(c.conn)
	req := &document.LockRequest{SessionId: c.token, Oid: int32(id), Level: int32(level), Test: test}
	res, err := client.Lock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) DocumentUnlock(ctx context.Context, id int) (*Response, error) {
	client := document.NewDocumentServiceClient(c.conn)
	req := &document.UnlockRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Unlock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) DocumentClone(ctx context.Context, id int, name string) (*Response, error) {
	client := document.NewDocumentServiceClient(c.conn)
	req := &document.CloneRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Clone(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) DocumentPoolInfo(ctx context.Context, filter, start, end, docType int) (*Response, error) {
	client := document.NewDocumentServiceClient(c.conn)
	req := &document.PoolInfoRequest{SessionId: c.token, FilterFlag: int32(filter), StartId: int32(start), EndId: int32(end), Type: int32(docType)}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Group -----------------------------------------------------------

func (c *GRPCClient) GroupAllocate(ctx context.Context, name string) (*Response, error) {
	client := group.NewGroupServiceClient(c.conn)
	req := &group.AllocateRequest{SessionId: c.token, Gname: name}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) GroupDelete(ctx context.Context, id int) (*Response, error) {
	client := group.NewGroupServiceClient(c.conn)
	req := &group.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) GroupInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := group.NewGroupServiceClient(c.conn)
	req := &group.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) GroupUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := group.NewGroupServiceClient(c.conn)
	req := &group.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) GroupAddAdmin(ctx context.Context, id, user_id int) (*Response, error) {
	client := group.NewGroupServiceClient(c.conn)
	req := &group.AddAdminRequest{SessionId: c.token, Oid: int32(id), UserId: int32(user_id)}
	res, err := client.AddAdmin(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) GroupDelAdmin(ctx context.Context, id, user_id int) (*Response, error) {
	client := group.NewGroupServiceClient(c.conn)
	req := &group.DelAdminRequest{SessionId: c.token, Oid: int32(id), UserId: int32(user_id)}
	res, err := client.DelAdmin(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) GroupQuota(ctx context.Context, id int, quota string) (*Response, error) {
	client := group.NewGroupServiceClient(c.conn)
	req := &group.QuotaRequest{SessionId: c.token, Oid: int32(id), Quota: quota}
	res, err := client.Quota(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) GroupDefaultQuotaInfo(ctx context.Context) (*Response, error) {
	client := group.NewGroupServiceClient(c.conn)
	req := &group.PoolInfoRequest{SessionId: c.token}
	res, err := client.DefaultQuotaInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) GroupDefaultQuotaUpdate(ctx context.Context, quota string) (*Response, error) {
	client := group.NewGroupServiceClient(c.conn)
	req := &group.DefaultQuotaUpdateRequest{SessionId: c.token, Quota: quota}
	res, err := client.DefaultQuotaUpdate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) GroupPoolInfo(ctx context.Context) (*Response, error) {
	client := group.NewGroupServiceClient(c.conn)
	req := &group.PoolInfoRequest{SessionId: c.token}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Hook ------------------------------------------------------------

func (c *GRPCClient) HookAllocate(ctx context.Context, tmpl string) (*Response, error) {
	client := hook.NewHookServiceClient(c.conn)
	req := &hook.AllocateRequest{SessionId: c.token, Template: tmpl}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) HookDelete(ctx context.Context, id int) (*Response, error) {
	client := hook.NewHookServiceClient(c.conn)
	req := &hook.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) HookInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := hook.NewHookServiceClient(c.conn)
	req := &hook.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) HookUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := hook.NewHookServiceClient(c.conn)
	req := &hook.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) HookRename(ctx context.Context, id int, name string) (*Response, error) {
	client := hook.NewHookServiceClient(c.conn)
	req := &hook.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) HookLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	client := hook.NewHookServiceClient(c.conn)
	req := &hook.LockRequest{SessionId: c.token, Oid: int32(id), Level: int32(level), Test: test}
	res, err := client.Lock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) HookUnlock(ctx context.Context, id int) (*Response, error) {
	client := hook.NewHookServiceClient(c.conn)
	req := &hook.UnlockRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Unlock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) HookRetry(ctx context.Context, id, exe_id int) (*Response, error) {
	client := hook.NewHookServiceClient(c.conn)
	req := &hook.RetryRequest{SessionId: c.token, Oid: int32(id), HkExeId: int32(exe_id)}
	res, err := client.Retry(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) HookPoolInfo(ctx context.Context) (*Response, error) {
	client := hook.NewHookServiceClient(c.conn)
	req := &hook.PoolInfoRequest{SessionId: c.token}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) HookLogInfo(ctx context.Context, start, end, hook_id, rc_hook int) (*Response, error) {
	client := hook.NewHookServiceClient(c.conn)
	req := &hook.LogInfoRequest{SessionId: c.token, MinTs: int32(start), MaxTs: int32(end), HookId: int32(hook_id), RcHook: int32(rc_hook)}
	res, err := client.LogInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Host ------------------------------------------------------------

func (c *GRPCClient) HostAllocate(ctx context.Context, name, im_mad, vm_mad string, cluster int) (*Response, error) {
	client := host.NewHostServiceClient(c.conn)
	req := &host.AllocateRequest{SessionId: c.token, Name: name, ImMad: im_mad, VmMad: vm_mad, ClusterId: int32(cluster)}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) HostDelete(ctx context.Context, id int) (*Response, error) {
	client := host.NewHostServiceClient(c.conn)
	req := &host.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) HostInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := host.NewHostServiceClient(c.conn)
	req := &host.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) HostUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := host.NewHostServiceClient(c.conn)
	req := &host.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) HostRename(ctx context.Context, id int, name string) (*Response, error) {
	client := host.NewHostServiceClient(c.conn)
	req := &host.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) HostStatus(ctx context.Context, id, status int) (*Response, error) {
	client := host.NewHostServiceClient(c.conn)
	req := &host.StatusRequest{SessionId: c.token, Oid: int32(id), Status: int32(status)}
	res, err := client.Status(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) HostMonitoring(ctx context.Context, id int) (*Response, error) {
	client := host.NewHostServiceClient(c.conn)
	req := &host.MonitoringRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Monitoring(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) HostPoolInfo(ctx context.Context) (*Response, error) {
	client := host.NewHostServiceClient(c.conn)
	req := &host.PoolInfoRequest{SessionId: c.token}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) HostPoolMonitoring(ctx context.Context, seconds int) (*Response, error) {
	client := host.NewHostServiceClient(c.conn)
	req := &host.PoolMonitoringRequest{SessionId: c.token, Seconds: int32(seconds)}
	res, err := client.PoolMonitoring(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Image -----------------------------------------------------------

func (c *GRPCClient) ImageAllocate(ctx context.Context, tmpl string, dsid uint, skipCapacityCheck bool) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.AllocateRequest{SessionId: c.token, Template: tmpl, DsId: int32(dsid), SkipCapacityCheck: skipCapacityCheck}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ImageDelete(ctx context.Context, id int, force bool) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.DeleteRequest{SessionId: c.token, Oid: int32(id), Force: force}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ImageInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) ImageUpdate(ctx context.Context, id int, tmpl string, append int) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(append)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ImageRename(ctx context.Context, id int, name string) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ImageChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.ChmodRequest{SessionId: c.token,
							   Oid: int32(id),
							   UserUse: int32(perm.OwnerU),
							   UserManage: int32(perm.OwnerM),
							   UserAdmin: int32(perm.OwnerA),
							   GroupUse: int32(perm.GroupU),
							   GroupManage: int32(perm.GroupM),
							   GroupAdmin: int32(perm.GroupA),
							   OtherUse: int32(perm.OtherU),
							   OtherManage: int32(perm.OtherM),
							   OtherAdmin: int32(perm.OtherA)}
	res, err := client.Chmod(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ImageChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.ChownRequest{SessionId: c.token, Oid: int32(id), UserId: int32(uid), GroupId: int32(gid)}
	res, err := client.Chown(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ImageLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.LockRequest{SessionId: c.token, Oid: int32(id), Level: int32(level), Test: test}
	res, err := client.Lock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ImageUnlock(ctx context.Context, id int) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.UnlockRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Unlock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ImageClone(ctx context.Context, id int, name string, dsid int) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.CloneRequest{SessionId: c.token, Oid: int32(id), Name: name, DsId: int32(dsid)}
	res, err := client.Clone(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ImageEnable(ctx context.Context, id int, enable bool) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.EnableRequest{SessionId: c.token, Oid: int32(id), Enable: enable}
	res, err := client.Enable(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ImagePersistent(ctx context.Context, id int, persistent bool) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.PersistentRequest{SessionId: c.token, Oid: int32(id), Persistent: persistent}
	res, err := client.Persistent(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ImageChtype(ctx context.Context, id int, newType string) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.ChtypeRequest{SessionId: c.token, Oid: int32(id), Type: newType}
	res, err := client.Chtype(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ImageSnapshotDelete(ctx context.Context, id, snapID int) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.SnapshotDeleteRequest{SessionId: c.token, Oid: int32(id), SnapshotId: int32(snapID)}
	res, err := client.SnapshotDelete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ImageSnapshotRevert(ctx context.Context, id, snapID int) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.SnapshotRevertRequest{SessionId: c.token, Oid: int32(id), SnapshotId: int32(snapID)}
	res, err := client.SnapshotRevert(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ImageSnapshotFlatten(ctx context.Context, id, snapID int) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.SnapshotFlattenRequest{SessionId: c.token, Oid: int32(id), SnapshotId: int32(snapID)}
	res, err := client.SnapshotFlatten(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ImageResize(ctx context.Context, id int, newSize string) (*Response, error) {
	return MakeErrorResponse(fmt.Errorf("ImageResize not implemented for gRPC client"))
}

func (c *GRPCClient) ImageRestore(ctx context.Context, id, dsid int, optTmpl string) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.RestoreRequest{SessionId: c.token, Oid: int32(id), DsId: int32(dsid), OptTmpl: optTmpl}
	res, err := client.Restore(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) ImagePoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	client := image.NewImageServiceClient(c.conn)
	req := &image.PoolInfoRequest{SessionId: c.token, FilterFlag: int32(filter), Start: int32(start), End: int32(end)}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Marketplace -----------------------------------------------------

func (c *GRPCClient) MarketAllocate(ctx context.Context, tmpl string) (*Response, error) {
	client := marketplace.NewMarketPlaceServiceClient(c.conn)
	req := &marketplace.AllocateRequest{SessionId: c.token, Template: tmpl}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) MarketDelete(ctx context.Context, id int) (*Response, error) {
	client := marketplace.NewMarketPlaceServiceClient(c.conn)
	req := &marketplace.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) MarketInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := marketplace.NewMarketPlaceServiceClient(c.conn)
	req := &marketplace.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) MarketUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := marketplace.NewMarketPlaceServiceClient(c.conn)
	req := &marketplace.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) MarketRename(ctx context.Context, id int, name string) (*Response, error) {
	client := marketplace.NewMarketPlaceServiceClient(c.conn)
	req := &marketplace.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) MarketChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	client := marketplace.NewMarketPlaceServiceClient(c.conn)
	req := &marketplace.ChmodRequest{
		SessionId:   c.token,
		Oid:         int32(id),
		UserUse:     int32(perm.OwnerU),
		UserManage:  int32(perm.OwnerM),
		UserAdmin:   int32(perm.OwnerA),
		GroupUse:    int32(perm.GroupU),
		GroupManage: int32(perm.GroupM),
		GroupAdmin:  int32(perm.GroupA),
		OtherUse:    int32(perm.OtherU),
		OtherManage: int32(perm.OtherM),
		OtherAdmin:  int32(perm.OtherA),
	}
	res, err := client.Chmod(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) MarketChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	client := marketplace.NewMarketPlaceServiceClient(c.conn)
	req := &marketplace.ChownRequest{SessionId: c.token, Oid: int32(id), UserId: int32(uid), GroupId: int32(gid)}
	res, err := client.Chown(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) MarketEnable(ctx context.Context, id int, enable bool) (*Response, error) {
	client := marketplace.NewMarketPlaceServiceClient(c.conn)
	req := &marketplace.EnableRequest{SessionId: c.token, Oid: int32(id), Enable: enable}
	res, err := client.Enable(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) MarketPoolInfo(ctx context.Context) (*Response, error) {
	client := marketplace.NewMarketPlaceServiceClient(c.conn)
	req := &marketplace.PoolInfoRequest{SessionId: c.token}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Marketplace App -------------------------------------------------

func (c *GRPCClient) MarketAppAllocate(ctx context.Context, tmpl string, market_id int) (*Response, error) {
	client := marketplaceapp.NewMarketPlaceAppServiceClient(c.conn)
	req := &marketplaceapp.AllocateRequest{SessionId: c.token, Template: tmpl, MarketId: int32(market_id)}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) MarketAppDelete(ctx context.Context, id int) (*Response, error) {
	client := marketplaceapp.NewMarketPlaceAppServiceClient(c.conn)
	req := &marketplaceapp.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) MarketAppInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := marketplaceapp.NewMarketPlaceAppServiceClient(c.conn)
	req := &marketplaceapp.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) MarketAppUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := marketplaceapp.NewMarketPlaceAppServiceClient(c.conn)
	req := &marketplaceapp.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) MarketAppRename(ctx context.Context, id int, name string) (*Response, error) {
	client := marketplaceapp.NewMarketPlaceAppServiceClient(c.conn)
	req := &marketplaceapp.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) MarketAppChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	client := marketplaceapp.NewMarketPlaceAppServiceClient(c.conn)
	req := &marketplaceapp.ChmodRequest{
		SessionId:   c.token,
		Oid:         int32(id),
		UserUse:     int32(perm.OwnerU),
		UserManage:  int32(perm.OwnerM),
		UserAdmin:   int32(perm.OwnerA),
		GroupUse:    int32(perm.GroupU),
		GroupManage: int32(perm.GroupM),
		GroupAdmin:  int32(perm.GroupA),
		OtherUse:    int32(perm.OtherU),
		OtherManage: int32(perm.OtherM),
		OtherAdmin:  int32(perm.OtherA),
	}
	res, err := client.Chmod(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) MarketAppChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	client := marketplaceapp.NewMarketPlaceAppServiceClient(c.conn)
	req := &marketplaceapp.ChownRequest{SessionId: c.token, Oid: int32(id), UserId: int32(uid), GroupId: int32(gid)}
	res, err := client.Chown(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) MarketAppLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	client := marketplaceapp.NewMarketPlaceAppServiceClient(c.conn)
	req := &marketplaceapp.LockRequest{SessionId: c.token, Oid: int32(id), Level: int32(level), Test: test}
	res, err := client.Lock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) MarketAppUnlock(ctx context.Context, id int) (*Response, error) {
	client := marketplaceapp.NewMarketPlaceAppServiceClient(c.conn)
	req := &marketplaceapp.UnlockRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Unlock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) MarketAppEnable(ctx context.Context, id int, enable bool) (*Response, error) {
	client := marketplaceapp.NewMarketPlaceAppServiceClient(c.conn)
	req := &marketplaceapp.EnableRequest{SessionId: c.token, Oid: int32(id), Enable: enable}
	res, err := client.Enable(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) MarketAppPoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	client := marketplaceapp.NewMarketPlaceAppServiceClient(c.conn)
	req := &marketplaceapp.PoolInfoRequest{SessionId: c.token, FilterFlag: int32(filter), Start: int32(start), End: int32(end)}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Security Group --------------------------------------------------

func (c *GRPCClient) SecGroupAllocate(ctx context.Context, tmpl string) (*Response, error) {
	client := secgroup.NewSecurityGroupServiceClient(c.conn)
	req := &secgroup.AllocateRequest{SessionId: c.token, Template: tmpl}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) SecGroupDelete(ctx context.Context, id int) (*Response, error) {
	client := secgroup.NewSecurityGroupServiceClient(c.conn)
	req := &secgroup.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) SecGroupInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := secgroup.NewSecurityGroupServiceClient(c.conn)
	req := &secgroup.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) SecGroupUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := secgroup.NewSecurityGroupServiceClient(c.conn)
	req := &secgroup.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) SecGroupRename(ctx context.Context, id int, name string) (*Response, error) {
	client := secgroup.NewSecurityGroupServiceClient(c.conn)
	req := &secgroup.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) SecGroupChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	client := secgroup.NewSecurityGroupServiceClient(c.conn)
	req := &secgroup.ChmodRequest{
		SessionId:   c.token,
		Oid:         int32(id),
		UserUse:     int32(perm.OwnerU),
		UserManage:  int32(perm.OwnerM),
		UserAdmin:   int32(perm.OwnerA),
		GroupUse:    int32(perm.GroupU),
		GroupManage: int32(perm.GroupM),
		GroupAdmin:  int32(perm.GroupA),
		OtherUse:    int32(perm.OtherU),
		OtherManage: int32(perm.OtherM),
		OtherAdmin:  int32(perm.OtherA),
	}
	res, err := client.Chmod(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) SecGroupChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	client := secgroup.NewSecurityGroupServiceClient(c.conn)
	req := &secgroup.ChownRequest{SessionId: c.token, Oid: int32(id), UserId: int32(uid), GroupId: int32(gid)}
	res, err := client.Chown(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) SecGroupClone(ctx context.Context, id int, name string) (*Response, error) {
	client := secgroup.NewSecurityGroupServiceClient(c.conn)
	req := &secgroup.CloneRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Clone(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) SecGroupCommit(ctx context.Context, id int, recovery bool) (*Response, error) {
	client := secgroup.NewSecurityGroupServiceClient(c.conn)
	req := &secgroup.CommitRequest{SessionId: c.token, Oid: int32(id), Recovery: recovery}
	res, err := client.Commit(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) SecGroupPoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	client := secgroup.NewSecurityGroupServiceClient(c.conn)
	req := &secgroup.PoolInfoRequest{SessionId: c.token, FilterFlag: int32(filter), Start: int32(start), End: int32(end)}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Template --------------------------------------------------------

func (c *GRPCClient) TemplateAllocate(ctx context.Context, tmpl string) (*Response, error) {
	client := template.NewTemplateServiceClient(c.conn)
	req := &template.AllocateRequest{SessionId: c.token, Template: tmpl}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) TemplateDelete(ctx context.Context, id int, recursive bool) (*Response, error) {
	client := template.NewTemplateServiceClient(c.conn)
	req := &template.DeleteRequest{SessionId: c.token, Oid: int32(id), Recursive: recursive}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) TemplateInfo(ctx context.Context, id int, extended, decrypt bool) (*Response, error) {
	client := template.NewTemplateServiceClient(c.conn)
	req := &template.InfoRequest{SessionId: c.token, Oid: int32(id), Extended: extended, Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) TemplateUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := template.NewTemplateServiceClient(c.conn)
	req := &template.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) TemplateRename(ctx context.Context, id int, name string) (*Response, error) {
	client := template.NewTemplateServiceClient(c.conn)
	req := &template.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) TemplateChmod(ctx context.Context, id int, perm shared.Permissions, recursive bool) (*Response, error) {
	client := template.NewTemplateServiceClient(c.conn)
	req := &template.ChmodRequest{
		SessionId:   c.token,
		Oid:         int32(id),
		UserUse:     int32(perm.OwnerU),
		UserManage:  int32(perm.OwnerM),
		UserAdmin:   int32(perm.OwnerA),
		GroupUse:    int32(perm.GroupU),
		GroupManage: int32(perm.GroupM),
		GroupAdmin:  int32(perm.GroupA),
		OtherUse:    int32(perm.OtherU),
		OtherManage: int32(perm.OtherM),
		OtherAdmin:  int32(perm.OtherA),
		Recursive:   recursive,
	}
	res, err := client.Chmod(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) TemplateChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	client := template.NewTemplateServiceClient(c.conn)
	req := &template.ChownRequest{SessionId: c.token, Oid: int32(id), UserId: int32(uid), GroupId: int32(gid)}
	res, err := client.Chown(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) TemplateLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	client := template.NewTemplateServiceClient(c.conn)
	req := &template.LockRequest{SessionId: c.token, Oid: int32(id), Level: int32(level), Test: test}
	res, err := client.Lock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) TemplateUnlock(ctx context.Context, id int) (*Response, error) {
	client := template.NewTemplateServiceClient(c.conn)
	req := &template.UnlockRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Unlock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) TemplateClone(ctx context.Context, id int, name string, recursive bool) (*Response, error) {
	client := template.NewTemplateServiceClient(c.conn)
	req := &template.CloneRequest{SessionId: c.token, Oid: int32(id), Name: name, Recursive: recursive}
	res, err := client.Clone(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) TemplateInstantiate(ctx context.Context, id int, name string, hold bool, extra_tmpl string, persistent bool) (*Response, error) {
	client := template.NewTemplateServiceClient(c.conn)
	req := &template.InstantiateRequest{SessionId: c.token, Oid: int32(id), Name: name, Hold: hold, ExtraTemplate: extra_tmpl, Persistent: persistent}
	res, err := client.Instantiate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) TemplatePoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	client := template.NewTemplateServiceClient(c.conn)
	req := &template.PoolInfoRequest{SessionId: c.token, FilterFlag: int32(filter), Start: int32(start), End: int32(end)}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- User ------------------------------------------------------------

func (c *GRPCClient) UserAllocate(ctx context.Context, name, password, driver string, groupIDs []int) (*Response, error) {
	client := user.NewUserServiceClient(c.conn)
	gids32 := make([]int32, len(groupIDs))
	for i, id := range groupIDs {
		gids32[i] = int32(id)
	}
	req := &user.AllocateRequest{SessionId: c.token, Username: name, Password: password, Driver: driver, GroupIds: gids32}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) UserDelete(ctx context.Context, id int) (*Response, error) {
	client := user.NewUserServiceClient(c.conn)
	req := &user.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) UserInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := user.NewUserServiceClient(c.conn)
	req := &user.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) UserUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := user.NewUserServiceClient(c.conn)
	req := &user.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) UserAddGroup(ctx context.Context, id int, groupID int) (*Response, error) {
	client := user.NewUserServiceClient(c.conn)
	req := &user.AddGroupRequest{SessionId: c.token, Oid: int32(id), GroupId: int32(groupID)}
	res, err := client.AddGroup(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) UserChangeAuth(ctx context.Context, id int, authDriver, password string) (*Response, error) {
	client := user.NewUserServiceClient(c.conn)
	req := &user.ChangeAuthRequest{SessionId: c.token, Oid: int32(id), NewAuth: authDriver, NewPassword: password}
	res, err := client.ChangeAuth(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) UserChangeGroup(ctx context.Context, id int, groupID int) (*Response, error) {
	client := user.NewUserServiceClient(c.conn)
	req := &user.ChangeGroupRequest{SessionId: c.token, Oid: int32(id), NewGid: int32(groupID)}
	res, err := client.ChangeGroup(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) UserDelGroup(ctx context.Context, id int, groupID int) (*Response, error) {
	client := user.NewUserServiceClient(c.conn)
	req := &user.DelGroupRequest{SessionId: c.token, Oid: int32(id), GroupId: int32(groupID)}
	res, err := client.DelGroup(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) UserEnable(ctx context.Context, id int, enable bool) (*Response, error) {
	client := user.NewUserServiceClient(c.conn)
	req := &user.EnableRequest{SessionId: c.token, Oid: int32(id), Enable: enable}
	res, err := client.Enable(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) UserLogin(ctx context.Context, uname, token string, validTime, effectiveGID int) (*Response, error) {
	client := user.NewUserServiceClient(c.conn)
	req := &user.LoginRequest{
		SessionId: c.token,
		Uname: uname,
		Token: token,
		Valid: int32(validTime),
		Egid: int32(effectiveGID)}
	res, err := client.Login(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) UserPassword(ctx context.Context, id int, password string) (*Response, error) {
	client := user.NewUserServiceClient(c.conn)
	req := &user.PasswordRequest{SessionId: c.token, Oid: int32(id), NewPassword: password}
	res, err := client.Password(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) UserQuota(ctx context.Context, id int, quota string) (*Response, error) {
	client := user.NewUserServiceClient(c.conn)
	req := &user.QuotaRequest{SessionId: c.token, Oid: int32(id), Quota: quota}
	res, err := client.Quota(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) UserDefaultQuotaInfo(ctx context.Context) (*Response, error) {
	client := user.NewUserServiceClient(c.conn)
	req := &user.PoolInfoRequest{SessionId: c.token}
	res, err := client.DefaultQuotaInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) UserDefaultQuotaUpdate(ctx context.Context, quota string) (*Response, error) {
	client := user.NewUserServiceClient(c.conn)
	req := &user.DefaultQuotaUpdateRequest{SessionId: c.token, Quota: quota}
	res, err := client.DefaultQuotaUpdate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) UserPoolInfo(ctx context.Context) (*Response, error) {
	client := user.NewUserServiceClient(c.conn)
	req := &user.PoolInfoRequest{SessionId: c.token}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- VDC -------------------------------------------------------------

func (c *GRPCClient) VdcAllocate(ctx context.Context, tmpl string) (*Response, error) {
	client := vdc.NewVdcServiceClient(c.conn)
	req := &vdc.AllocateRequest{SessionId: c.token, Template: tmpl}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VdcDelete(ctx context.Context, id int) (*Response, error) {
	client := vdc.NewVdcServiceClient(c.conn)
	req := &vdc.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VdcInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := vdc.NewVdcServiceClient(c.conn)
	req := &vdc.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) VdcUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := vdc.NewVdcServiceClient(c.conn)
	req := &vdc.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VdcRename(ctx context.Context, id int, name string) (*Response, error) {
	client := vdc.NewVdcServiceClient(c.conn)
	req := &vdc.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VdcAddGroup(ctx context.Context, id, group int) (*Response, error) {
	client := vdc.NewVdcServiceClient(c.conn)
	req := &vdc.AddGroupRequest{SessionId: c.token, Oid: int32(id), GroupId: int32(group)}
	res, err := client.AddGroup(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VdcDelGroup(ctx context.Context, id, group int) (*Response, error) {
	client := vdc.NewVdcServiceClient(c.conn)
	req := &vdc.DelGroupRequest{SessionId: c.token, Oid: int32(id), GroupId: int32(group)}
	res, err := client.DelGroup(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VdcAddCluster(ctx context.Context, id, zone, cluster int) (*Response, error) {
	client := vdc.NewVdcServiceClient(c.conn)
	req := &vdc.AddClusterRequest{SessionId: c.token, Oid: int32(id), ZoneId: int32(zone), ClusterId: int32(cluster)}
	res, err := client.AddCluster(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VdcDelCluster(ctx context.Context, id, zone, cluster int) (*Response, error) {
	client := vdc.NewVdcServiceClient(c.conn)
	req := &vdc.DelClusterRequest{SessionId: c.token, Oid: int32(id), ZoneId: int32(zone), ClusterId: int32(cluster)}
	res, err := client.DelCluster(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VdcAddHost(ctx context.Context, id, zone, host int) (*Response, error) {
	client := vdc.NewVdcServiceClient(c.conn)
	req := &vdc.AddHostRequest{SessionId: c.token, Oid: int32(id), ZoneId: int32(zone), HostId: int32(host)}
	res, err := client.AddHost(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VdcDelHost(ctx context.Context, id, zone, host int) (*Response, error) {
	client := vdc.NewVdcServiceClient(c.conn)
	req := &vdc.DelHostRequest{SessionId: c.token, Oid: int32(id), ZoneId: int32(zone), HostId: int32(host)}
	res, err := client.DelHost(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VdcAddDatastore(ctx context.Context, id, zone, ds int) (*Response, error) {
	client := vdc.NewVdcServiceClient(c.conn)
	req := &vdc.AddDatastoreRequest{SessionId: c.token, Oid: int32(id), ZoneId: int32(zone), DsId: int32(ds)}
	res, err := client.AddDatastore(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VdcDelDatastore(ctx context.Context, id, zone, ds int) (*Response, error) {
	client := vdc.NewVdcServiceClient(c.conn)
	req := &vdc.DelDatastoreRequest{SessionId: c.token, Oid: int32(id), ZoneId: int32(zone), DsId: int32(ds)}
	res, err := client.DelDatastore(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VdcAddVnet(ctx context.Context, id, zone, net int) (*Response, error) {
	client := vdc.NewVdcServiceClient(c.conn)
	req := &vdc.AddVnetRequest{SessionId: c.token, Oid: int32(id), ZoneId: int32(zone), VnetId: int32(net)}
	res, err := client.AddVnet(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VdcDelVnet(ctx context.Context, id, zone, net int) (*Response, error) {
	client := vdc.NewVdcServiceClient(c.conn)
	req := &vdc.DelVnetRequest{SessionId: c.token, Oid: int32(id), ZoneId: int32(zone), VnetId: int32(net)}
	res, err := client.DelVnet(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VdcPoolInfo(ctx context.Context) (*Response, error) {
	client := vdc.NewVdcServiceClient(c.conn)
	req := &vdc.PoolInfoRequest{SessionId: c.token}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Virtual Machine -------------------------------------------------

func (c *GRPCClient) VMAllocate(ctx context.Context, tmpl string, hold bool) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.AllocateRequest{SessionId: c.token, Template: tmpl, Hold: hold}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) VMUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMRename(ctx context.Context, id int, name string) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.ChmodRequest{
		SessionId:   c.token,
		Oid:         int32(id),
		UserUse:     int32(perm.OwnerU),
		UserManage:  int32(perm.OwnerM),
		UserAdmin:   int32(perm.OwnerA),
		GroupUse:    int32(perm.GroupU),
		GroupManage: int32(perm.GroupM),
		GroupAdmin:  int32(perm.GroupA),
		OtherUse:    int32(perm.OtherU),
		OtherManage: int32(perm.OtherM),
		OtherAdmin:  int32(perm.OtherA),
	}
	res, err := client.Chmod(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.ChownRequest{SessionId: c.token, Oid: int32(id), UserId: int32(uid), GroupId: int32(gid)}
	res, err := client.Chown(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.LockRequest{SessionId: c.token, Oid: int32(id), Level: int32(level), Test: test}
	res, err := client.Lock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMUnlock(ctx context.Context, id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.UnlockRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Unlock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMDeploy(ctx context.Context, id, hid int, no_overcommit bool, ds_id int, nic_tmpl string) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.DeployRequest{SessionId: c.token, Oid: int32(id), Hid: int32(hid), NoOvercommit: no_overcommit, DsId: int32(ds_id), NicTemplate: nic_tmpl}
	res, err := client.Deploy(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMAction(ctx context.Context, action string, id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.ActionRequest{SessionId: c.token, ActionName: action, Oid: int32(id)}
	res, err := client.Action(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMMigrate(ctx context.Context, id, hid int, live, no_overcommit bool, ds_id, migration_type int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.MigrateRequest{SessionId: c.token, Oid: int32(id), Hid: int32(hid), Live: live, NoOvercommit: no_overcommit, DsId: int32(ds_id), MigrationType: int32(migration_type)}
	res, err := client.Migrate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMDiskSaveAs(ctx context.Context, id, disk_id int, name, image_type string, snap_id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.DiskSaveAsRequest{SessionId: c.token, Oid: int32(id), DiskId: int32(disk_id), Name: name, ImageType: image_type, SnapId: int32(snap_id)}
	res, err := client.DiskSaveAs(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMDiskSnapshotCreate(ctx context.Context, id, disk_id int, name string) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.DiskSnapshotCreateRequest{SessionId: c.token, Oid: int32(id), DiskId: int32(disk_id), Name: name}
	res, err := client.DiskSnapshotCreate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMDiskSnapshotDelete(ctx context.Context, id, disk_id, snap_id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.DiskSnapshotDeleteRequest{SessionId: c.token, Oid: int32(id), DiskId: int32(disk_id), SnapId: int32(snap_id)}
	res, err := client.DiskSnapshotDelete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMDiskSnapshotRevert(ctx context.Context, id, disk_id, snap_id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.DiskSnapshotRevertRequest{SessionId: c.token, Oid: int32(id), DiskId: int32(disk_id), SnapId: int32(snap_id)}
	res, err := client.DiskSnapshotRevert(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMDiskSnapshotRename(ctx context.Context, id, disk_id, snap_id int, name string) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.DiskSnapshotRenameRequest{SessionId: c.token, Oid: int32(id), DiskId: int32(disk_id), SnapId: int32(snap_id), Name: name}
	res, err := client.DiskSnapshotRename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMDiskAttach(ctx context.Context, id int, tmpl string) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.DiskAttachRequest{SessionId: c.token, Oid: int32(id), Template: tmpl}
	res, err := client.DiskAttach(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMDiskDetach(ctx context.Context, id, disk_id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.DiskDetachRequest{SessionId: c.token, Oid: int32(id), DiskId: int32(disk_id)}
	res, err := client.DiskDetach(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMDiskResize(ctx context.Context, id, disk_id int, size string) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.DiskResizeRequest{SessionId: c.token, Oid: int32(id), DiskId: int32(disk_id), Size: size}
	res, err := client.DiskResize(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMNicAttach(ctx context.Context, id int, tmpl string) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.NicAttachRequest{SessionId: c.token, Oid: int32(id), Template: tmpl}
	res, err := client.NicAttach(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMNicDetach(ctx context.Context, id, nic_id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.NicDetachRequest{SessionId: c.token, Oid: int32(id), NicId: int32(nic_id)}
	res, err := client.NicDetach(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMNicUpdate(ctx context.Context, id, nic_id int, tmpl string, uType int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.NicUpdateRequest{SessionId: c.token, Oid: int32(id), NicId: int32(nic_id), Template: tmpl, Append: int32(uType)}
	res, err := client.NicUpdate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMSGAttach(ctx context.Context, id, nic_id, sg_id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.SGAttachRequest{SessionId: c.token, Oid: int32(id), NicId: int32(nic_id), SgId: int32(sg_id)}
	res, err := client.SGAttach(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMSGDetach(ctx context.Context, id, nic_id, sg_id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.SGDetachRequest{SessionId: c.token, Oid: int32(id), NicId: int32(nic_id), SgId: int32(sg_id)}
	res, err := client.SGDetach(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMSnapshotCreate(ctx context.Context, id int, name string) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.SnapshotCreateRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.SnapshotCreate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMSnapshotDelete(ctx context.Context, id, snap_id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.SnapshotDeleteRequest{SessionId: c.token, Oid: int32(id), SnapId: int32(snap_id)}
	res, err := client.SnapshotDelete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMSnapshotRevert(ctx context.Context, id, snap_id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.SnapshotRevertRequest{SessionId: c.token, Oid: int32(id), SnapId: int32(snap_id)}
	res, err := client.SnapshotRevert(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMResize(ctx context.Context, id int, tmpl string, no_overcommit bool) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.ResizeRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, NoOvercommit: no_overcommit}
	res, err := client.Resize(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMUpdateConf(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.UpdateConfRequest{SessionId: c.token, Oid: int32(id), Template: tmpl}
	res, err := client.UpdateConf(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMRecover(ctx context.Context, id, operation int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.RecoverRequest{SessionId: c.token, Oid: int32(id), Operation: int32(operation)}
	res, err := client.Recover(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMMonitoring(ctx context.Context, id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.MonitoringRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Monitoring(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) VMSchedAdd(ctx context.Context, id int, tmpl string) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.SchedAddRequest{SessionId: c.token, Oid: int32(id), Template: tmpl}
	res, err := client.SchedAdd(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMSchedUpdate(ctx context.Context, id, sched_id int, tmpl string) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.SchedUpdateRequest{SessionId: c.token, Oid: int32(id), SchedId: int32(sched_id), Template: tmpl}
	res, err := client.SchedUpdate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMSchedDelete(ctx context.Context, id, sched_id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.SchedDeleteRequest{SessionId: c.token, Oid: int32(id), SchedId: int32(sched_id)}
	res, err := client.SchedDelete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMBackup(ctx context.Context, id, ds_id int, reset bool) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.BackupRequest{SessionId: c.token, Oid: int32(id), DsId: int32(ds_id), Reset_: reset}
	res, err := client.Backup(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMBackupCancel(ctx context.Context, id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.BackupCancelRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.BackupCancel(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMRestore(ctx context.Context, id, image_id, inc_id, disk_id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.RestoreRequest{SessionId: c.token, Oid: int32(id), ImageId: int32(image_id), IncrementId: int32(inc_id), DiskId: int32(disk_id)}
	res, err := client.Restore(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMPciAttach(ctx context.Context, id int, tmpl string) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.PciAttachRequest{SessionId: c.token, Oid: int32(id), Template: tmpl}
	res, err := client.PciAttach(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMPciDetach(ctx context.Context, id, pci_id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.PciDetachRequest{SessionId: c.token, Oid: int32(id), PciId: int32(pci_id)}
	res, err := client.PciDetach(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMExec(ctx context.Context, id int, cmd string, cmd_stdin string) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.ExecRequest{SessionId: c.token, Oid: int32(id), Cmd: cmd, CmdStdin: cmd_stdin}
	res, err := client.Exec(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMExecRetry(ctx context.Context, id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.ExecRetryRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.ExecRetry(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMExecCancel(ctx context.Context, id int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.ExecCancelRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.ExecCancel(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMPoolInfo(ctx context.Context, filter, start, end, state int, filter_str string) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.PoolInfoRequest{SessionId: c.token, FilterFlag: int32(filter), Start: int32(start), End: int32(end), State: int32(state)}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) VMPoolInfoExtended(ctx context.Context, filter, start, end, state int, filter_str string) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.PoolInfoRequest{SessionId: c.token, FilterFlag: int32(filter), Start: int32(start), End: int32(end), State: int32(state)}
	res, err := client.PoolInfoExtended(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) VMPoolInfoSet(ctx context.Context, ids string, extended bool) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.PoolInfoSetRequest{SessionId: c.token, Ids: ids, Extended: extended}
	res, err := client.PoolInfoSet(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) VMPoolMonitoring(ctx context.Context, filter, seconds int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.PoolMonitoringRequest{SessionId: c.token, FilterFlag: int32(filter), Seconds: int32(seconds)}
	res, err := client.PoolMonitoring(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) VMPoolAccounting(ctx context.Context, filter, start, end int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.PoolAccountingRequest{SessionId: c.token, FilterFlag: int32(filter), StartTime: int64(start), EndTime: int64(end)}
	res, err := client.PoolAccounting(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) VMPoolShowback(ctx context.Context, filter, start_month, start_year, end_month, end_year int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.PoolShowbackRequest{SessionId: c.token, FilterFlag: int32(filter), StartMonth: int32(start_month), StartYear: int32(start_year), EndMonth: int32(end_month), EndYear: int32(end_year)}
	res, err := client.PoolShowback(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) VMPoolShowbackCalculate(ctx context.Context, start_month, start_year, end_month, end_year int) (*Response, error) {
	client := vm.NewVirtualMachineServiceClient(c.conn)
	req := &vm.PoolCalculateShowbackRequest{SessionId: c.token, StartMonth: int32(start_month), StartYear: int32(start_year), EndMonth: int32(end_month), EndYear: int32(end_year)}
	res, err := client.PoolCalculateShowback(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Virtual Network -------------------------------------------------

func (c *GRPCClient) VNetAllocate(ctx context.Context, tmpl string, cluster int) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.AllocateRequest{SessionId: c.token, Template: tmpl, ClusterId: int32(cluster)}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNetDelete(ctx context.Context, id int) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNetInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) VNetUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNetRename(ctx context.Context, id int, name string) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNetChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.ChmodRequest{
		SessionId:   c.token,
		Oid:         int32(id),
		UserUse:     int32(perm.OwnerU),
		UserManage:  int32(perm.OwnerM),
		UserAdmin:   int32(perm.OwnerA),
		GroupUse:    int32(perm.GroupU),
		GroupManage: int32(perm.GroupM),
		GroupAdmin:  int32(perm.GroupA),
		OtherUse:    int32(perm.OtherU),
		OtherManage: int32(perm.OtherM),
		OtherAdmin:  int32(perm.OtherA),
	}
	res, err := client.Chmod(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNetChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.ChownRequest{SessionId: c.token, Oid: int32(id), UserId: int32(uid), GroupId: int32(gid)}
	res, err := client.Chown(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNetLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.LockRequest{SessionId: c.token, Oid: int32(id), Level: int32(level), Test: test}
	res, err := client.Lock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNetUnlock(ctx context.Context, id int) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.UnlockRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Unlock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNetAddAR(ctx context.Context, id int, tmpl string ) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.AddARRequest{SessionId: c.token, Oid: int32(id), Template: tmpl}
	res, err := client.AddAR(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNetRmAR(ctx context.Context, id, ar_id int, force bool) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.RmARRequest{SessionId: c.token, Oid: int32(id), ArId: int32(ar_id), Force: force}
	res, err := client.RmAR(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNetUpdateAR(ctx context.Context, id int, tmpl string) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.UpdateARRequest{SessionId: c.token, Oid: int32(id), Template: tmpl}
	res, err := client.UpdateAR(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNetReserve(ctx context.Context, id int, tmpl string) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.ReserveRequest{SessionId: c.token, Oid: int32(id), Template: tmpl}
	res, err := client.Reserve(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNetFreeAR(ctx context.Context, id, ar_id int) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.FreeARRequest{SessionId: c.token, Oid: int32(id), ArId: int32(ar_id)}
	res, err := client.FreeAR(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNetHold(ctx context.Context, id int, tmpl string) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.HoldRequest{SessionId: c.token, Oid: int32(id), Template: tmpl}
	res, err := client.Hold(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNetRelease(ctx context.Context, id int, tmpl string) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.ReleaseRequest{SessionId: c.token, Oid: int32(id), Template: tmpl}
	res, err := client.Release(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNetRecover(ctx context.Context, id, operation int) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.RecoverRequest{SessionId: c.token, Oid: int32(id), Operation: int32(operation)}
	res, err := client.Recover(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNetPoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	client := vn.NewVirtualNetworkServiceClient(c.conn)
	req := &vn.PoolInfoRequest{SessionId: c.token, FilterFlag: int32(filter), Start: int32(start), End: int32(end)}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Virtual Network Template ----------------------------------------

func (c *GRPCClient) VNTemplateAllocate(ctx context.Context, tmpl string) (*Response, error) {
	client := vntemplate.NewVNTemplateServiceClient(c.conn)
	req := &vntemplate.AllocateRequest{SessionId: c.token, Template: tmpl}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNTemplateDelete(ctx context.Context, id int) (*Response, error) {
	client := vntemplate.NewVNTemplateServiceClient(c.conn)
	req := &vntemplate.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNTemplateInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := vntemplate.NewVNTemplateServiceClient(c.conn)
	req := &vntemplate.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) VNTemplateUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := vntemplate.NewVNTemplateServiceClient(c.conn)
	req := &vntemplate.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNTemplateRename(ctx context.Context, id int, name string) (*Response, error) {
	client := vntemplate.NewVNTemplateServiceClient(c.conn)
	req := &vntemplate.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNTemplateChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	client := vntemplate.NewVNTemplateServiceClient(c.conn)
	req := &vntemplate.ChmodRequest{
		SessionId:   c.token,
		Oid:         int32(id),
		UserUse:     int32(perm.OwnerU),
		UserManage:  int32(perm.OwnerM),
		UserAdmin:   int32(perm.OwnerA),
		GroupUse:    int32(perm.GroupU),
		GroupManage: int32(perm.GroupM),
		GroupAdmin:  int32(perm.GroupA),
		OtherUse:    int32(perm.OtherU),
		OtherManage: int32(perm.OtherM),
		OtherAdmin:  int32(perm.OtherA),
	}
	res, err := client.Chmod(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNTemplateChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	client := vntemplate.NewVNTemplateServiceClient(c.conn)
	req := &vntemplate.ChownRequest{SessionId: c.token, Oid: int32(id), UserId: int32(uid), GroupId: int32(gid)}
	res, err := client.Chown(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNTemplateLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	client := vntemplate.NewVNTemplateServiceClient(c.conn)
	req := &vntemplate.LockRequest{SessionId: c.token, Oid: int32(id), Level: int32(level), Test: test}
	res, err := client.Lock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNTemplateUnlock(ctx context.Context, id int) (*Response, error) {
	client := vntemplate.NewVNTemplateServiceClient(c.conn)
	req := &vntemplate.UnlockRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Unlock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNTemplateClone(ctx context.Context, id int, name string) (*Response, error) {
	client := vntemplate.NewVNTemplateServiceClient(c.conn)
	req := &vntemplate.CloneRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Clone(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNTemplateInstantiate(ctx context.Context, id int, name, extra_tmpl string) (*Response, error) {
	client := vntemplate.NewVNTemplateServiceClient(c.conn)
	req := &vntemplate.InstantiateRequest{SessionId: c.token, Oid: int32(id), Name: name, ExtraTemplate: extra_tmpl}
	res, err := client.Instantiate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VNTemplatePoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	client := vntemplate.NewVNTemplateServiceClient(c.conn)
	req := &vntemplate.PoolInfoRequest{SessionId: c.token, FilterFlag: int32(filter), Start: int32(start), End: int32(end)}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Virtual Router --------------------------------------------------

func (c *GRPCClient) VRouterAllocate(ctx context.Context, tmpl string) (*Response, error) {
	client := vrouter.NewVirtualRouterServiceClient(c.conn)
	req := &vrouter.AllocateRequest{SessionId: c.token, Template: tmpl}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VRouterDelete(ctx context.Context, id int) (*Response, error) {
	client := vrouter.NewVirtualRouterServiceClient(c.conn)
	req := &vrouter.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VRouterInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := vrouter.NewVirtualRouterServiceClient(c.conn)
	req := &vrouter.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) VRouterUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := vrouter.NewVirtualRouterServiceClient(c.conn)
	req := &vrouter.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VRouterRename(ctx context.Context, id int, name string) (*Response, error) {
	client := vrouter.NewVirtualRouterServiceClient(c.conn)
	req := &vrouter.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VRouterChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	client := vrouter.NewVirtualRouterServiceClient(c.conn)
	req := &vrouter.ChmodRequest{
		SessionId:   c.token,
		Oid:         int32(id),
		UserUse:     int32(perm.OwnerU),
		UserManage:  int32(perm.OwnerM),
		UserAdmin:   int32(perm.OwnerA),
		GroupUse:    int32(perm.GroupU),
		GroupManage: int32(perm.GroupM),
		GroupAdmin:  int32(perm.GroupA),
		OtherUse:    int32(perm.OtherU),
		OtherManage: int32(perm.OtherM),
		OtherAdmin:  int32(perm.OtherA),
	}
	res, err := client.Chmod(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VRouterChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	client := vrouter.NewVirtualRouterServiceClient(c.conn)
	req := &vrouter.ChownRequest{SessionId: c.token, Oid: int32(id), UserId: int32(uid), GroupId: int32(gid)}
	res, err := client.Chown(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VRouterLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	client := vrouter.NewVirtualRouterServiceClient(c.conn)
	req := &vrouter.LockRequest{SessionId: c.token, Oid: int32(id), Level: int32(level), Test: test}
	res, err := client.Lock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VRouterUnlock(ctx context.Context, id int) (*Response, error) {
	client := vrouter.NewVirtualRouterServiceClient(c.conn)
	req := &vrouter.UnlockRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Unlock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VRouterInstantiate(ctx context.Context, id, num_vms, template_id int, name string, hold bool, extra_tmpl string) (*Response, error) {
	client := vrouter.NewVirtualRouterServiceClient(c.conn)
	req := &vrouter.InstantiateRequest{SessionId: c.token, Oid: int32(id), NVms: int32(num_vms), TemplateId: int32(template_id), Name: name, Hold: hold, StrUattrs: extra_tmpl}
	res, err := client.Instantiate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VRouterAttachNic(ctx context.Context, id int, tmpl string) (*Response, error) {
	client := vrouter.NewVirtualRouterServiceClient(c.conn)
	req := &vrouter.AttachNicRequest{SessionId: c.token, Oid: int32(id), Template: tmpl}
	res, err := client.AttachNic(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VRouterDetachNic(ctx context.Context, id, nic_id int) (*Response, error) {
	client := vrouter.NewVirtualRouterServiceClient(c.conn)
	req := &vrouter.DetachNicRequest{SessionId: c.token, Oid: int32(id), NicId: int32(nic_id)}
	res, err := client.DetachNic(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VRouterPoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	client := vrouter.NewVirtualRouterServiceClient(c.conn)
	req := &vrouter.PoolInfoRequest{SessionId: c.token, FilterFlag: int32(filter), Start: int32(start), End: int32(end)}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- VM Group --------------------------------------------------------

func (c *GRPCClient) VMGroupAllocate(ctx context.Context, tmpl string) (*Response, error) {
	client := vmgroup.NewVMGroupServiceClient(c.conn)
	req := &vmgroup.AllocateRequest{SessionId: c.token, Template: tmpl}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMGroupDelete(ctx context.Context, id int) (*Response, error) {
	client := vmgroup.NewVMGroupServiceClient(c.conn)
	req := &vmgroup.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMGroupInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := vmgroup.NewVMGroupServiceClient(c.conn)
	req := &vmgroup.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) VMGroupUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := vmgroup.NewVMGroupServiceClient(c.conn)
	req := &vmgroup.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMGroupRename(ctx context.Context, id int, name string) (*Response, error) {
	client := vmgroup.NewVMGroupServiceClient(c.conn)
	req := &vmgroup.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMGroupChmod(ctx context.Context, id int, perm shared.Permissions) (*Response, error) {
	client := vmgroup.NewVMGroupServiceClient(c.conn)
	req := &vmgroup.ChmodRequest{
		SessionId:   c.token,
		Oid:         int32(id),
		UserUse:     int32(perm.OwnerU),
		UserManage:  int32(perm.OwnerM),
		UserAdmin:   int32(perm.OwnerA),
		GroupUse:    int32(perm.GroupU),
		GroupManage: int32(perm.GroupM),
		GroupAdmin:  int32(perm.GroupA),
		OtherUse:    int32(perm.OtherU),
		OtherManage: int32(perm.OtherM),
		OtherAdmin:  int32(perm.OtherA),
	}
	res, err := client.Chmod(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMGroupChown(ctx context.Context, id, uid, gid int) (*Response, error) {
	client := vmgroup.NewVMGroupServiceClient(c.conn)
	req := &vmgroup.ChownRequest{SessionId: c.token, Oid: int32(id), UserId: int32(uid), GroupId: int32(gid)}
	res, err := client.Chown(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMGroupLock(ctx context.Context, id, level int, test bool) (*Response, error) {
	client := vmgroup.NewVMGroupServiceClient(c.conn)
	req := &vmgroup.LockRequest{SessionId: c.token, Oid: int32(id), Level: int32(level), Test: test}
	res, err := client.Lock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMGroupUnlock(ctx context.Context, id int) (*Response, error) {
	client := vmgroup.NewVMGroupServiceClient(c.conn)
	req := &vmgroup.UnlockRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Unlock(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMGroupRoleAdd(ctx context.Context, id int, tmpl string) (*Response, error) {
	client := vmgroup.NewVMGroupServiceClient(c.conn)
	req := &vmgroup.AddRoleRequest{SessionId: c.token, Oid: int32(id), Template: tmpl}
	res, err := client.AddRole(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMGroupRoleDelete(ctx context.Context, id, role_id int) (*Response, error) {
	client := vmgroup.NewVMGroupServiceClient(c.conn)
	req := &vmgroup.DelRoleRequest{SessionId: c.token, Oid: int32(id), RoleId: int32(role_id)}
	res, err := client.DelRole(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMGroupRoleUpdate(ctx context.Context, id, role_id int, tmpl string) (*Response, error) {
	client := vmgroup.NewVMGroupServiceClient(c.conn)
	req := &vmgroup.UpdateRoleRequest{SessionId: c.token, Oid: int32(id), RoleId: int32(role_id), Template: tmpl}
	res, err := client.UpdateRole(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) VMGroupPoolInfo(ctx context.Context, filter, start, end int) (*Response, error) {
	client := vmgroup.NewVMGroupServiceClient(c.conn)
	req := &vmgroup.PoolInfoRequest{SessionId: c.token, FilterFlag: int32(filter), Start: int32(start), End: int32(end)}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- Zone ------------------------------------------------------------

func (c *GRPCClient) ZoneAllocate(ctx context.Context, tmpl string) (*Response, error) {
	client := zone.NewZoneServiceClient(c.conn)
	req := &zone.AllocateRequest{SessionId: c.token, Template: tmpl}
	res, err := client.Allocate(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ZoneDelete(ctx context.Context, id int) (*Response, error) {
	client := zone.NewZoneServiceClient(c.conn)
	req := &zone.DeleteRequest{SessionId: c.token, Oid: int32(id)}
	res, err := client.Delete(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ZoneInfo(ctx context.Context, id int, decrypt bool) (*Response, error) {
	client := zone.NewZoneServiceClient(c.conn)
	req := &zone.InfoRequest{SessionId: c.token, Oid: int32(id), Decrypt: decrypt}
	res, err := client.Info(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) ZoneUpdate(ctx context.Context, id int, tmpl string, uType int) (*Response, error) {
	client := zone.NewZoneServiceClient(c.conn)
	req := &zone.UpdateRequest{SessionId: c.token, Oid: int32(id), Template: tmpl, Append: int32(uType)}
	res, err := client.Update(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ZoneRename(ctx context.Context, id int, name string) (*Response, error) {
	client := zone.NewZoneServiceClient(c.conn)
	req := &zone.RenameRequest{SessionId: c.token, Oid: int32(id), Name: name}
	res, err := client.Rename(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ZoneAddServer(ctx context.Context, id int, tmpl string) (*Response, error) {
	client := zone.NewZoneServiceClient(c.conn)
	req := &zone.AddServerRequest{SessionId: c.token, Oid: int32(id), ZsStr: tmpl}
	res, err := client.AddServer(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ZoneDelServer(ctx context.Context, id, server_id int) (*Response, error) {
	client := zone.NewZoneServiceClient(c.conn)
	req := &zone.DelServerRequest{SessionId: c.token, Oid: int32(id), ZsId: int32(server_id)}
	res, err := client.DelServer(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ZoneResetServer(ctx context.Context, id, server_id int) (*Response, error) {
	client := zone.NewZoneServiceClient(c.conn)
	req := &zone.ResetServerRequest{SessionId: c.token, Oid: int32(id), ZsId: int32(server_id)}
	res, err := client.ResetServer(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ZoneEnable(ctx context.Context, id int, enable bool) (*Response, error) {
	client := zone.NewZoneServiceClient(c.conn)
	req := &zone.EnableRequest{SessionId: c.token, Oid: int32(id), Enable: enable}
	res, err := client.Enable(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, bodyInt: int(res.Oid)}, nil
}

func (c *GRPCClient) ZoneRaftStatus(ctx context.Context) (*Response, error) {
	client := zone.NewZoneServiceClient(c.conn)
	req := &zone.RaftStatusRequest{SessionId: c.token}
	res, err := client.RaftStatus(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) ZonePoolInfo(ctx context.Context) (*Response, error) {
	client := zone.NewZoneServiceClient(c.conn)
	req := &zone.PoolInfoRequest{SessionId: c.token}
	res, err := client.PoolInfo(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

// ---------- System ------------------------------------------------------------

func (c *GRPCClient) SystemVersion(ctx context.Context) (*Response, error) {
	client := system.NewSystemServiceClient(c.conn)
	req := &system.VersionRequest{SessionId: c.token}
	res, err := client.Version(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}

func (c *GRPCClient) SystemConfig(ctx context.Context) (*Response, error) {
	client := system.NewSystemServiceClient(c.conn)
	req := &system.ConfigRequest{SessionId: c.token}
	res, err := client.Config(ctx, req)
	if err != nil {
		return MakeErrorResponse(err)
	}
	return &Response{status: true, body: res.GetXml()}, nil
}
