import winston from "winston";

export const logger = winston.createLogger({
  level: "info",

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),

  defaultMeta: {
    service: "ats-backend",
  },

  transports: [
    // Console logs (this is what hosting platforms capture)
    new winston.transports.Console(),
  ],
});