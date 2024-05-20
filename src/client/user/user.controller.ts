import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserUpdateDto } from './dto/updateUser.dto';
import { CurrentUser } from '../../helpers/common/decorators/currentUser.decorator';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserEntity } from './entities/user.entity';
import { UserTokenDto } from '../token/dto/token.dto';
import { UserService } from './user.service';
import { AddExpDto } from './dto/addExp.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { ImageTransformer } from '../../helpers/pipes/imageTransform.pipe';
import { imageFilter } from '../../helpers/filters/imageFilter';
import { ITransformedFile } from '../../helpers/common/interfaces/fileTransform.interface';
import { GetReadBooksDto } from './dto/getReadBooks.dto';
import { CLIENT_AUTH } from '../../helpers/common/decorators/clientAuth.decorator';

@ApiTags('client-users')
@ApiBearerAuth()
@CLIENT_AUTH()
@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get current user' })
  @ApiOkResponse({
    type: UserEntity,
    description: 'Current user returned successfully!',
  })
  @Get('/get-me')
  async getMe(@CurrentUser() currentUser: UserTokenDto) {
    return this.userService.getMe(currentUser);
  }

  @ApiOperation({ summary: 'Add experience points to user' })
  @ApiOkResponse({
    description: 'Successfully adds experience points to the user.',
  })
  @Patch('/add-exp')
  async addExp(
    @Body() dto: AddExpDto,
    @CurrentUser() currentUser: UserTokenDto,
  ) {
    return this.userService.addExp(currentUser, dto);
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiOkResponse({
    type: UserEntity,
    description: 'Update user data',
  })
  @Patch('')
  async updateUser(
    @CurrentUser() currentUser: UserTokenDto,
    @Body() userUpdateDto: UserUpdateDto,
  ) {
    return this.userService.updateUser(currentUser, userUpdateDto);
  }

  @ApiOperation({ summary: 'Delete user' })
  @ApiOkResponse({
    description: 'User by id deleted',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User deleted successfully!' },
      },
    },
  })
  @Delete('')
  async deleteUser(@CurrentUser() currentUser: UserTokenDto) {
    return this.userService.deleteUser(currentUser);
  }

  @ApiOperation({ summary: 'Upload user image' })
  @ApiOkResponse({ description: 'User image uploaded successfully' })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'User not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error while uploading drawing',
  })
  @ApiConsumes('multipart/form-data')
  @Post('/images')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './temp',
        filename: (req, file, cb) => {
          const uniqueFileName =
            randomUUID() + `_uploaded_${file.originalname}`;
          cb(null, uniqueFileName);
        },
      }),
      fileFilter: imageFilter,
      limits: { fileSize: 1024 * 1024 * 5 },
    }),
  )
  async uploadMedia(
    @UploadedFile(ImageTransformer) image: ITransformedFile,
    @CurrentUser() currentUser: UserTokenDto,
  ) {
    return this.userService.uploadImage(image, currentUser);
  }
  @ApiOperation({ summary: 'Add book to user read list' })
  @ApiOkResponse({
    description: 'Book added to user read list',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Book added to read list' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User or book not found',
  })
  @Post('/read-list/:bookId')
  async addBookToReadList(
    @CurrentUser() currentUser: UserTokenDto,
    @Param('bookId', ParseUUIDPipe) bookId: string,
  ) {
    return await this.userService.addBookToReadList(currentUser, bookId);
  }

  @ApiOperation({ summary: 'Get books read by the current user' })
  @ApiOkResponse({
    description: 'Books read by the current user returned successfully',
    schema: {
      type: 'object',
      properties: {
        books: {
          type: 'array',
          items: {
            type: 'object',
            properties: {},
          },
        },
        booksCount: { type: 'number', example: 5 },
      },
    },
  })
  @Get('/read-list')
  async userReadBooks(
    @CurrentUser() currentUser: UserTokenDto,
    @Query() query: GetReadBooksDto,
  ) {
    const result = await this.userService.userReadBooks(currentUser, query);
    return result;
  }
}
