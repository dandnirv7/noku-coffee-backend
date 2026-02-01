import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { Prisma } from 'generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message.replace(/\n/g, '');

    let status: HttpStatus;
    let errorMessage: string;

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        errorMessage = `Data sudah ada: ${this.extractTarget(exception)}`;
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        errorMessage = 'Data tidak ditemukan';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        errorMessage = 'Data relasi tidak valid atau masih digunakan';
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Terjadi kesalahan pada server database';
        break;
    }

    response.status(status).json({
      statusCode: status,
      message: errorMessage,
      error: exception.code,
      timestamp: new Date().toISOString(),
    });
  }
  private extractTarget(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    const target = (exception.meta?.target as string[]) || [];
    return target.join(', ');
  }
}
