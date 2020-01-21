import React, { useState } from "react";
import { Accordion, Card } from "react-bootstrap";
import { useAccordionToggle } from "react-bootstrap/AccordionToggle";

export default function(props) {
  const [toggleOpened, setToggleOpened] = useState(-1);

  const CustomToggle = function(props) {
    const clickHandler = useAccordionToggle(props.eventKey, e => {
      if (props.eventKey === toggleOpened) {
        setToggleOpened(-1);
      } else {
        setToggleOpened(props.eventKey);
      }
    });

    return (
      <div className="clickme" onClick={clickHandler}>
        {props.children +
          " (click to " +
          (props.eventKey !== toggleOpened ? "show" : "hide") +
          ")"}
      </div>
    );
  };

  return (
    <Accordion>
      <Card border="info">
        <Card.Header>
          <CustomToggle eventKey="0">Help Documentation</CustomToggle>
        </Card.Header>
        <Accordion.Collapse eventKey="0">
          <Card.Body>
            <div className="inHelp">
              <div>
                <h1>Web Observability Plotter</h1>
                <h2>Jamie.Stevens@csiro.au, 2020</h2>
              </div>
              <div>
                This is some very basic information to help you use this tool.
              </div>
              <hr />
              <h3>The Chart</h3>
              <div>
                <h5>What is displayed on the observability chart?</h5>
                <div>
                  At the top of the chart is displayed the settings used to make
                  it, so when you save the chart (see{" "}
                  <a href="#faq_saving_chart">"How do I save the chart?"</a>)
                  this information is preserved. This information includes the
                  observatory and the selected date. The Sun rise and set times
                  in both UTC (and LST in parentheses) are shown, for a rise/set
                  angle in degrees (see{" "}
                  <a href="#faq_selecting_twilight_elevation">
                    "How do I change the Sun rise angle?"
                  </a>
                  ).
                </div>
                <div>
                  Each day is shown as UTC, with midnight on the left and right
                  edges, and midday in the middle. The hours are painted in
                  white and grey alternating stripes. The local night time is
                  shaded in a darker grey (this time is between when the Sun
                  sets and rises, according to the angle you have chosen). The
                  sidereal time on this day is shown at the bottom x-axis, and
                  every second LST hour is marked by a dashed line running the
                  entire height of the chart.
                </div>
                <div>
                  Each source is shown as a horizontal bar with vertical ticks
                  which mark the time at which the source crosses user-specified
                  elevations (see{" "}
                  <a href="#faq_elevation_indicators">
                    "How do I change which elevation markers are shown?"
                  </a>
                  ). Each elevation marker (you can specify up to three) is
                  coloured, and the key is presented just under the "UTC" label
                  at the top-left of the chart. The UTC times for each elevation
                  crossing are given above the ticks (in the same colour as the
                  tick), and the LST times are given below the ticks. The name
                  of the source is given in the left margin of the chart, at the
                  same level as the horizontal bar.
                </div>
              </div>
              <div>
                <a name="faq_saving_chart" />
                <h5>How do I save the chart?</h5>
                <div>
                  The chart, when rendered in a browser, is just an image.
                  Simply right-click anywhere on the chart and select "Save
                  image as".
                </div>
              </div>
              <hr />
              <h3>Chart Parameters</h3>
              <div>
                <a name="faq_selecting_date" />
                <h5>How do I select the date?</h5>
                <div>
                  The date to display can be selected by hitting the button at
                  the top of the page which shows the date. Select the date
                  using the calendar which appears. When finished, close the
                  calendar popup using the close button at top-right. The page
                  will automatically update to reflect the date you chose.
                </div>
                <div>
                  Alternatively, if you just want to change the date by a couple
                  of days, you may prefer to use the arrow buttons next to the
                  date display; these change the date +/- 1 day from the
                  currently displayed date.
                </div>
              </div>
              <div>
                <a name="faq_selecting_location" />
                <h5>How do I select the observing location?</h5>
                <div>
                  On the top right-hand corner of the page you will see a
                  hamburger icon (&equiv;); clicking this will open the
                  "Options" panel (or hide it if it is already shown). At the
                  top of the options table is the "Location" selector; use this
                  to select which observatory to use for the source
                  calculations.
                </div>
              </div>
              <div>
                <a name="faq_selecting_twilight_elevation" />
                <h5>How do I change the sun rise angle?</h5>
                <div>
                  On the top right-hand corner of the page you will see a
                  hamburger icon (&equiv;); clicking this will open the
                  "Options" panel (or hide it if it is already shown). In the
                  options table is an option for "Twilight Elevation", and by
                  default this is set to 0&deg;. This represents when the Sun
                  transitions between above and below the physical horizon.
                </div>
                <div>
                  If you would rather the daylight begin when Civil Twilight
                  ends, set this to -6&deg;. For Nautical Twilight, set it to
                  -12&deg;, and for Astronomical Twilight, set it to -18&deg;.
                </div>
                <div>
                  These are just common conventions however, and this option can
                  be set to any desired value. When this value is altered the
                  line below the input will turn red to indicate that a change
                  has been made; press Enter to effect the change.
                </div>
              </div>
              <div>
                <a name="faq_elevation_indicators" />
                <h5>How do I change which elevation markers are shown?</h5>
                <div>
                  On the top right-hand corner of the page you will see a
                  hamburger icon (&equiv;); clicking this will open the
                  "Options" panel (or hide it if it is already shown). At the
                  bottom of the options table are the "Elevation Indicators",
                  and there are three of these, each represented by a different
                  colour (these colours can not be changed).
                </div>
                <div>
                  The first of these indicators can not be changed, and is
                  always set to the physical elevation limit of the primary
                  telescope at the observatory location. The other two
                  indicators can be set to whichever elevation (in degrees) that
                  you would like. When an elevation value is changed, the line
                  below the input will turn red to indicate that a change has
                  been made; press Enter to effect the change.
                </div>
                <div>
                  You can select which of the elevation indicators to display on
                  the chart using the checkboxes to the left of each indicator
                  colour.
                </div>
              </div>
              <hr />
              <h3>Sources</h3>
              <div>
                <a name="faq_adding_source" />
                <h5>How do I add a source?</h5>
                <div>
                  To add a new source, hit one of the "Add Source" buttons above
                  or below the chart. This will reveal the left-side "Add
                  Source" panel (if it isn't already showing). Each source needs
                  a unique name, plus a coordinate (either in J2000 Right
                  Ascension and Declination, or Galactic latitude and
                  longitude). If the source is an ATCA calibrator, put in the
                  name and either hit enter, or press the "Resolve Name" button;
                  the RA and Dec should automatically be filled shortly
                  afterwards.
                </div>
                <div>
                  Otherwise, select the coordinate system you want to use and
                  fill the coordinates in manually. Once you hit the "Add
                  Source" button underneath the coordinate inputs, your source
                  will be added to the chart, at the bottom.
                </div>
              </div>
              <div>
                <a name="faq_removing_source" />
                <h5>How do I remove a source?</h5>
                <div>
                  There are two ways to remove a source. For both ways you need
                  to hit one of the "Manage Sources" buttons above or below the
                  chart. This will reveal the left-side "Manage Sources" panel
                  (if it isn't already showing). All the sources you have
                  specified are shown in a table at the bottom of this panel.
                </div>
                <div>
                  If you would like to stop showing a source in the chart, but
                  would prefer that the browser not forget about the source (so
                  you can redisplay it in the chart later), uncheck the "Show"
                  box to the left of the source name in the table.
                </div>
                <div>
                  If you would prefer to delete the source entirely from the
                  browser's memory, hit the "Delete" button to the right of the
                  source name.
                </div>
              </div>
              <div>
                <a name="faq_altering_source" />
                <h5>How do I change a source's name or coordinate?</h5>
                <div>
                  First, press one of the "Manage Sources" buttons above or
                  below the chart. This will reveal the left-side "Manage
                  Sources" panel (if it isn't already showing). All the sources
                  you have specified are shown in a table at the bottom of this
                  panel.
                </div>
                <div>
                  Clicking on a source in this table will fill the table at the
                  top of the panel with its current details (name and
                  coordinates). To modify them, simply change them in the table
                  and press the "Update Source" button.
                </div>
              </div>
              <div>
                <a name="faq_source_ordering" />
                <h5>How do I change the order of the sources on the chart?</h5>
                <div>
                  To move a source to be plotted above another in the chart,
                  simply drag the source name (shown in the left margin of the
                  chart) to a position above the other source's name. To move a
                  source to be plotted below another, drag the source name to a
                  position below the other source's name. The chart will update
                  with the new order, and the "Manage Sources" table will also
                  reflect this new ordering.
                </div>
              </div>
              <hr />
              <h3>General</h3>
              <a name="faq_memory" />
              <h5>
                How does the page store the sources I show? Are you spying on
                me?
              </h5>
              <div>
                All data is stored in your browser's local cache, and no
                communication is made to any external server, save for when you
                attempt to resolve a source name (and queries to that service
                are not tracked). This site does not use cookies.
              </div>
              <div>
                It is not just sources which are cached either. All settings are
                remembered between sessions (location, elevation limits, etc.).
                However, there is currently no easy way for you to access the
                settings from one browser in another.
              </div>
            </div>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
      <Card border="info">
        <Card.Header>
          <CustomToggle eventKey="1">Changelog</CustomToggle>
        </Card.Header>
        <Accordion.Collapse eventKey="1">
          <Card.Body>
            <div className="inHelp">
              <div>
                <b>2020-January-21</b>: Initial release.
              </div>
              <div>
                <b>Web Observability Plotter</b>: a convenient interactive
                interface to calculate when astronomical sources are visible to
                a telescope.
                <br />
                Copyright (C) 2020, Jamie Stevens
              </div>
              <div>
                This program is free software: you can redistribute it and/or
                modify it under the terms of the GNU General Public License as
                published by the Free Software Foundation, either version 3 of
                the License, or (at your option) any later version.
              </div>
              <div>
                This program is distributed in the hope that it will be useful,
                but WITHOUT ANY WARRANTY; without even the implied warranty of
                MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
                General Public License for more details.
              </div>
              <div>
                You should have received a copy of the GNU General Public
                License along with this program. If not, see{" "}
                <a href="https://www.gnu.org/licenses/">
                  https://www.gnu.org/licenses/
                </a>
                .
              </div>
              <div>
                Source code for this application can be found at{" "}
                <a href="https://github.com/ste616/web-observability-plotter">
                  GitHub
                </a>
                .
              </div>
            </div>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  );
}
