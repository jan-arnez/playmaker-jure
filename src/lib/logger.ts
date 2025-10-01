type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isProduction = process.env.NODE_ENV === "production";

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    // Console logging for development
    if (this.isDevelopment) {
      const consoleMethod = level === "debug" ? "log" : level;
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, context);
    }

    // Send to monitoring service in production
    if (this.isProduction) {
      this.sendToMonitoring(entry);
    }
  }

  private async sendToMonitoring(entry: LogEntry) {
    try {
      // In production, you would send this to your monitoring service
      // Example: Sentry.addBreadcrumb(entry)
      // Or send to your own logging endpoint

      // For now, we'll just store in localStorage for demo purposes
      const logs = JSON.parse(localStorage.getItem("app_logs") || "[]");
      logs.push(entry);

      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      localStorage.setItem("app_logs", JSON.stringify(logs));
    } catch (error) {
      console.error("Failed to send log to monitoring:", error);
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log("error", message, context);
  }

  // API request logging
  logApiRequest(method: string, url: string, status: number, duration: number) {
    this.info("API Request", {
      method,
      url,
      status,
      duration: `${duration}ms`,
    });
  }

  // User action logging
  logUserAction(action: string, context?: Record<string, unknown>) {
    this.info("User Action", {
      action,
      ...context,
    });
  }

  // Error logging with stack trace
  logError(error: Error, context?: Record<string, unknown>) {
    this.error(error.message, {
      stack: error.stack,
      ...context,
    });
  }

  // Get logs for debugging (development only)
  getLogs(): LogEntry[] {
    if (!this.isDevelopment) {
      return [];
    }

    try {
      return JSON.parse(localStorage.getItem("app_logs") || "[]");
    } catch {
      return [];
    }
  }

  // Clear logs
  clearLogs() {
    localStorage.removeItem("app_logs");
  }
}

export const logger = new Logger();
