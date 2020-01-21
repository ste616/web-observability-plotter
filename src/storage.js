import React, { useState, useEffect } from "react";

// Hook to allow easy use of localStorage.
const useStateWithLocalStorage = function(localStorageKey, def) {
  if (typeof def === "undefined") {
    def = [];
  }

  // We try to parse the local storage and reset it if we can't.
  var initVal = null;
  try {
    initVal = JSON.parse(localStorage.getItem(localStorageKey));
  } catch (err) {
    initVal = def;
  }

  if (initVal === null) {
    initVal = def;
  }

  const [value, setValue] = useState(initVal);

  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(value));
  }, [value, localStorageKey]);

  return [value, setValue];
};

export { useStateWithLocalStorage };
