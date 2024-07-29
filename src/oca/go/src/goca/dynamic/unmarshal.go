/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

package dynamic

import (
	"encoding/xml"
	"fmt"
	"io"
)

// Dynamic template parsing

// There is two type of data in a TEMPLATE, Pair and Vector.
// A Vector contains a collection of Pair.
//
// In order to parse dynamically a TEMPLATE, we need to look at three next token
// to distinguish between these types.
//
// There is three types of tokens: StartElement, CharData, EndElement.
// While parsing a TEMPLATE, a problem may occur: when there is some chars between two opening tokens.
//
// Here is the two cases we want to avoid:
// tokPrev        tok            tokNext
// CharData       StartElement   StartElement
// StartElement   CharData       StartElement

// xmlPair contains temporary pair informations
type xmlPair struct {
	XMLName xml.Name
	Content string `xml:",chardata"`
}

// UnmarshalXML parse dynamically a template under the TEMPLATE token
func (t *Template) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {

	// Ensure that first token is a StartElement
	for {

		tok, err := d.Token()
		if err != nil {
			if err.Error() == io.EOF.Error() {
				break
			}
			return err
		}

		tokPrev := xml.CopyToken(tok)

		switch tokPrev.(type) {

		case xml.CharData:
			// CharData X X

		case xml.StartElement:
			// StartElement X X

			startTokPrev, _ := tokPrev.(xml.StartElement)
			err := unmarshalTemplateElement(d, startTokPrev, t)
			if err != nil {
				return err
			}

		case xml.EndElement:
			// EndElement X X
			break

		}
	}

	return nil
}

// unmarshalTemplateElement unmarshal only one element, a pair, or a vector
func unmarshalTemplateElement(d *xml.Decoder, tokPrev xml.StartElement, t *Template) error {

	// Ensure that (tok, tokNext) != (Chardata, StartElement)
	// if tokNext is a start element, then we should have a vector

	tok, err := d.Token()
	if err != nil {
		if err.Error() == io.EOF.Error() {
			return nil
		}
		return err
	}

	switch tok.(type) {

	case xml.EndElement:
		// StartElement EndElement X

	case xml.StartElement:
		// StartElement StartElement X --> it's a vector

		var pair xmlPair

		tokPairStart, ok := tok.(xml.StartElement)
		if !ok {
			return fmt.Errorf("unmarshalTemplateElement UnmarshalXML: start element attended")
		}

		vec := t.AddVector(tokPrev.Name.Local)

		// Add first pair from tok
		err := d.DecodeElement(&pair, &tokPairStart)
		if err != nil {
			return err
		}
		vec.AddPair(pair.XMLName.Local, pair.Content)

		// unmarshal the rest of the vector
		err = vec.UnmarshalXML(d, tokPrev)
		if err != nil {
			return fmt.Errorf("unmarshalTemplateElement vector UnmarshalXML: %s", err)
		}

	case xml.CharData:
		// StartElement CharData X
		// We need to know what is the token X

		// As we call Token method again, we must save the chardata buffer in case we need it later
		tokSav := xml.CopyToken(tok)

	loop:
		for {

			// need to look at a third token to distinguish between pair and vector
			tokNext, err := d.Token()
			if err != nil {
				if err.Error() == io.EOF.Error() {
					return nil
				}
				return err
			}

			switch tokNext.(type) {

			case xml.StartElement:
				// StartElement CharData StartElement
				// There is some characters between two opening tags,
				// we shift last element to the left:
				// StartElement StartElement X

				tok = xml.CopyToken(tokNext)

			case xml.EndElement:
				// StartElement CharData EndElement --> it's a pair
				// Or, after shift:
				// StartElement StartElement EndElement --> not handled below

				// It's a pair
				tokData, ok := tokSav.(xml.CharData)
				if ok {
					t.AddPair(tokPrev.Name.Local, string(tokData))
				}

				break loop

			case xml.CharData:
				// StartElement CharData CharData --> should not occur
				// Or, after shift:
				// StartElement StartElement CharData --> it's a vector

				// Need to copy, to avoid next Token call to rewrite the chardata buffer
				tokData, _ := tokNext.(xml.CharData)
				cdata := tokData.Copy()

				startVec, ok := tok.(xml.StartElement)
				if !ok {
					return fmt.Errorf("unmarshalTemplateElement: start element expected")
				}

				vec := t.AddVector(tokPrev.Name.Local)

				// consume EndElement of the first pair
				_, err = d.Token()
				if err != nil {
					return err
				}

				vec.AddPair(startVec.Name.Local, string(cdata))

				// unmarshal the rest of the vector
				err = vec.UnmarshalXML(d, tokPrev)
				if err != nil {
					return fmt.Errorf("unmarshalTemplateElement vector UnmarshalXML: %s", err)
				}

				break loop

			}
		}

	}

	return nil
}

// UnmarshalXML parse dynamically a bunch of pairs
func (t *Pairs) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {

	// In case we unmarshal a simple vector, then we need to initialize it
	if t == nil {
		pairs := make(Pairs, 0, 2)
		t = &pairs
	}

loop:
	for {

		// Retrieve the next token
		token, err := d.Token()
		if err != nil {
			if err.Error() == io.EOF.Error() {
				return nil
			}
			return err
		}

		// Add a pair to the vector on a StartElement
		switch e := token.(type) {

		case xml.StartElement:
		// unexpected
		case xml.CharData:
			t.AddPair(start.Name.Local, string(e))
		case xml.EndElement:
			break loop

		}

	}

	return nil
}

// UnmarshalXML parse dynamically a vector. Either a single vector, or inside of a TEMPLATE.
func (t *Vector) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {

	// In case we unmarshal a simple vector, then we need to initialize it
	if t.Pairs == nil {
		t.XMLName.Local = start.Name.Local
		t.Pairs = make([]Pair, 0, 2)
	}

	var pair xmlPair
loop:
	for {

		// Retrieve the next token
		token, err := d.Token()
		if err != nil {
			if err.Error() == io.EOF.Error() {
				return nil
			}
			return err
		}

		// Add a pair to the vector on a StartElement
		switch token.(type) {

		case xml.StartElement:

			startEl, _ := token.(xml.StartElement)
			err = d.DecodeElement(&pair, &startEl)
			if err != nil {
				return err
			}
			t.AddPair(pair.XMLName.Local, pair.Content)

		case xml.CharData:
		case xml.EndElement:
			break loop

		}

	}

	return nil
}
