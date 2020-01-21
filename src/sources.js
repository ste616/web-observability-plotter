import React, { useState, useEffect, useRef } from "react";
import { availableCoordinates } from "./coordinates";
import { useRequest } from "react-request-hook";
import { onEnter, hoursBounds } from "./common";
import { parseCoordinate, HASetAzEl, eqAzEl } from "./coordinates";

const calculateSourceDetails = function(state, action) {
  // Our list of hour angles.
  var hourAngleList = [];
  for (var i = -12; i < 12; i += 0.5) {
    hourAngleList.push(i);
  }

  var calculator = function(s, e) {
    // Filter the elevations based on whether they're displayed, then
    // sort them into increasing elevation order.
    var de = e
      .filter(el => el.display)
      .sort((a, b) => {
        return a.elevation - b.elevation;
      });

    // Calculate the hour angle at which the source is at the
    // elevation limit.
    var t = de.map(el => ({
      hourAngle:
        HASetAzEl(s.declination, action.location.latitude, el.elevation) / 15,
      color: el.color
    }));
    // Get rid of elevation limits that don't get met.
    t = t.filter(a => !isNaN(a.hourAngle)); // Checking for NaNs.
    // For a set of hour angles, calculate the source's elevation.
    var els = hourAngleList.map(h => {
      var r = eqAzEl(h, s.declination, action.location.latitude);
      return r[1];
    });
    var lsts = hourAngleList.map(h => hoursBounds(s.rightAscension + h));
    return {
      rise: t.map(a => hoursBounds(s.rightAscension - a.hourAngle)),
      set: t.map(a => hoursBounds(s.rightAscension + a.hourAngle)),
      elLimits: de,
      colors: t.map(a => a.color),
      elevations: els,
      lsts: lsts,
      hidden: s.hidden
    };
  };

  var setTimes = [];
  if (Array.isArray(action.sources)) {
    setTimes = action.sources.map(s => calculator(s, action.elevationLimits));
  }

  // Calculate the same stuff for the Sun, and stick it on the front.
  var sunTimes = calculator(
    {
      rightAscension: action.sun[0],
      declination: action.sun[1]
    },
    [{ elevation: action.twilightElevation, display: true }]
  );
  setTimes.unshift(sunTimes);
  return setTimes;
};

const SourceAdder = function(props) {
  const [coordinateType, setCoordinateType] = useState(0);
  const [coordinateRightLabel, setCoordinateRightLabel] = useState(
    availableCoordinates[coordinateType].rightLabel
  );
  const [coordinateLeftLabel, setCoordinateLeftLabel] = useState(
    availableCoordinates[coordinateType].leftLabel
  );
  const [errorMessage, _setErrorMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [errorClasses, setErrorClasses] = useState(["hidden"]);

  const coordinateSelected = function(e) {
    // The user has selected one of the coordinate systems.
    for (var i = 0; i < availableCoordinates.length; i++) {
      if (availableCoordinates[i].label === e.currentTarget.value) {
        setCoordinateType(i);
        break;
      }
    }
  };

  useEffect(() => {
    setCoordinateRightLabel(availableCoordinates[coordinateType].rightLabel);
    setCoordinateLeftLabel(availableCoordinates[coordinateType].leftLabel);
  }, [coordinateType]);

  const rightCoordinateRef = useRef(null);
  const leftCoordinateRef = useRef(null);
  const nameRef = useRef(null);

  const addSource = function() {
    // We are called when the user wants the coordinates to be interpreted.

    // Get the location attributes.
    var name = nameRef.current.value;
    var rightCoord = rightCoordinateRef.current.value;
    var leftCoord = leftCoordinateRef.current.value;

    // Try to interpret the right and left coordinates as sexagesimal first.
    var rightValue = parseCoordinate(
      rightCoord,
      availableCoordinates[coordinateType].rightMetadata
    );
    if (rightValue === null) {
      // No good, we give the user an error.
      setErrorMessage(
        "Can't interpret " + availableCoordinates[coordinateType].rightLabel
      );
      return;
    }
    var leftValue = parseCoordinate(
      leftCoord,
      availableCoordinates[coordinateType].leftMetadata
    );
    if (leftValue == null) {
      setErrorMessage(
        "Can't interpret " + availableCoordinates[coordinateType].leftLabel
      );
      return;
    }
    // Check for duplicate name.
    for (var i = 0; i < props.sources.length; i++) {
      if (props.sources[i].name === name) {
        setErrorMessage("Source with that name already exists!");
        return;
      }
    }
    // We have enough information.
    clearErrorMessage();

    // The source values have to be in right ascension and
    // declination J2000. Check if we need to do a conversion.
    if (availableCoordinates[coordinateType].label !== "RA/Dec J2000") {
      [rightValue, leftValue] = availableCoordinates[coordinateType].converter(
        rightValue,
        leftValue
      );
    }

    var addedSource = {
      name: name,
      specification: {
        right: rightCoord,
        left: leftCoord,
        type: coordinateType
      },
      rightAscension: rightValue,
      declination: leftValue,
      hidden: false
    };
    props.setSources([...props.sources, addedSource]);
    setSuccessMessage("Source " + name + " added.");
  };

  const [msgTimer, setMsgTimer] = useState(null);
  const messageDisplayTimeSeconds = 10;

  const clearErrorMessage = function() {
    _setErrorMessage("");
    setMessageType("");
    setErrorClasses(["hidden"]);
    if (msgTimer !== null) {
      clearTimeout(msgTimer);
      setMsgTimer(null);
    }
  };

  const setSelfDestruct = function() {
    // Check for an already proceeding self-destruction.
    if (msgTimer !== null) {
      clearTimeout(msgTimer);
    }
    setMsgTimer(
      setTimeout(clearErrorMessage, messageDisplayTimeSeconds * 1000)
    );
  };

  const setErrorMessage = function(msg) {
    // Called when the message to show is an error.
    _setErrorMessage(msg);
    setMessageType("error");
    setErrorClasses(["errorMessage"]);
    setSelfDestruct();
  };

  const setStatusMessage = function(msg) {
    // Called when the message to show is just a status update.
    _setErrorMessage(msg);
    setMessageType("status");
    setErrorClasses(["statusMessage"]);
  };

  const setSuccessMessage = function(msg) {
    // Called when the message to show is a success message.
    _setErrorMessage(msg);
    setMessageType("success");
    setErrorClasses(["successMessage"]);
    setSelfDestruct();
  };

  const [sourceDetails, getSourceDetails] = useRequest(name => ({
    url: "/cgi-bin/Calibrators/new/sourcequery.pl?name=" + name,
    method: "GET"
  }));

  useEffect(() => {
    if (sourceDetails.hasPending) {
      setStatusMessage("Querying resolving service...");
    }
  }, [sourceDetails.hasPending]);

  const sourceResolver = function(e) {
    const { ready, cancel } = getSourceDetails(nameRef.current.value);
    ready()
      .then(d => {
        if (
          typeof d.position !== "undefined" &&
          typeof d.position.ra !== "undefined" &&
          d.position.ra !== ""
        ) {
          rightCoordinateRef.current.value = d.position.ra;
          leftCoordinateRef.current.value = d.position.dec;
          setSuccessMessage("Successfully resolved by " + d.resolver);
        } else {
          setErrorMessage("Unable to resolve source name.");
          console.log(d);
        }
      })
      .catch(err => {
        console.log(err);
      });
  };

  return (
    <div className="inSidebar">
      <table className="sourceAddTable">
        <tbody>
          <tr>
            <th>Name:</th>
            <td>
              <input
                type="text"
                ref={nameRef}
                onKeyPress={onEnter(sourceResolver)}
              />
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <button
                type="button"
                className="modalButton resolveButton actionButtons"
                onClick={sourceResolver}
              >
                Resolve Name
              </button>
            </td>
          </tr>
          <tr>
            {availableCoordinates.map((o, i) => {
              return (
                <td key={"coordinateTypeTD" + i}>
                  <label key={"coordinateTypeLabel" + i}>
                    <input
                      name="coordinateType"
                      type="radio"
                      value={o.label}
                      onChange={coordinateSelected}
                      checked={i === coordinateType}
                      key={"coordinateTypeInput" + i}
                    />
                    <span key={"coordinateTypeSpan" + i}>{o.label}</span>
                  </label>
                </td>
              );
            })}
          </tr>
          <tr>
            <th>
              <span>{coordinateRightLabel}</span>:
            </th>
            <td>
              <input
                type="text"
                ref={rightCoordinateRef}
                onChange={clearErrorMessage}
              />
            </td>
          </tr>
          <tr>
            <th>
              <span>{coordinateLeftLabel}</span>:
            </th>
            <td>
              <input type="text" ref={leftCoordinateRef} />
            </td>
          </tr>
          <tr>
            <th
              id="addSourceMessageArea"
              colSpan={2}
              className={errorClasses.join(" ")}
            >
              {errorMessage}
            </th>
          </tr>
          <tr>
            <td colSpan={2}>
              <button
                type="button"
                className="modalButton addNewSourceButton actionButtons"
                onClick={addSource}
              >
                Add Source
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const SourceManager = function(props) {
  const [sourceCoordinateType, setSourceCoordinateType] = useState(0);
  const [sourceCoordinateRightLabel, setSourceCoordinateRightLabel] = useState(
    availableCoordinates[sourceCoordinateType].rightLabel
  );
  const [sourceCoordinateLeftLabel, setSourceCoordinateLeftLabel] = useState(
    availableCoordinates[sourceCoordinateType].leftLabel
  );
  const [errorMessage, _setErrorMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [errorClasses, setErrorClasses] = useState(["hidden"]);
  const [sourceIndex, setSourceIndex] = useState(-1);
  const [colouredRow, setColouredRow] = useState(null);

  const rightCoordinateRef = useRef(null);
  const leftCoordinateRef = useRef(null);
  const nameRef = useRef(null);
  const coordinateSystemRef = useRef(null);

  const [msgTimer, setMsgTimer] = useState(null);
  const messageDisplayTimeSeconds = 10;

  const clearErrorMessage = function() {
    _setErrorMessage("");
    setMessageType("");
    setErrorClasses(["hidden"]);
    if (msgTimer !== null) {
      clearTimeout(msgTimer);
      setMsgTimer(null);
    }
  };

  const setSelfDestruct = function() {
    // Check for an already proceeding self-destruction.
    if (msgTimer !== null) {
      clearTimeout(msgTimer);
    }
    setMsgTimer(
      setTimeout(clearErrorMessage, messageDisplayTimeSeconds * 1000)
    );
  };

  const setErrorMessage = function(msg) {
    // Called when the message to show is an error.
    _setErrorMessage(msg);
    setMessageType("error");
    setErrorClasses(["errorMessage"]);
    setSelfDestruct();
  };

  const setStatusMessage = function(msg) {
    // Called when the message to show is just a status update.
    _setErrorMessage(msg);
    setMessageType("status");
    setErrorClasses(["statusMessage"]);
  };

  const setSuccessMessage = function(msg) {
    // Called when the message to show is a success message.
    _setErrorMessage(msg);
    setMessageType("success");
    setErrorClasses(["successMessage"]);
    setSelfDestruct();
  };

  const hideSource = function(e) {
    var rsources = [...props.sources];
    for (var i = 0; i < rsources.length; i++) {
      if (rsources[i].name === e.target.value) {
        rsources[i].hidden = !props.sources[i].hidden;
      }
    }
    props.setSources(rsources);
  };

  const rowClicked = function(e) {
    var srcIndex = -1;
    var tnode = e.target;
    const maxHops = 3;
    var nhops = 0;
    while (tnode.tagName !== "TR" && nhops <= maxHops) {
      tnode = tnode.parentNode;
      nhops++;
    }
    if (tnode.tagName === "TR") {
      srcIndex = parseInt(tnode.id.replace("row_", ""), 10);
    } else {
      tnode = null;
    }
    if (srcIndex >= 0) {
      setSourceIndex(srcIndex);
    }
    // Colour the selected source row, but remove the colouring
    // from any previous row first.
    if (tnode !== null) {
      if (colouredRow !== null) {
        colouredRow.classList.remove("sourceManageSelected");
      }
      tnode.classList.add("sourceManageSelected");
      setColouredRow(tnode);
    }
  };

  useEffect(() => {
    if (sourceIndex >= 0 && sourceIndex < props.sources.length) {
      var sref = props.sources[sourceIndex];
      setSourceCoordinateType(sref.specification.type);
      if (nameRef.current !== null) {
        nameRef.current.value = sref.name;
        rightCoordinateRef.current.value = sref.specification.right;
        leftCoordinateRef.current.value = sref.specification.left;
      }
    }
  }, [sourceIndex, props.sources]);

  useEffect(() => {
    setSourceCoordinateRightLabel(
      availableCoordinates[sourceCoordinateType].rightLabel
    );
    setSourceCoordinateLeftLabel(
      availableCoordinates[sourceCoordinateType].leftLabel
    );
  }, [sourceCoordinateType]);

  const updateSource = function(e) {
    // Get the coordinate attributes.
    var name = nameRef.current.value;
    var rightCoord = rightCoordinateRef.current.value;
    var leftCoord = leftCoordinateRef.current.value;

    // Try to interpret the right and left coordinates.
    var rightValue = parseCoordinate(
      rightCoord,
      availableCoordinates[sourceCoordinateType].rightMetadata
    );
    if (rightValue === null) {
      // No good, we give the user an error.
      setErrorMessage(
        "Can't interpret " +
          availableCoordinates[sourceCoordinateType].rightLabel
      );
      return;
    }
    var leftValue = parseCoordinate(
      leftCoord,
      availableCoordinates[sourceCoordinateType].leftMetadata
    );
    if (leftValue === null) {
      setErrorMessage(
        "Can't interpret " +
          availableCoordinates[sourceCoordinateType].leftLabel
      );
      return;
    }
    // Check that we aren't about to duplicate a source name.
    for (var i = 0; i < props.sources.length; i++) {
      if (i !== sourceIndex && props.sources[i].name === name) {
        setErrorMessage("Source with that name already exists!");
        return;
      }
    }
    // We have enough information.
    clearErrorMessage();

    // The source values have to be in right ascension and
    // declination J2000. Check if we need to do a conversion.
    if (availableCoordinates[sourceCoordinateType].label !== "RA/Dec J2000") {
      [rightValue, leftValue] = availableCoordinates[
        sourceCoordinateType
      ].converter(rightValue, leftValue);
    }

    var updatedSource = {
      name: name,
      specification: {
        right: rightCoord,
        left: leftCoord,
        type: sourceCoordinateType
      },
      rightAscension: rightValue,
      declination: leftValue,
      hidden: props.sources[sourceIndex].hidden
    };
    var usrc = [...props.sources];
    usrc[sourceIndex] = updatedSource;
    props.setSources(usrc);
    setSuccessMessage("Source " + name + " updated.");
  };

  const deleteSource = function(e) {
    var btn = e.target;
    var srcIndex = parseInt(btn.id.replace("delete_", ""), 10);
    var usrcList = [...props.sources];
    usrcList.splice(srcIndex, 1);
    props.setSources(usrcList);
  };

  return (
    <div className="inSidebar">
      <table className="sourceManageTable">
        <tbody>
          <tr>
            <th>Name</th>
            <th>{sourceCoordinateRightLabel}</th>
            <th>{sourceCoordinateLeftLabel}</th>
          </tr>
          <tr>
            <td>
              <input type="text" ref={nameRef} />
            </td>
            <td>
              <input type="text" ref={rightCoordinateRef} />
            </td>
            <td>
              <input type="text" ref={leftCoordinateRef} />
            </td>
          </tr>
          <tr>
            <td colSpan={3}>
              <button
                type="button"
                onClick={updateSource}
                className="modalButton actionButtons"
              >
                Update Source
              </button>
            </td>
          </tr>
          <tr>
            <th
              id="manageSourceMessageArea"
              colSpan={3}
              className={errorClasses.join(" ")}
            >
              {errorMessage}
            </th>
          </tr>
        </tbody>
      </table>
      <table className="sourceLister">
        <thead>
          <tr>
            <th>Show</th>
            <th>Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {props.sources.map((s, i) => (
            <tr id={"row_" + i} key={"sourceListRow" + i} onClick={rowClicked}>
              <td>
                <label>
                  <input
                    type="checkbox"
                    onChange={hideSource}
                    key={"hide_" + i}
                    value={s.name}
                    checked={!s.hidden}
                  />
                  <span>&nbsp;</span>
                </label>
              </td>
              <td className="clickme">{s.name}</td>
              <td>
                <button
                  className="actionButtons"
                  type="button"
                  id={"delete_" + i}
                  onClick={deleteSource}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export { calculateSourceDetails, SourceAdder, SourceManager };
