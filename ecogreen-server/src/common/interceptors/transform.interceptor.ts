import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((res) => {
        const statusCode = context.switchToHttp().getResponse().statusCode;

        if (
          res &&
          typeof res === 'object' &&
          res.hasOwnProperty('message') &&
          res.hasOwnProperty('data')
        ) {
          return {
            statusCode,
            message: res.message,
            data: res.data,
          };
        }

        if (res && typeof res === 'object' && res.hasOwnProperty('message')) {
          const keys = Object.keys(res).filter((k) => k !== 'message');
          if (keys.length === 1) {
            return {
              statusCode,
              message: res.message,
              data: res[keys[0]],
            };
          }
        }

        return {
          statusCode,
          message: 'Success',
          data: res,
        };
      }),
    );
  }
}
