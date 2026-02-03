// .opencode/plugins/compaction/index.js
module.exports = {
  name: "session-compaction",
  onBeforeModelCall: ({ session }) => {
    // Trim oldest assistant/user messages to keep session compact
    if (Array.isArray(session.messages) && session.messages.length > 300) {
      session.messages.splice(0, session.messages.length - 300);
    }
  }
};
