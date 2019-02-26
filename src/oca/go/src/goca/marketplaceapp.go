package goca

import (
	"encoding/xml"
	"errors"
)

// MarketPlaceAppPool represents an OpenNebula MarketPlaceAppPool
type MarketPlaceAppPool struct {
	MarketPlaceApps []MarketPlaceApp `xml:"MARKETPLACEAPP"`
}

// MarketPlaceApp represents an OpenNebula MarketPlaceApp
type MarketPlaceApp struct {
	ID            uint                   `xml:"ID"`
	UID           int                    `xml:"UID"`
	GID           int                    `xml:"GID"`
	UName         string                 `xml:"UNAME"`
	GName         string                 `xml:"GNAME"`
	LockInfos     *Lock                  `xml:"LOCK"`
	Permissions   *Permissions           `xml:"PERMISSIONS"`
	RegTime       int                    `xml:"REGTIME"`
	Name          string                 `xml:"NAME"`
	ZoneId        string                 `xml:"ZONE_ID"`
	OriginId      string                 `xml:"ORIGIN_ID"`
	Source        string                 `xml:"SOURCE"`
	MD5           string                 `xml:"MD5"`
	Size          int                    `xml:"SIZE"`
	Description   string                 `xml:"DESCRIPTION"`
	Version       string                 `xml:"VERSION"`
	Format        string                 `xml:"FORMAT"`
	AppTemplate64 string                 `xml:"APPTEMPLATE64"`
	MarketPlaceID int                    `xml:"MARKETPLACEID"`
	MarketPlace   string                 `xml:"MARKETPLACE"`
	State         int                    `xml:"STATE"`
	Type          int                    `xml:"TYPE"`
	Template      marketPlaceAppTemplate `xml:"TEMPLATE"`
}

type marketPlaceAppTemplate struct {
	Dynamic unmatchedTagsSlice `xml:,any`
}

// NewMarketPlaceAppPool returns a marketplace app pool. A connection to OpenNebula is
// performed.
func NewMarketPlaceAppPool(args ...int) (*MarketPlaceAppPool, error) {
	var who, start, end int

	switch len(args) {
	case 0:
		who = PoolWhoMine
		start = -1
		end = -1
	case 1:
		who = args[0]
		start = -1
		end = -1
	case 3:
		who = args[0]
		start = args[1]
		end = args[2]
	default:
		return nil, errors.New("Wrong number of arguments")
	}

    response, err := client.Call("one.marketapppool.info", who, start, end)
	if err != nil {
		return nil, err
	}

	marketappPool := &MarketPlaceAppPool{}
	err = xml.Unmarshal([]byte(response.Body()), marketappPool)
	if err != nil {
		return nil, err
	}

	return marketappPool, nil
}

// NewMarketPlaceApp finds a marketplace app object by ID. No connection to OpenNebula.
func NewMarketPlaceApp(id uint) *MarketPlaceApp {
	return &MarketPlaceApp{ID: id}
}

// NewMarketPlaceAppFromName finds a marketplace app object by name. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the marketplace app.
func NewMarketPlaceAppFromName(name string) (*MarketPlaceApp, error) {
	var id uint

	marketAppPool, err := NewMarketPlaceAppPool()
	if err != nil {
		return nil, err
	}

	match := false
	for i := 0; i < len(marketAppPool.MarketPlaceApps); i++ {
		if marketAppPool.MarketPlaceApps[i].Name != name {
			continue
		}
		if match {
			return nil, errors.New("multiple resources with that name")
		}
		id = marketAppPool.MarketPlaceApps[i].ID
		match = true
	}
	if !match {
		return nil, errors.New("resource not found")
	}

	return NewMarketPlaceApp(id), nil
}

// CreateMarketPlaceApp allocates a new marketplace app. It returns the new marketplace app ID.
// * tpl: template of the marketplace app
// * market: market place ID
func CreateMarketPlaceApp(tpl string, market int) (uint, error) {
	response, err := client.Call("one.marketapp.allocate", tpl, market)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given marketplace app from the pool.
func (marketApp *MarketPlaceApp) Delete() error {
	_, err := client.Call("one.marketapp.delete", marketApp.ID)
	return err
}

// Enable enables or disables a marketplace app.
// * enable: True for enabling, False for disabling
func (marketApp *MarketPlaceApp) Enable(enable bool) error {
    _, err := client.Call("one.marketapp.enable", marketApp.ID, enable)
    return err
}

// Update replaces the marketplace app template contents.
// * tpl: The new template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (marketApp *MarketPlaceApp) Update(tpl string, appendTemplate int) error {
	_, err := client.Call("one.marketapp.update", marketApp.ID, tpl, appendTemplate)
	return err
}

// Chmod changes the permission bits of a marketplace app
// * uu: USER USE bit. If set to -1, it will not change.
// * um: USER MANAGE bit. If set to -1, it will not change.
// * ua: USER ADMIN bit. If set to -1, it will not change.
// * gu: GROUP USE bit. If set to -1, it will not change.
// * gm: GROUP MANAGE bit. If set to -1, it will not change.
// * ga: GROUP ADMIN bit. If set to -1, it will not change.
// * ou: OTHER USE bit. If set to -1, it will not change.
// * om: OTHER MANAGE bit. If set to -1, it will not change.
// * oa: OTHER ADMIN bit. If set to -1, it will not change.
func (marketApp *MarketPlaceApp) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := client.Call("one.marketapp.chmod", marketApp.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
	return err
}

// Chown changes the ownership of a marketplace app.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (marketApp *MarketPlaceApp) Chown(userID, groupID int) error {
	_, err := client.Call("one.marketapp.chown", marketApp.ID, userID, groupID)
	return err
}

// Rename renames a marketplace app.
// * newName: The new name.
func (marketApp *MarketPlaceApp) Rename(newName string) error {
	_, err := client.Call("one.marketapp.rename", marketApp.ID, newName)
	return err
}

// Info retrieves information for the marketplace app.
func (marketApp *MarketPlaceApp) Info() error {
	response, err := client.Call("one.marketapp.info", marketApp.ID)
	if err != nil {
		return err
	}
	*marketApp = MarketPlaceApp{}
	return xml.Unmarshal([]byte(response.Body()), marketApp)
}

// Lock locks the marketplace app depending on blocking level.
func (marketApp *MarketPlaceApp) Lock(level uint) error {
	_, err := client.Call("one.marketapp.lock", marketApp.ID, level)
	return err
}

// Unlock unlocks the marketplace app.
func (marketApp *MarketPlaceApp) Unlock() error {
	_, err := client.Call("one.marketapp.unlock", marketApp.ID)
	return err
}

// Lock actions

// LockUse locks USE actions for the marketplace app
func (marketApp *MarketPlaceApp) LockUse() error {
    return marketApp.Lock(1)
}

// LockManage locks MANAGE actions for the marketplace app
func (marketApp *MarketPlaceApp) LockManage() error {
    return marketApp.Lock(2)
}

// LockAdmin locks ADMIN actions for the marketplace app
func (marketApp *MarketPlaceApp) LockAdmin() error {
    return marketApp.Lock(3)
}

// LockAll locks all actions for the marketplace app
func (marketApp *MarketPlaceApp) LockAll() error {
    return marketApp.Lock(4)
}
