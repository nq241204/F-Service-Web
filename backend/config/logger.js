// Logger configuration
const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  log: (message, ...args) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
  
  error: (message, ...args) => {
    if (isDevelopment) {
      console.error(message, ...args);
    }
  },
  
  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },
  
  info: (message, ...args) => {
    if (isDevelopment) {
      console.info(message, ...args);
    }
  }
};

module.exports = logger;
