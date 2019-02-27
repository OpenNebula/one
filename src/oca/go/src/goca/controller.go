package goca

// RPCCaller is the interface to satisfy in order to be usable by the controller
type RPCCaller interface {
	Call(method string, args ...interface{}) (*Response, error)
	EndpointCall(url, method string, args ...interface{}) (*Response, error)
}

// Controller is the controller used to make requets on various entities
type Controller struct {
	Client RPCCaller
}

// entitiesController is a controller for entitites
type entitiesController struct {
	c *Controller
}

// entityController is a controller for an entity
type entityController struct {
	c  *Controller
	ID uint
}

// entityControllerName is a controller for an entity
type entityNameController struct {
	c    *Controller
	Name string
}

// NewController return a new one controller
func NewController(c RPCCaller) *Controller {
	return &Controller{
		Client: c,
	}
}

// SystemVersion returns the current OpenNebula Version
func (c *Controller) SystemVersion() (string, error) {
	response, err := c.Client.Call("one.system.version")
	if err != nil {
		return "", err
	}

	return response.Body(), nil
}

// SystemConfig returns the current OpenNebula config
func (c *Controller) SystemConfig() (string, error) {
	response, err := c.Client.Call("one.system.config")
	if err != nil {
		return "", err
	}

	return response.Body(), nil
}
