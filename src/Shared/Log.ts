import Pino from "pino";

export const log = Pino({
  name: "Shakespeare",
  serializers: Pino.stdSerializers,
  level: process.env.LOG_LEVEL || "error",
});

export default log;
