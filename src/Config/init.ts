export const init = async () => {
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || "trace";
};

export default init;
