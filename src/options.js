import React, { useRef, useEffect, createRef } from "react";
import LocationDatabase from "./observatories";

const AppOptions = function(props) {
  var locationKeys = Object.keys(LocationDatabase).sort((a, b) => {
    return LocationDatabase[a].name.localeCompare(
      LocationDatabase[b].name,
      "en",
      { sensitivity: "base" }
    );
  });

  const locationChanged = function(e) {
    props.setLocation(e.target.value);
  };

  const twilightInput = useRef(null);
  const elevRefs = useRef(props.elevationDisplays.map(() => createRef()));

  useEffect(() => {
    twilightInput.current.value = props.twilightElevation;
  }, [props.twilightElevation]);
  useEffect(() => {
    props.elevationDisplays.forEach((e, i) => {
      elevRefs.current[i].current.value = e.elevation;
    });
  }, [props.elevationDisplays]);

  const twilightPress = function(e) {
    var ie = parseFloat(e.target.value);
    var changed = ie !== props.twilightElevation;
    if (e.key === "Enter") {
      props.setTwilightElevation(ie);
      changed = false;
    }
    if (changed) {
      e.target.classList.add("changedInput");
    } else {
      e.target.classList.remove("changedInput");
    }
  };

  const hideElevation = function(e) {
    var elIndex = e.target.value;
    var nEls = [...props.elevationDisplays];
    nEls[elIndex].display = !nEls[elIndex].display;
    props.setElevationDisplays(nEls);
  };

  const elPress = function(e) {
    var ie = parseFloat(e.target.value);
    var elIndex = parseInt(e.target.id.replace("elLimit_", ""), 10);
    var changed = ie !== props.elevationDisplays[elIndex].elevation;
    if (e.key === "Enter") {
      var nEls = [...props.elevationDisplays];
      nEls[elIndex].elevation = ie;
      props.setElevationDisplays(nEls);
      changed = false;
    }
    if (changed) {
      e.target.classList.add("changedInput");
    } else {
      e.target.classList.remove("changedInput");
    }
  };

  return (
    <div className="inSidebar">
      <table className="optionsTable">
        <tbody>
          <tr>
            <th>Location:</th>
            <td colSpan={2}>
              <select value={props.location} onChange={locationChanged}>
                {locationKeys.map(k => (
                  <option value={k} key={"locationKey" + k}>
                    {LocationDatabase[k].name}
                  </option>
                ))}
              </select>
            </td>
          </tr>
          <tr>
            <th>Twilight Elevation:</th>
            <td>
              <input
                type="text"
                onKeyPress={twilightPress}
                ref={twilightInput}
              />
            </td>
            <td>degrees</td>
          </tr>
          <tr>
            <th colSpan={3}>Elevation Indicators</th>
          </tr>
          <tr>
            <th>Display</th>
            <th>Colour</th>
            <th>Elevation (deg)</th>
          </tr>
          {props.elevationDisplays.map((e, i) => (
            <tr key={"elevationDisplaysRow" + i}>
              <td>
                <label>
                  <input
                    type="checkbox"
                    onChange={hideElevation}
                    key={"elHide" + i}
                    value={i}
                    checked={e.display}
                  />
                  <span>&nbsp;</span>
                </label>
              </td>
              <td style={{ backgroundColor: e.color }}>&nbsp;</td>
              <td>
                <input
                  type="text"
                  id={"elLimit_" + i}
                  ref={elevRefs.current[i]}
                  onKeyPress={elPress}
                  disabled={!e.changeable}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export { AppOptions };
