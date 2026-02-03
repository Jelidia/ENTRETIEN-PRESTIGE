// .opencode/plugins/env-protect/index.js
module.exports = {
  name: "env-protect",
  onBeforeResponse: ({ response }) => {
    if (typeof response === "string") {
      return response.replace(/[A-Z_]+=[^\s'"]+/g, "[REDACTED_ENV]");
    }
    return response;
  }
};
