import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthService } from './auth.service';
import { AdminLoginDto } from './dto/userLogin.dto';
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
import { AdminUserEntity } from '../user/entities/adminUser.entity';
import { RedisService } from '../../redis/redis.service';
import { PUBLIC } from '../../helpers/common/decorators/isPublic.decorator';
import { ADMIN_AUTH } from '../../helpers/common/decorators/adminAuth.decorator';


@ApiTags('auth')
@Controller('/admin/auth')
export class AdminAuthController {
  constructor(
    private readonly authService: AdminAuthService,
    private redisService: RedisService,
  ) {}

  @ApiOperation({ summary: 'User login' })
  @ApiCreatedResponse({
    description: 'User logged in.',
    schema: {
      type: 'object',
      properties: {
        id: { description: 'User id', type: 'string' },
        firstName: { description: 'User first name', type: 'string' },
        message: { type: 'string', example: 'User login successfully.' },
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
    description: 'User not found!',
  })
  @PUBLIC()
  @Post('login')
  async login(@Body() loginDto: AdminLoginDto, @Res() res) {
    const { user, accessToken, refreshToken, message } =
      await this.authService.loginUser(loginDto);
    res.cookie('refreshToken', refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    res.status(200).json({
      message,
      id: user.id,
      firstName: user.firstName,
      accessToken,
      refreshToken,
    });
  }

  @ApiOperation({ summary: 'Refresh user tokens' })
  @ApiCreatedResponse({
    description: 'User tokens refreshed',
    schema: {
      type: 'object',
      properties: {
        user: { $ref: getSchemaPath(AdminUserEntity) },
        message: {
          type: 'string',
          example: 'System user tokens refreshed successfully.',
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
  @PUBLIC()
  @Get('refresh')
  async refresh(@Req() req, @Res() res) {
    const refreshToken = req.cookies['refreshToken'];
    const user = await this.authService.refreshToken(refreshToken);
    res.cookie('refreshToken', user.refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    res.status(200).json({
      message: 'User tokens refreshed successfully.',
      user,
    });
  }

  @ApiOperation({ summary: 'User logout' })
  @ApiOkResponse({
    description: 'User logged out',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Log out successfully.' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedException,
    description: 'User unauthorized',
  })
  @ApiBearerAuth()
  @ADMIN_AUTH()
  @Post('logout')
  async logout(@Req() req, @Res() res) {
    const refreshToken = req.cookies['refreshToken'];
    const headers = req.headers;
    const accessToken = headers.authorization.split(' ')[1];
    await this.redisService.setTokenWithExpiry(accessToken, accessToken);
    await this.authService.logoutUser(refreshToken);
    res.clearCookie('refreshToken');
    res.status(200).json({
      message: 'Log out successfully.',
    });
  }
}
