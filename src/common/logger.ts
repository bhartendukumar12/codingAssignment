import { Logger } from '@nestjs/common';

export class LoggerHelper {
  private static readonly logger = new Logger('App');

  static error(message: string, error?: unknown, context?: string) {
     if (message === undefined) return;
    this.logger.error(
      message,
      error instanceof Error ? error.stack : JSON.stringify(error),
      context,
    );
  }

  static log(message: string, context?: string) {
     if (message === undefined) return;
    message && this.logger.log(message, context);
  }

  static warn(message: string, context?: string) {
     if (message === undefined) return;
    this.logger.warn(message, context);
  }
}
