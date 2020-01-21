import {
  degreesBounds,
  hoursBounds,
  deg2rad,
  rad2deg,
  hour2rad,
  declinationBounds
} from "./common";

const angularUnits = {
  DEGREES: "degrees",
  HOURS: "hours",
  RADIANS: "radians"
};

const convertAngles = function(v, u, o) {
  // Convert v from unit u to unit o.
  if (u === angularUnits.HOURS && o === angularUnits.DEGREES) {
    return degreesBounds(v * 15);
  }
  if (u === angularUnits.DEGREES && o === angularUnits.HOURS) {
    return hoursBounds(v / 15);
  }
  if (u === angularUnits.DEGREES && o === angularUnits.RADIANS) {
    return deg2rad(v);
  }
  if (u === angularUnits.HOURS && o === angularUnits.RADIANS) {
    return deg2rad(degreesBounds(v * 15));
  }
  if (u === angularUnits.RADIANS && o === angularUnits.DEGREES) {
    return degreesBounds(rad2deg(v));
  }
  if (u === angularUnits.RADIANS && o === angularUnits.HOURS) {
    return hoursBounds(rad2deg(v) / 15);
  }
  return v;
};

const parseDecimal = function(s, u, o, b) {
  // We try to interpret a string as a decimal number with optional
  // units.
  var v = parseFloat(s);
  // Did that work?
  if (isNaN(v)) {
    // No it did not.
    return null;
  }
  var r = {
    value: v,
    // The user should have sent along default units.
    inputUnits: u,
    outputUnits: o
  };
  // Check for some unit strings.
  if (s.search("d") > 0) {
    r.inputUnits = angularUnits.DEGREES;
  } else if (s.search("h") > 0) {
    r.inputUnits = angularUnits.HOURS;
  }

  // Check for bounds violations of hours.
  if (r.inputUnits === angularUnits.HOURS && (r.value > 24 || r.value < 0)) {
    r.inputUnits = angularUnits.DEGREES;
  }

  // Convert to the correct units.
  r.value = convertAngles(r.value, r.inputUnits, r.outputUnits);

  // Check for bounds violations in type of argument.
  if (r.value < b[0] || r.value > b[1]) {
    return null;
  }
  return r.value;
};

const parseSexagesimal = function(s) {
  // We try to intrepret a string s as a sexagesimal coordinate.
  // We do that by trying to split the string and see if it has
  // 3 elements.
  var els = s.split(/[:\s]+/);
  if (els.length === 3) {
    // We have a sexagesimal string.
    var v = parseFloat(els[0]);
    // Check if it is negative.
    var isNeg = s.charAt(0) === "-";
    if (isNeg) {
      v *= -1;
    }
    v += (parseFloat(els[1]) + parseFloat(els[2]) / 60) / 60;
    if (isNeg) {
      v *= -1;
    }
    return v;
  } else {
    // Not a sexagesimal string.
    return null;
  }
};

const parseCoordinate = function(s, m) {
  // Try to parse a coordinate in string s, using the parameters in m.
  // Try to interpret the coordinate as sexagesimal first.
  var v = parseSexagesimal(s);
  if (v === null) {
    // Try now to parse it as a decimal number with optional units.
    v = parseDecimal(s, m.units, m.units, m.bounds);
  }
  return v;
};

const galacticToJ2000 = function(l, b) {
  // Convert Galactic coordinates to RA/Dec J2000.
  // We need to coordinates in radians.
  l = convertAngles(
    l,
    availableCoordinates[coordinates.Galactic].rightMetadata.units,
    angularUnits.RADIANS
  );
  b = convertAngles(
    b,
    availableCoordinates[coordinates.Galactic].leftMetadata.units,
    angularUnits.RADIANS
  );

  // The North Galactic pole position in J2000.
  const pole_ra = deg2rad(192.859508);
  const pole_dec = deg2rad(27.128336);
  const posangle = deg2rad(122.932 - 90);

  var ra =
    Math.atan2(
      Math.cos(b) * Math.cos(l - posangle),
      Math.sin(b) * Math.cos(pole_dec) -
        Math.cos(b) * Math.sin(pole_dec) * Math.sin(l - posangle)
    ) + pole_ra;
  var dec = Math.asin(
    Math.cos(b) * Math.cos(pole_dec) * Math.sin(l - posangle) +
      Math.sin(b) * Math.sin(pole_dec)
  );

  return [
    convertAngles(
      ra,
      angularUnits.RADIANS,
      availableCoordinates[coordinates.J2000].rightMetadata.units
    ),
    declinationBounds(
      convertAngles(
        dec,
        angularUnits.RADIANS,
        availableCoordinates[coordinates.J2000].leftMetadata.units
      )
    )
  ];
};

const availableCoordinates = [
  {
    label: "RA/Dec J2000",
    rightLabel: "Right Ascension",
    rightMetadata: {
      bounds: [0, 24],
      units: angularUnits.HOURS
    },
    leftLabel: "Declination",
    leftMetadata: {
      bounds: [-90, 90],
      units: angularUnits.DEGREES
    },
    converter: null
  },
  {
    label: "Galactic",
    rightLabel: "Longitude",
    rightMetadata: {
      bounds: [0, 360],
      units: angularUnits.DEGREES
    },
    leftLabel: "Latitude",
    leftMetadata: {
      bounds: [-90, 90],
      units: angularUnits.DEGREES
    },
    converter: galacticToJ2000
  }
];
// A list of the order of the coordinate systems.
const coordinates = {
  J2000: 0,
  Galactic: 1
};

// Determine the LST limits for a source at an observatory.
// Given a declination dec in degrees, an observatory latitude lat
// in degrees, and an elevation el in degrees as the rise/set limit,
// work out the hour angle (in degrees) at which it would rise/set.
const HASetAzEl = function(dec, lat, el) {
  var decRad = deg2rad(dec);
  var latRad = deg2rad(lat);
  var elRad = deg2rad(el);
  var cos_haset =
    (Math.cos(Math.PI / 2 - elRad) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(decRad) * Math.cos(latRad));
  if (cos_haset < -1) {
    // The source never sets.
    return 180;
  }
  // Return the hour angle in degrees.
  return rad2deg(Math.acos(cos_haset));
};

// Determine the elevation of a source at an observatory at
// some specific hour angle.
// Supply coordinates in the following units:
// hourAngle: hours
// declination: degrees
// latitude: degrees
// Returns az and el both in degrees.
const eqAzEl = function(hourAngle, declination, latitude) {
  var sphi = Math.sin(deg2rad(latitude));
  var cphi = Math.cos(deg2rad(latitude));
  var sleft = Math.sin(hour2rad(hourAngle));
  var cleft = Math.cos(hour2rad(hourAngle));
  var sright = Math.sin(deg2rad(declination));
  var cright = Math.cos(deg2rad(declination));
  var left_out = Math.atan2(-sleft, -cleft * sphi + (sright * cphi) / cright);
  // Keep the azimuth as a positive number.
  left_out = left_out < 0 ? left_out + Math.PI * 2 : left_out;
  var right_out = Math.asin(cleft * cright * cphi + sright * sphi);

  return [rad2deg(left_out), rad2deg(right_out)];
};

export {
  angularUnits,
  convertAngles,
  availableCoordinates,
  parseDecimal,
  parseSexagesimal,
  parseCoordinate,
  HASetAzEl,
  eqAzEl
};
