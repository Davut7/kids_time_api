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
  ApiOperation,
  ApiParam,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { BooksService } from './books.service';
import { BooksEntity } from './entities/books.entity';
import { CreateBookDto } from './dto/createBook.dto';
import { GetBooksQuery } from './dto/getBooks.dto';
import { UpdateBookDto } from './dto/updateBook.dto';
import { BooksAttributesEntity } from './entities/booksAttributes.entity';
import { CreateBookAttributeDto } from './dto/createBookAttribute.dto';
import { UpdateBookAttributeDto } from './dto/updateBookAttribute.dto';
import { UploadBookDto } from './dto/uploadBook.dto';
import { DownloadBookQuery } from './dto/downloadBook.query';
import { AdminAuthGuard } from '../helpers/guards/adminAuth.guard';
import { UserAuthGuard } from '../helpers/guards/userAuth.guard';
import { PdfTransformer } from '../helpers/pipes/booksTransform.pipe';
import { ITransformedFile } from '../helpers/common/interfaces/fileTransform.interface';
import { UserTokenDto } from '../client/token/dto/token.dto';
import { CurrentUser } from '../helpers/common/decorators/currentUser.decorator';

@ApiTags('books')
@ApiBearerAuth()
@Controller('/books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @ApiOperation({ summary: 'Create a new book' })
  @ApiCreatedResponse({
    description: 'Book created successfully.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Book created successfully' },
        books: { $ref: getSchemaPath(BooksEntity) },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Category not found!',
  })
  @UseGuards(AdminAuthGuard)
  @Post(':categoryId')
  async createBooks(
    @Body() dto: CreateBookDto,
    @Param('categoryId') categoryId: string,
  ) {
    return this.booksService.createBook(dto, categoryId);
  }

  @ApiOperation({ summary: 'Get all books' })
  @ApiOkResponse({
    description: 'Books returned successfully',
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

  @ApiOperation({ summary: 'Get a single book' })
  @ApiOkResponse({
    description: 'Book retrieved by id successfully',
    type: BooksEntity,
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Book not found!',
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

  @ApiOperation({ summary: 'Update a book' })
  @ApiOkResponse({
    description: 'Book updated successfully.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Book updated successfully.' },
        books: { $ref: getSchemaPath(BooksEntity) },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Book not found!',
  })
  @ApiParam({ name: 'bookId', description: 'Book id' })
  @UseGuards(AdminAuthGuard)
  @Patch('/:bookId')
  async updateBooks(
    @Param('bookId') bookId: string,
    @Body() dto: UpdateBookDto,
  ) {
    return this.booksService.updateBook(bookId, dto);
  }

  @ApiOperation({ summary: 'Delete a book' })
  @ApiOkResponse({
    description: 'Book deleted successfully.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Book deleted successfully.' },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Book not found!',
  })
  @ApiParam({ name: 'bookId', description: 'Book id' })
  @UseGuards(AdminAuthGuard)
  @Delete('/:bookId')
  async deleteBooks(@Param('bookId') bookId: string) {
    return this.booksService.deleteBook(bookId);
  }

  @ApiOperation({ summary: 'Upload book media' })
  @ApiOkResponse({ description: 'Book media uploaded successfully.' })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Book not found!',
  })
  @ApiInternalServerErrorResponse({ description: 'Error while uploading book' })
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

  @ApiOperation({ summary: 'Delete book media.' })
  @ApiOkResponse({
    description: 'Book media deleted successfully.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Book media deleted successfully.',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Book not found!',
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

  @ApiOperation({ summary: 'Create a new book attribute.' })
  @ApiCreatedResponse({
    description: 'Book attribute created successfully.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Book attribute created successfully.',
        },
        attribute: {
          type: 'object',
          $ref: getSchemaPath(BooksAttributesEntity),
        },
      },
    },
  })
  @ApiConflictResponse({
    type: ConflictException,
    description: 'Book attribute with this language already exists!',
  })
  @UseGuards(AdminAuthGuard)
  @Post('/attributes/:bookId')
  async createAttribute(
    @Body() dto: CreateBookAttributeDto,
    @Param('bookId') bookId: string,
  ) {
    return this.booksService.createAttribute(dto, bookId);
  }

  @ApiOperation({ summary: 'Update a book attribute.' })
  @ApiOkResponse({
    description: 'Book attribute updated successfully.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Attribute updated successfully.' },
        attribute: {
          type: 'object',
          $ref: getSchemaPath(BooksAttributesEntity),
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Attribute not found!',
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

  @ApiOperation({ summary: 'Delete a book attribute.' })
  @ApiOkResponse({ description: 'Book attribute deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Attribute not found!' })
  @UseGuards(AdminAuthGuard)
  @Delete('/:bookId/attributes/:attributeId')
  async deleteAttribute(
    @Param('bookId') bookId: string,
    @Param('attributeId') attributeId: string,
  ) {
    return this.booksService.deleteAttribute(bookId, attributeId);
  }

  @ApiOperation({ summary: 'Download book.' })
  @ApiOkResponse({
    type: String,
    description: 'Returns link for downloading book.',
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Book not found!',
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
