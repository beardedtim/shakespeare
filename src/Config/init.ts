const hardcodes = {
  LOG_LEVEL: "trace",
  SENDER_NAME: "testing-foobar",
  RECEIVER_NAME: "testing-foobar",
  SENDER_ADDRESS: "sender-address",
  RECEIVER_ADDRESS: "receiver-address",
};

export const init = async () => {
  for (const [key, value] of Object.entries(hardcodes)) {
    process.env[key] = process.env[key] || value;
  }
};

export default init;
