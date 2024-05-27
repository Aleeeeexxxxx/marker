import * as vscode from "vscode";

export enum LogLevel {
    ERROR,
    WARNING,
    INFO,
    DEBUG,
}

export const extensionOutputChannel =
    vscode.window.createOutputChannel("Easy Marker");

class Logger {
    private logLevel: LogLevel = LogLevel.INFO;

    setLogLevel(lvl: LogLevel) {
        this.logLevel = lvl;
    }

    debug(msg: string) {
        if (this.logLevel >= LogLevel.DEBUG) {
            this.print("DEBUG", msg);
        }
    }

    info(msg: string) {
        if (this.logLevel >= LogLevel.INFO) {
            this.print("INFO", msg);
        }
    }

    warn(msg: string) {
        if (this.logLevel >= LogLevel.WARNING) {
            this.print("WARN", msg);
        }
    }

    error(msg: string | Error) {
        if (this.logLevel >= LogLevel.ERROR) {
            let err;
            if (msg instanceof Error) {
                err = msg;
            } else {
                err = new Error(msg);
                Error.captureStackTrace(err, this.error);
            }

            this.print("ERROR", `${err.message} \r\n${err.stack}`);
        }
    }

    private print(level: string, msg: string) {
        level = `${level.toUpperCase()}`;
        if (level === "INFO" || level === "WARN") {
            level += " ";
        }
        msg = `[${level} - ${formatTime(new Date())}] ${msg}`;

        if (level === "ERROR") {
            msg = `\x1b[31m${msg}\x1b[0m`;
        }

        extensionOutputChannel.appendLine(msg);
    }
}

function formatTime(date: Date): string {
    const hour = date.getHours();
    const minute = padZero(date.getMinutes());
    const second = padZero(date.getSeconds());
    const period = hour < 12 ? "AM" : "PM";
    const formattedHour = hour % 12 || 12;

    return `${formattedHour}:${minute}:${second} ${period}`;
}

function padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
}

export const logger = new Logger();
