// Library imports.
import React, { useState, useEffect, useReducer } from "react";
import axios from "axios";
import { RequestProvider } from "react-request-hook";
import ContainerDimensions from "react-container-dimensions";
import { useMediaQuery } from "react-responsive";
// Our own modules.
import { useStateWithLocalStorage } from "./storage";
import LocationDatabase from "./observatories";
import { dateDetails, DatePicker } from "./date";
import SideBar from "./SideBar";
import { SourceAdder, SourceManager, calculateSourceDetails } from "./sources";
import { AppOptions } from "./options";
import { DayPlotter } from "./canvas";
import Help from "./Help";
// Styles.
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";
import "./styles.scss";

// Required so we can resolve source names.
const axiosInstance = axios.create({
  baseURL: "https://www.narrabri.atnf.csiro.au"
});

export default function App(props) {
  const [selectedDate, selectDate] = useState(new Date());
  const [userSources, setUserSources] = useStateWithLocalStorage(
    "userSources",
    [
      {
        name: "1934-638",
        specification: {
          right: "19:39:25.026",
          left: "-63:42:45.63",
          type: 0
        },
        rightAscension: 19.65695167,
        declination: -63.712675,
        hidden: false
      }
    ]
  );

  // The observatory information and handler for when it changes.
  const [locationName, setLocationName] = useStateWithLocalStorage(
    "observatory",
    "atca"
  );
  const [location, setLocation] = useState(LocationDatabase[locationName]);
  const [twilightElevation, setTwilightElevation] = useStateWithLocalStorage(
    "twilightElevation",
    0.0
  );
  const [elevationDisplays, setElevationDisplays] = useStateWithLocalStorage(
    "elevationDisplays",
    [
      {
        elevation: location.elevationLimit,
        color: "#000000",
        display: true,
        changeable: false
      },
      {
        elevation: 2 * location.elevationLimit,
        color: "#873600",
        display: false,
        changeable: true
      },
      {
        elevation: 2.5 * location.elevationLimit,
        color: "#145a32",
        display: false,
        changeable: true
      }
    ]
  );

  useEffect(() => {
    setLocation(LocationDatabase[locationName]);
  }, [locationName]);
  useEffect(() => {
    // Set the displayed elevation limits again if the location changes.
    var nLes = [...elevationDisplays];
    nLes[0].elevation = location.elevationLimit;
    setElevationDisplays(nLes);
  }, [location]);

  // What does the date look like?
  const [skyTime, skyDispatcher] = useReducer(
    dateDetails,
    dateDetails({}, { location: location, date: selectedDate })
  );
  useEffect(() => {
    skyDispatcher({ date: selectedDate, location: location });
  }, [selectedDate, location]);

  // Control of the side bars.
  const sidebarsStartOpen = useMediaQuery({
    query: "(orientation: landscape)"
  });
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(sidebarsStartOpen);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(sidebarsStartOpen);
  // And which panel is shown at the left?
  const [addSourceVisible, setAddSourceVisible] = useState(true);
  const changeLeftVisible = function(e) {
    var showSide = false;
    if (e.currentTarget.id.startsWith("add")) {
      setAddSourceVisible(true);
      showSide = true;
    } else if (e.currentTarget.id.startsWith("modify")) {
      setAddSourceVisible(false);
      showSide = true;
    }
    if (showSide) {
      setLeftSidebarOpen(true);
    }
  };

  // Work out where the sources appear.
  const [sourceDetails, sourceDispatcher] = useReducer(
    calculateSourceDetails,
    []
  );
  useEffect(() => {
    sourceDispatcher({
      sources: userSources,
      location: location,
      elevationLimits: elevationDisplays,
      sun: skyTime.solarPosition,
      twilightElevation: twilightElevation
    });
  }, [
    userSources,
    location,
    skyTime.solarPosition,
    twilightElevation,
    elevationDisplays
  ]);

  console.log("how many times");
  return (
    <RequestProvider value={axiosInstance}>
      <div id="layout">
        <SideBar
          open={leftSidebarOpen}
          setOpen={setLeftSidebarOpen}
          side="left"
          headerTitle={addSourceVisible ? "Add Source" : "Manage Sources"}
        >
          {addSourceVisible ? (
            <SourceAdder sources={userSources} setSources={setUserSources} />
          ) : (
            <SourceManager sources={userSources} setSources={setUserSources} />
          )}
        </SideBar>
        <div className="main" style={{ width: "100%" }}>
          <div className="header">
            <DatePicker date={selectedDate} changeDate={selectDate} />
          </div>
          <div className="content" id="plottingArea">
            <button
              className="halfWidthButton actionButtons"
              id="addSourceTop"
              onClick={changeLeftVisible}
            >
              Add Source
            </button>
            <button
              className="halfWidthButton actionButtons"
              id="modifySourceTop"
              onClick={changeLeftVisible}
            >
              Manage Sources
            </button>
            <ContainerDimensions>
              <DayPlotter
                date={selectedDate}
                sources={[
                  {
                    name: "Sun",
                    rightAscension: skyTime.solarPosition[0],
                    declination: skyTime.solarPosition[1]
                  }
                ].concat(userSources)}
                sourceDetails={sourceDetails}
                location={location}
                skyTime={skyTime}
                setUserSources={setUserSources}
              />
            </ContainerDimensions>
            <button
              className="halfWidthButton actionButtons"
              id="addSourceBottom"
              onClick={changeLeftVisible}
            >
              Add Source
            </button>
            <button
              className="halfWidthButton actionButtons"
              id="modifySourceBottom"
              onClick={changeLeftVisible}
            >
              Manage Sources
            </button>
            <Help />
          </div>
        </div>
        <SideBar
          open={rightSidebarOpen}
          setOpen={setRightSidebarOpen}
          side="right"
          headerTitle="Options"
        >
          <AppOptions
            location={locationName}
            setLocation={setLocationName}
            twilightElevation={twilightElevation}
            setTwilightElevation={setTwilightElevation}
            elevationDisplays={elevationDisplays}
            setElevationDisplays={setElevationDisplays}
          />
        </SideBar>
      </div>
    </RequestProvider>
  );
}
