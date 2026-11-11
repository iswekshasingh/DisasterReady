mergeInto(LibraryManager.library, {
  NotifyAttemptSubmittedToWeb: function (jsonStrPtr) {
    var jsonStr = UTF8ToString(jsonStrPtr);
    try {
      var data = JSON.parse(jsonStr);
      window.dispatchEvent(new CustomEvent('unity:attemptSubmitted', { detail: data }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent('unity:attemptSubmitted', { detail: jsonStr }));
    }
  }
});

