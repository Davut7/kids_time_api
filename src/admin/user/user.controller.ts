import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { AdminUserService } from './user.service';
import { UserUpdateDto } from './dto/updateUser.dto';
import { CurrentUser } from '../../helpers/common/decorators/currentUser.decorator';
import { AdminTokenDto } from '../token/dto/token.dto';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { AdminUserEntity } from './entities/adminUser.entity';
import { CreateUserDto } from './dto/createUser.dto';
import { AdminAuthGuard } from 'src/helpers/guards/adminAuth.guard';
import { GetUsersQuery } from './dto/getUsers.query';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('/admin/users')
export class AdminUserController {
  constructor(private readonly userService: AdminUserService) {}

  @ApiCreatedResponse({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User created successful!' },
      },
    },
    description: 'User created',
  })
  @ApiConflictResponse({
    type: ConflictException,
    description: 'User with name  already exists!',
  })
  @Post('/create-user')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User returned successfully',
        },
        users: { items: { $ref: getSchemaPath(AdminUserEntity) } },
        usersCount: { type: 'number' },
      },
    },
    description: 'Users returned successfully!',
  })
  @Get()
  async findUsers(@Query() query: GetUsersQuery) {
    return this.userService.getAllUsers(query);
  }

  @ApiOkResponse({
    type: AdminUserEntity,
    description: 'Current user returned successfully!',
  })
  @Get('/get-me')
  async getMe(@CurrentUser() currentUser: AdminTokenDto) {
    return this.userService.getMe(currentUser);
  }

  @ApiOkResponse({
    type: AdminUserEntity,
    description: 'User by id found',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Get(':id')
  async findOneUser(@Param('id', ParseUUIDPipe) userId: string) {
    return this.userService.findUserById(userId);
  }

  @ApiOkResponse({
    type: AdminUserEntity,
    description: 'User by id found',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Patch(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() userUpdateDto: UserUpdateDto,
  ) {
    return this.userService.updateUserById(userId, userUpdateDto);
  }

  @ApiOkResponse({
    description: 'User by id deleted',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User deleted successfully!' },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Delete(':id')
  async deleteUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @CurrentUser() currentUser: AdminTokenDto,
  ) {
    return this.userService.deleteUserById(currentUser.id, userId);
  }
}
