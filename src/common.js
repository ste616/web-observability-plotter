// Some general use routines.
// Change degrees to radians.
const deg2rad = function(d) {
  return (d * Math.PI) / 180;
};
// Change hours to radians.
const hour2rad = function(h) {
  return (h * Math.PI) / 12;
};
// Change radians to degrees.
const rad2deg = function(r) {
  return (r * 180) / Math.PI;
};
// Given any number n, put it between 0 and some other number b.
const numberBounds = function(n, b) {
  while (n > b) {
    n -= b;
  }
  while (n < 0) {
    n += b;
  }
  return n;
};
// Specific version of number bounds, where b = 1.
const turnFraction = function(f) {
  return numberBounds(f, 1);
};
// Specific version of number bounds, for degrees, b = 360.
const degreesBounds = function(d) {
  return numberBounds(d, 360);
};
// Specific version of number bounds, for hours, b = 24.
const hoursBounds = function(h) {
  return numberBounds(h, 24);
};
// Specific version of number bounds, for declinations.
const declinationBounds = function(d) {
  var v = numberBounds(d, 180);
  if (v > 90) {
    v -= 180;
  }
  return v;
};

const onEnter = function(callback) {
  return function(e) {
    if (e.key === "Enter") {
      callback(e);
    }
  };
};

// Convert a decimal number into HH:MM.
const floatToHourLabel = function(d) {
  // Make sure the number is in bounds.
  d = hoursBounds(d);
  const h = Math.floor(d);
  d -= h;
  const m = Math.floor(d * 60);
  const hstring =
    (h < 10 ? "0" + h : "" + h) + ":" + (m < 10 ? "0" + m : "" + m);
  return hstring;
};

const floorz = function(n) {
  // This function returns the floor of a number, always
  // resulting in a number closer to 0, regardless of sign.
  var s = n < 0;
  if (s) {
    n *= -1;
  }
  var r = Math.floor(n);
  if (s) {
    r *= -1;
  }
  return r;
};

const decimalToSexagesimal = function(d, showSeconds, isHours) {
  // Make sure the number is in bounds.
  if (isHours) {
    d = hoursBounds(d);
  } else {
    d = degreesBounds(d);
  }
  const p1 = Math.floor(d);
  d -= h;
  const p2 = Math.floor(d * 60);
  d -= p2 / 60;
  const p3 = Math.floor(d * 3600);
  var hstring =
    (p1 < 10 ? "0" + p1 : "" + p1) + ":" + (p2 < 10 ? "0" + p2 : "" + p2);
  if (showSeconds) {
    hstring += p3 < 10 ? "0" + p3 : "" + p3;
  }
  return hstring;
};

export {
  deg2rad,
  hour2rad,
  rad2deg,
  numberBounds,
  turnFraction,
  degreesBounds,
  hoursBounds,
  declinationBounds,
  onEnter,
  floatToHourLabel,
  floorz,
  decimalToSexagesimal
};
