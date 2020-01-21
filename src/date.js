import React, { useState, Fragment } from "react";
import { Modal, Button } from "react-bootstrap";
import Calendar from "react-calendar";
import {
  turnFraction,
  degreesBounds,
  deg2rad,
  hoursBounds,
  rad2deg
} from "./common";

const dateDetails = function(state, action) {
  // This class calculates pertinent details about the date
  // it is given, using the location supplied.

  // Routine to compute MJD from the current date.
  const dateToMJD = function(d) {
    var utc = d.getUTCDate();
    var mm = d.getUTCMonth() + 1;
    var m = mm;
    var y = d.getUTCFullYear();
    if (mm <= 2) {
      m = mm + 12;
      y = d.getUTCFullYear() - 1;
    }
    var A = Math.floor(y / 100);
    var B = 2 - A + Math.floor(A / 4);
    var C = Math.floor(365.25 * y);
    var D = Math.floor(30.6001 * (m + 1));
    var mjd = B + C + D + utc + 1720994.5 - 2400000.5;
    return mjd;
  };

  // Routine to compute sidereal time at Greenwich,
  // given an MJD.
  const MJDToGST = function(mjd, dUT1) {
    var a = 101.0 + 24110.54581 / 86400.0;
    var b = 8640184.812886 / 86400.0;
    var e = 0.093104 / 86400.0;
    var d = 0.0000062 / 86400.0;
    var tu = (mjd - (2451545.0 - 2400000.5)) / 36525.0;
    var sidtim = turnFraction(a + tu * (b + tu * (e - tu * d)));
    var gmst = turnFraction(
      sidtim + (mjd - Math.floor(mjd) + dUT1 / 86400.0) * 1.002737909350795
    );
    return gmst;
  };

  // Routine to calculate the sidereal time at a particular
  // longitude and MJD.
  const MJDToLST = function(mjd, longitude, dUT1) {
    var lst = turnFraction(MJDToGST(mjd, dUT1) + longitude);
    return lst;
  };

  // Routine to calculate the RA & Dec of the Sun at a particular
  // MJD.
  const sunPosition = function(mjd) {
    // We actually need the full Julian date.
    var jd = mjd + 2400000.5;
    // How many days since 0 UTC Jan 1 2000?
    var n = jd - 2451545.0;
    // Longitude of the Sun, in degrees.
    var L = 280.46 + 0.9856474 * n;
    // Mean anomaly of the Sun, in degrees.
    var g = 357.528 + 0.9856003 * n;
    // Ensure bound limits for these numbers.
    L = degreesBounds(L);
    g = degreesBounds(g);
    // Ecliptic longitude of the Sun, in degrees.
    var lambda =
      L + 1.915 * Math.sin(deg2rad(g)) + 0.02 * Math.sin(2 * deg2rad(g));
    // Sun distance from Earth.
    var R =
      1.00014 -
      0.01671 * Math.cos(deg2rad(g)) -
      0.00014 * Math.cos(2 * deg2rad(g));
    // The obliquity, in degrees.
    // We need the number of centuries since J2000.0.
    var T = n / (100 * 365.2525);
    var epsilon =
      23.4392911 -
      (46.636769 / 3600.0) * T -
      (0.0001831 / 3600.0) * T * T +
      (0.0020034 / 3600.0) * T * T * T;
    // Get the right ascension in radians.
    var alpha = Math.atan2(
      Math.cos(deg2rad(epsilon)) * Math.sin(deg2rad(lambda)),
      Math.cos(deg2rad(lambda))
    );
    // And declination, in radians.
    var delta = Math.asin(
      Math.sin(deg2rad(epsilon)) * Math.sin(deg2rad(lambda))
    );
    return [hoursBounds(rad2deg(alpha) / 15), rad2deg(delta)];
  };

  const mjd = dateToMJD(action.date);
  const lstAtZero = MJDToLST(mjd, action.location.longitude / 360, 0);
  const solarPosition = sunPosition(mjd);

  return {
    mjd: mjd,
    zeroLST: lstAtZero,
    solarPosition: solarPosition
  };
};

// This routine takes a Javascript date and formats it the way
// we like.
const formatDate = function(date) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();
  return day + " " + monthNames[monthIndex] + " " + year;
};

const DatePicker = function(props) {
  const [labelSize, setLabelSize] = useState(30);
  const [calendarSize, setCalendarSize] = useState(30);
  const [showModal, setShowModal] = useState(false);

  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  const date1 = function(e) {
    var n = e.currentTarget.id === "decrementDate" ? -1 : 1;
    var d = new Date(props.date);
    d.setDate(d.getDate() + n);
    props.changeDate(d);
  };

  return (
    <Fragment>
      <div>
        <Button id="decrementDate" onClick={date1} variant="outline-dark">
          <span style={{ fontSize: labelSize + "px" }}>&#x2BC7;</span>
        </Button>
        <Button onClick={handleShow} variant="outline-dark">
          <img
            className="dateIcon"
            src="https://astrowebservices.com/images/fntapro/calendar-alt.svg"
            width={calendarSize}
            height={calendarSize}
            alt="Calendar Icon"
          />
          <span className="selectedDate" style={{ fontSize: labelSize + "px" }}>
            {formatDate(props.date)}
          </span>
        </Button>
        <Button id="incrementDate" onClick={date1} variant="outline-dark">
          <span style={{ fontSize: labelSize + "px" }}>&#x2BC8;</span>
        </Button>
      </div>
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Choose Date</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Calendar onChange={e => props.changeDate(e)} value={props.date} />
        </Modal.Body>
      </Modal>
    </Fragment>
  );
};

export { dateDetails, formatDate, DatePicker };
