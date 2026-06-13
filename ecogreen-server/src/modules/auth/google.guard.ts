import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    const hasCredentials =
      process.env.GOOGLE_CLIENT_ID &&
      !process.env.GOOGLE_CLIENT_ID.includes('your_google_client_id');

    if (!hasCredentials) {
      throw new ServiceUnavailableException(
        'Google OAuth is not configured on this server.',
      );
    }

    return super.canActivate(context);
  }
}
