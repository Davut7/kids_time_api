import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { ITransformedFile } from 'src/helpers/common/interfaces/fileTransform.interface';
import { AdminAuthGuard } from 'src/helpers/guards/adminAuth.guard';
import { BooksService } from './books.service';
import { BooksEntity } from './entities/books.entity';
import { CreateBookDto } from './dto/createBook.dto';
import { GetBooksQuery } from './dto/getBooks.dto';
import { UpdateBookDto } from './dto/updateBook.dto';
import { BooksAttributesEntity } from './entities/booksAttributes.entity';
import { CreateBookAttributeDto } from './dto/createBookAttribute.dto';
import { UpdateBookAttributeDto } from './dto/updateBookAttribute.dto';
import { PdfTransformer } from 'src/helpers/pipes/booksTransform.pipe';
import { UploadBookDto } from './dto/uploadBook.dto';
import { DownloadBookQuery } from './dto/downloadBook.query';
import { CurrentUser } from 'src/helpers/common/decorators/currentUser.decorator';
import { UserTokenDto } from 'src/client/token/dto/token.dto';
import { UserAuthGuard } from 'src/helpers/guards/userAuth.guard';

@ApiTags('books')
@ApiBearerAuth()
@Controller('/books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @ApiCreatedResponse({
    description: 'Book created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Book created successfully' },
        books: { $ref: getSchemaPath(BooksEntity) },
      },
    },
  })
  @ApiConflictResponse({
    type: ConflictException,
    description: 'Book with this title already exists',
  })
  @UseGuards(AdminAuthGuard)
  @Post(':categoryId')
  async createBooks(
    @Body() dto: CreateBookDto,
    @Param('categoryId') categoryId: string,
  ) {
    return this.booksService.createBooks(dto, categoryId);
  }

  @ApiOkResponse({
    description: 'Book returned successfully',
    schema: {
      type: 'object',
      properties: {
        properties: { items: { $ref: getSchemaPath(BooksEntity) } },
        propertiesCount: { type: 'number' },
      },
    },
  })
  @Get()
  async getBooks(@Query() query: GetBooksQuery) {
    return this.booksService.getBooks(query);
  }

  @ApiOkResponse({
    description: 'Single book retrieved successfully',
    type: BooksEntity,
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Book not found',
  })
  @UseGuards(UserAuthGuard)
  @ApiParam({ name: 'bookId', description: 'Book id' })
  @Get('/:bookId')
  async getOneBooks(
    @Param('bookId') bookId: string,
    @CurrentUser() currentUser: UserTokenDto,
  ) {
    return this.booksService.getOneBook(bookId, currentUser);
  }

  @ApiOkResponse({
    description: 'Book updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Book updated successfully' },
        books: { $ref: getSchemaPath(BooksEntity) },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Book not found',
  })
  @ApiParam({ name: 'bookId', description: 'Book id' })
  @UseGuards(AdminAuthGuard)
  @Patch('/:bookId')
  async updateBooks(
    @Param('bookId') bookId: string,
    @Body() dto: UpdateBookDto,
  ) {
    return this.booksService.updateBooks(bookId, dto);
  }

  @ApiOkResponse({
    description: 'Book deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Book deleted successfully' },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Book not found',
  })
  @ApiParam({ name: 'bookId', description: 'Book id' })
  @UseGuards(AdminAuthGuard)
  @Delete('/:bookId')
  async deleteBooks(@Param('bookId') bookId: string) {
    return this.booksService.deleteBooks(bookId);
  }

  @ApiOkResponse({ description: 'Book uploaded successfully' })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'books not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error while uploading book',
  })
  @ApiConsumes('multipart/form-data')
  @UseGuards(AdminAuthGuard)
  @Post('/medias/:bookId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './temp',
        filename: (req, file, cb) => {
          const uniqueFileName =
            randomUUID() + `_uploaded_${file.originalname}`;
          cb(null, uniqueFileName);
        },
      }),
      // fileFilter: mediaFilter,
      limits: { fileSize: 1024 * 1024 * 1500 },
    }),
  )
  async uploadMedia(
    @UploadedFile(PdfTransformer) file: ITransformedFile,
    @Param('bookId', ParseUUIDPipe) bookId: string,
    @Body() dto: UploadBookDto,
  ) {
    return this.booksService.uploadMedia(file, bookId, dto);
  }

  @ApiOkResponse({
    description: 'Books media uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Books media deleted successfully',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'books not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error while uploading books',
    type: InternalServerErrorException,
  })
  @UseGuards(AdminAuthGuard)
  @Delete('/:bookId/media/:mediaId')
  async deleteBooksMedia(
    @Param('bookId', ParseUUIDPipe) bookId: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ) {
    return this.booksService.deleteMedia(bookId, mediaId);
  }

  @ApiCreatedResponse({
    description: 'books attribute created successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'books attribute created successfully',
        },
        attribute: {
          type: 'object',
          $ref: getSchemaPath(BooksAttributesEntity),
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'books attribute with this language already exists',
  })
  @UseGuards(AdminAuthGuard)
  @Post('/attributes/:bookId')
  async createAttribute(
    @Body() dto: CreateBookAttributeDto,
    @Param('bookId') bookId: string,
  ) {
    return this.booksService.createAttribute(dto, bookId);
  }

  @ApiOkResponse({
    description: 'books attribute updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Attribute updated successfully' },
        attribute: {
          type: 'object',
          $ref: getSchemaPath(BooksAttributesEntity),
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Attribute not found',
  })
  @UseGuards(AdminAuthGuard)
  @Patch('/:bookId/attributes/:attributeId')
  async updateAttribute(
    @Param('bookId') bookId: string,
    @Param('attributeId') attributeId: string,
    @Body() dto: UpdateBookAttributeDto,
  ) {
    return this.booksService.updateAttribute(bookId, attributeId, dto);
  }

  @ApiOkResponse({
    description: 'Books attribute deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Attribute not found',
  })
  @UseGuards(AdminAuthGuard)
  @Delete('/:bookId/attributes/:attributeId')
  async deleteAttribute(
    @Param('bookId') bookId: string,
    @Param('attributeId') attributeId: string,
  ) {
    return this.booksService.deleteAttribute(bookId, attributeId);
  }

  @ApiOkResponse({
    type: String,
    description: 'Returns link for downloading book',
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Book not found',
  })
  @Get('/:bookId/download')
  async downloadBook(
    @Param('bookId') bookId: string,
    @Query() bookLng: DownloadBookQuery,
    @Res() res,
  ) {
    const book = await this.booksService.downloadBook(bookId, bookLng);

    res.send({ url: book.filePath });
  }
}
