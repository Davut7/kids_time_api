import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { UserEntity } from '../user/entities/user.entity';
import { UserLoginDto } from './dto/userLogin.dto';
import { UserRegistrationDto } from './dto/userRegistration.dto';
import { UserVerificationDto } from './dto/userVerification.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import * as url from 'url';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { GoogleAuthGuard } from '../../helpers/guards/googleAuth.guard';

@ApiTags('auth')
@Controller('/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'User registration' })
  @ApiCreatedResponse({
    description: 'User registration successful',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'User registration successfully. Verification code sent to your email',
        },
        user: { $ref: getSchemaPath(UserEntity) },
      },
    },
  })
  @ApiBadRequestResponse({
    type: ConflictException,
    description: 'User with email already exists',
  })
  @Post('registration')
  async register(@Body() registrationDto: UserRegistrationDto) {
    return this.authService.registerUser(registrationDto);
  }

  @ApiOperation({ summary: 'Verify user' })
  @ApiOkResponse({
    description: 'Verification code sent successfully',
    schema: {
      type: 'object',
      properties: {
        user: { $ref: getSchemaPath(UserEntity) },
        message: { type: 'string', example: 'User verified successfully!' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    type: BadRequestException,
    description: 'User with email not found',
  })
  @ApiBadRequestResponse({
    type: BadRequestException,
    description: 'Incorrect verification code or verification code expired',
  })
  @ApiBadRequestResponse({
    type: BadRequestException,
    description: 'Verification code is expired',
  })
  @Patch(':userId/verify')
  async verifyUser(
    @Body() dto: UserVerificationDto,
    @Res() res,
    @Param('userId') userId: string,
  ) {
    const user = await this.authService.verifyUser(userId, dto);
    res.cookie('refreshToken', user.refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    res.status(200).json({
      message: 'User verified successfully!',
      user: user.user,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    });
  }

  @ApiOperation({ summary: 'User login' })
  @ApiCreatedResponse({
    description: 'User logged in',
    schema: {
      type: 'object',
      properties: {
        user: { $ref: getSchemaPath(UserEntity) },
        message: { type: 'string', example: 'System user login successfully!' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    type: BadRequestException,
    description: 'User password incorrect!',
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'User with not found!',
  })
  @UseGuards(ThrottlerGuard)
  @Post('login')
  async login(@Body() loginDto: UserLoginDto, @Res() res) {
    const user = await this.authService.loginUser(loginDto);
    res.cookie('refreshToken', user.refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    res.status(200).json({
      message: 'User login successfully',
      user: user.user,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    });
  }

  @ApiOperation({ summary: 'Refresh user tokens' })
  @ApiCreatedResponse({
    description: 'User tokens refreshed in',
    schema: {
      type: 'object',
      properties: {
        user: { $ref: getSchemaPath(UserEntity) },
        message: {
          type: 'string',
          example: 'System user tokens refreshed successfully!',
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedException,
    description: 'User unauthorized',
  })
  @Get('refresh')
  async refresh(@Req() req, @Res() res) {
    const refreshToken = req.cookies['refreshToken'];
    const user = await this.authService.refreshToken(refreshToken);
    res.cookie('refreshToken', user.refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    res.status(200).json({
      message: 'System user tokens refreshed successfully!',
      user: user.user,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    });
  }

  @ApiOperation({ summary: 'User logout' })
  @ApiOkResponse({
    description: 'User logged out',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Log out successfully' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedException,
    description: 'User unauthorized',
  })
  @ApiBearerAuth()
  @Post('logout')
  async logout(@Req() req, @Res() res) {
    const refreshToken = req.cookies['refreshToken'];
    const headers = req.headers;
    const accessToken = headers.authorization.split(' ')[1];
    await this.redisService.setTokenWithExpiry(accessToken, accessToken);
    await this.authService.logoutUser(refreshToken);
    res.clearCookie('refreshToken');
    res.status(200).json({
      message: 'Log out successfully!',
    });
  }

  @ApiOperation({ summary: 'Resend verification code' })
  @Throttle({ default: { limit: 1, ttl: 1000 * 60 * 2 } })
  @UseGuards(ThrottlerGuard)
  @Post(':userId/resend-code')
  async resendVerificationCode(@Param('userId') userId: string) {
    const code = await this.authService.sendVerificationCode(userId);
    return code;
  }

  @ApiOperation({ summary: 'Google authentication redirect' })
  @UseGuards(GoogleAuthGuard)
  @Get('google/redirect')
  async googleAuthRedirect(@Res() res, @Req() req) {
    const responseData = await this.authService.googleLogin(req);
    return res.redirect(
      url.format({
        pathname: this.configService.get('GOOGLE_AUTHORIZATION_REDIRECT'),
        query: responseData.message,
      }),
    );
  }
}
