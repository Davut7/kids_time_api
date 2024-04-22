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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserEntity } from './entities/user.entity';
import { UserTokenDto } from '../token/dto/token.dto';
import { UserService } from './user.service';
import { UserAuthGuard } from 'src/helpers/guards/userAuth.guard';
import { AddExpDto } from './dto/addExp.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { ITransformedFile } from 'src/helpers/common/interfaces/fileTransform.interface';
import { ImageTransformer } from 'src/helpers/pipes/imageTransform.pipe';
import { imageFilter } from 'src/helpers/filters/imageFilter';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(UserAuthGuard)
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
  @UseGuards(UserAuthGuard)
  async addExp(
    @Body() dto: AddExpDto,
    @CurrentUser() currentUser: UserTokenDto,
  ) {
    return this.userService.addExp(currentUser, dto);
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiOkResponse({
    type: UserEntity,
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
    return this.userService.deleteUserById(currentUser);
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
  @UseGuards(UserAuthGuard)
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
}
