import { getEnvironment, Environment } from "src/utils/environment";
import { colors } from "src/utils/logger/colors";
import { DEFAULT_LOG_LEVELS } from "src/utils/logger/config";
import { LogLevel } from "src/utils/logger/types";


/**
 * @category Utility
 */
export class Logger {
    private static _logLevel: LogLevel;

    static {
        try {
            const environment = getEnvironment();
            Logger._logLevel = DEFAULT_LOG_LEVELS[environment];
        } catch (error) {
            // If environment detection fails, default to most restrictive level
            Logger._logLevel = LogLevel.ERROR;
            console.warn('Failed to detect environment, defaulting to ERROR log level');
        }
    }

    static get logLevel(): LogLevel {
        return Logger._logLevel;
    }

    static set logLevel(level: LogLevel) {
        Logger._logLevel = level;
    }
    static logLevelColors = {
        [LogLevel.NONE]: colors.reset,
        [LogLevel.ERROR]: colors.fg.red,
        [LogLevel.WARN]: colors.fg.yellow,
        [LogLevel.INFO]: colors.fg.blue,
        [LogLevel.DEBUG]: colors.fg.green,
    };

    private static formatMessages(...messages: any[]): string {
        return messages.map(message => {
            if (typeof message === 'string') {
                return message;
            }
            try {
                return JSON.stringify(message, null, 2);
            } catch (error) {
                return String(message);
            }
        }).join(' ');
    }

    private static shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.NONE, LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        // For NONE, don't log anything
        if (this.logLevel === LogLevel.NONE) return false;
        // Otherwise, only log if message level is less severe or equal to current level
        return messageLevelIndex <= currentLevelIndex;
    }

    static log(level: LogLevel, ...messages: any[]) {
        if (!this.shouldLog(level)) {
            return;
        }

        const formattedMessage = this.formatMessages(...messages);
        const color = this.logLevelColors[level] || colors.reset;
        const timestamp = new Date().toISOString();
        const fileLink = this.getFileLink();

        if (getEnvironment() === Environment.BROWSER) {
            // Browser context
            console.log(`%c[${timestamp}] [${level.toUpperCase()}] ${formattedMessage} %c${fileLink}`, `color: ${color}`, "color: gray");
        } else {
            // Node context
            console.log(`${color}[${timestamp}] [${level.toUpperCase()}] ${formattedMessage} ${fileLink}${colors.reset}`);
        }
    }

    static info(...messages: any[]) {
        this.log(LogLevel.INFO, ...messages);
    }

    static warn(...messages: any[]) {
        this.log(LogLevel.WARN, ...messages);
    }

    static error(...messages: any[]) {
        this.log(LogLevel.ERROR, ...messages);
    }

    static debug(...messages: any[]) {
        this.log(LogLevel.DEBUG, ...messages);
    }

    static setLogLevel(newLoglevel: LogLevel) {
        Logger._logLevel = newLoglevel;
        // Don't use info() here as it might be filtered out based on the new level
        Logger.log(LogLevel.INFO, `Log level set to ${newLoglevel}`);
    }

    private static getFileLink(): string {
        try {
            // Throwing an error to get the stack trace
            const err = new Error();
            const stack = err.stack || "";

            // Find the correct stack line, skipping lines related to the logger itself
            const stackLines = stack.split("\n");
            for (let i = 1; i < stackLines.length; i++) {
                const line = stackLines[i];
                if (!line.includes("Logger.") && !line.includes("getFileLink")) {
                    const fileMatch = line.match(/\((.*?):(\d+):(\d+)\)/);
                    if (fileMatch) {
                        const [, file, line, column] = fileMatch;
                        if (file.includes("logger.ts")) {
                            continue
                        }
                        return `at ${file}:${line}:${column}`;
                    }
                }
            }
        } catch (e) {
            // If anything fails, return an empty string
        }
        return "";
    }
}
